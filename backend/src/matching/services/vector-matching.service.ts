import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserProfileVector } from '../entities/user-profile-vector.entity';
import { MilestoneVector } from '../entities/milestone-vector.entity';
import { ProjectRequest } from '../entities/project-request.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { UserSkill } from '../entities/user-skill.entity';
import { UserDomain } from '../entities/user-domain.entity';
import { VectorSimilarityService } from './vector-similarity.service';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface MatchCandidate {
    userId: string;
    score: number;
    profileSimilarity: number;
    milestoneSimilarity: number;
    requiredSkillVectorScore: number;
    domainVectorScore: number;
    isExactMatchPassed?: boolean;
}

interface RequiredSkillInfo {
    id: string;
    name: string;
    embedding: number[];
    primaryDomainId: string;
}

// ---------------------------------------------------------------------------

@Injectable()
export class VectorMatchingService {
    private readonly logger = new Logger(VectorMatchingService.name);

    constructor(
        @InjectRepository(UserProfileVector)
        private profileVectorRepo: Repository<UserProfileVector>,
        @InjectRepository(MilestoneVector)
        private milestoneVectorRepo: Repository<MilestoneVector>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        @InjectRepository(UserSkill)
        private userSkillRepo: Repository<UserSkill>,
        @InjectRepository(UserDomain)
        private userDomainRepo: Repository<UserDomain>,
        private readonly vectorSimilarity: VectorSimilarityService,
        private readonly configService: ConfigService,
    ) { }

    // -----------------------------------------------------------------------
    // Step 1: Eligible candidate pool
    // Public profiles with completed onboarding, excluding the project creator.
    // -----------------------------------------------------------------------

    async getEligibleCandidates(creatorId: string): Promise<string[]> {
        const result = await this.profileVectorRepo
            .createQueryBuilder('upv')
            .select('upv.user_profile_id', 'userId')
            .innerJoin('user_profiles', 'up', 'up.id = upv.user_profile_id')
            .where('upv.user_profile_id != :creatorId', { creatorId })
            .andWhere('up."isProfilePublic" = true')
            .andWhere('up."onboardingCompleted" = true')
            .getRawMany();

        return result.map(r => r.userId);
    }

    // -----------------------------------------------------------------------
    // Step 2: ANN search — top N by profile vector cosine similarity
    // -----------------------------------------------------------------------

    async findSimilarProfiles(
        projectEmbedding: number[],
        eligibleUserIds: string[],
        limit = 200,
    ): Promise<Array<{ userId: string; similarity: number }>> {
        if (!projectEmbedding || eligibleUserIds.length === 0) return [];

        const embeddingStr = `[${projectEmbedding.join(',')}]`;

        const result = await this.profileVectorRepo
            .createQueryBuilder('upv')
            .select('upv.user_profile_id', 'userId')
            .addSelect(`1 - (upv.embedding <=> '${embeddingStr}')`, 'similarity')
            .where('upv.user_profile_id = ANY(:userIds)', { userIds: eligibleUserIds })
            .andWhere('upv.embedding IS NOT NULL')
            .orderBy(`upv.embedding <=> '${embeddingStr}'`, 'ASC')
            .limit(limit)
            .getRawMany();

        return result.map(r => ({
            userId: r.userId,
            similarity: parseFloat(r.similarity),
        }));
    }

    // -----------------------------------------------------------------------
    // Step 3a: Required skill vector score
    // For each project required skill embedding, find the user's best-matching
    // user_skill embedding using ANN. Average across all required skills.
    // -----------------------------------------------------------------------

    async computeRequiredSkillVectorScore(
        userId: string,
        projectRequiredSkills: RequiredSkillInfo[],
        threshold: number,
    ): Promise<number> {
        if (projectRequiredSkills.length === 0) return 1.0;

        // Fetch all user skills with their domain
        const userSkills = await this.userSkillRepo.find({
            where: { userProfileId: userId },
            relations: ['canonicalSkill'],
        });

        if (userSkills.length === 0) return 0;

        // Group user skills by primary domain for O(1) subset lookup
        const userSkillsByDomain = new Map<string, number[][]>();
        const userSkillIds = new Set<string>();

        for (const us of userSkills) {
            if (!us.canonicalSkill) continue;
            userSkillIds.add(us.canonicalSkill.id);

            const domainId = us.canonicalSkill.primaryDomainId;
            const existing = userSkillsByDomain.get(domainId) || [];
            if (us.canonicalSkill.embedding) {
                existing.push(us.canonicalSkill.embedding);
                userSkillsByDomain.set(domainId, existing);
            }
        }

        let total = 0;
        const DOMAIN_MATCH_THRESHOLD = 0.75; // Strict limit to prevent drift

        for (const req of projectRequiredSkills) {
            // 1. Check Exact Match (Score = 1.0)
            if (userSkillIds.has(req.id)) {
                total += 1.0;
                this.logger.debug(`Candidate ${userId} matched exact skill: ${req.name}`);
                continue;
            }

            // 2. Domain-Restricted Semantic Match
            const domainSubset = userSkillsByDomain.get(req.primaryDomainId);
            if (!domainSubset || domainSubset.length === 0) {
                // No skills in this domain = no semantic match allowed
                this.logger.debug(`Candidate ${userId} has no skills in primary domain ${req.primaryDomainId} required for skill ${req.name}`);
                total += 0;
                continue;
            }

            const sim = this.vectorSimilarity.maxSimilarityAgainstList(req.embedding, domainSubset);

            // Only count if it meets the high semantic confidence threshold
            if (sim >= DOMAIN_MATCH_THRESHOLD) {
                this.logger.debug(`Candidate ${userId} matched semantic skill ${req.name} with highest score ${sim} (>= ${DOMAIN_MATCH_THRESHOLD})`);
                total += sim;
            } else {
                this.logger.debug(`Candidate ${userId} failed semantic match for ${req.name} with highest score ${sim} (below threshold ${DOMAIN_MATCH_THRESHOLD})`);
            }
        }

        return total / projectRequiredSkills.length;
    }

    // -----------------------------------------------------------------------
    // Step 3b: Domain vector score
    // -----------------------------------------------------------------------

    async computeDomainVectorScore(
        userId: string,
        projectDomainEmbeddings: number[][],
    ): Promise<number> {
        if (projectDomainEmbeddings.length === 0) return 1.0;

        const userDomains = await this.userDomainRepo.find({
            where: { userProfileId: userId },
            relations: ['domain'],
        });

        const userDomainEmbeddings = userDomains
            .map(ud => ud.domain?.embedding)
            .filter(Boolean) as number[][];

        if (userDomainEmbeddings.length === 0) return 0;

        return this.vectorSimilarity.averageMaxSimilarity(
            projectDomainEmbeddings,
            userDomainEmbeddings,
            0,
        );
    }

    // -----------------------------------------------------------------------
    // Step 3c: Milestone similarity — max across last 20 milestones
    // -----------------------------------------------------------------------

    async getMaxMilestoneSimilarity(
        userId: string,
        projectEmbedding: number[],
    ): Promise<number> {
        if (!projectEmbedding) return 0;

        const embeddingStr = `[${projectEmbedding.join(',')}]`;

        const result = await this.milestoneVectorRepo
            .createQueryBuilder('mv')
            .select(`1 - (mv.embedding <=> '${embeddingStr}')`, 'similarity')
            .where('mv.user_profile_id = :userId', { userId })
            .andWhere('mv.embedding IS NOT NULL')
            .orderBy('mv.created_at', 'DESC')
            .limit(20)
            .getRawMany();

        if (!result || result.length === 0) return 0;

        return Math.max(...result.map(r => parseFloat(r.similarity)));
    }

    // -----------------------------------------------------------------------
    // Full pipeline
    // -----------------------------------------------------------------------

    async matchCandidates(
        project: ProjectRequest,
        topN = 50,
    ): Promise<MatchCandidate[]> {
        this.logger.log(`Starting vector matching for project ${project.id}`);

        const cfg = this.configService.get('matching') ?? {};
        const hw = cfg.hybridWeights ?? {};
        const annLimit = cfg.candidateAnnLimit ?? 200;
        const skillThreshold = cfg.skillSimilarityThreshold ?? 0.40;

        const wProfile = hw.profileSimilarity ?? 0.35;
        const wMilestone = hw.milestoneSimilarity ?? 0.25;
        const wSkillVector = hw.requiredSkillVector ?? 0.30;
        const wDomain = hw.domainVector ?? 0.10;

        // Step 1: eligible pool
        const eligibleUserIds = await this.getEligibleCandidates(project.creatorId);
        this.logger.log(`Eligible candidates: ${eligibleUserIds.length}`);

        if (eligibleUserIds.length === 0) return [];

        // Step 2: ANN profile search — top annLimit
        const similarProfiles = await this.findSimilarProfiles(
            project.embedding,
            eligibleUserIds,
            annLimit,
        );
        this.logger.log(`ANN returned ${similarProfiles.length} profile candidates`);

        if (similarProfiles.length === 0) return [];

        // Fetch project required skills with domain info
        const projectRequiredSkills = await this.fetchProjectRequiredSkills(project.id);
        const projectDomainEmbeddings = (project.domains ?? [])
            .map(d => d.embedding)
            .filter(Boolean) as number[][];

        // Hard Gate Check: Pre-filter by exact match ratio
        // MIN_EXACT_MATCH_RATIO = 0.5 (Need at least 50% exact matches or high similarity)
        // For now, we'll implement a simple threshold: if user has 0 skills in the required domains, reject.
        const MIN_EXACT_RATIO = 0.2; // 20% exact matches required to proceed to expensive vector math

        // Step 3: Score each candidate
        const scoredCandidates = await Promise.all(
            similarProfiles.map(async (candidate) => {
                const requiredSkillVectorScore = await this.computeRequiredSkillVectorScore(
                    candidate.userId,
                    projectRequiredSkills,
                    skillThreshold,
                );

                // Early rejection for candidates with 0 overlap in required domains
                if (projectRequiredSkills.length > 0 && requiredSkillVectorScore === 0) {
                    this.logger.debug(`Candidate ${candidate.userId} early rejected: requiredSkillVectorScore is 0 (no skills met threshold)`);
                    return null;
                }

                const milestoneSimilarity = await this.getMaxMilestoneSimilarity(
                    candidate.userId,
                    project.embedding,
                );

                const domainVectorScore = await this.computeDomainVectorScore(
                    candidate.userId,
                    projectDomainEmbeddings,
                );

                const hybridScore =
                    wProfile * candidate.similarity +
                    wMilestone * milestoneSimilarity +
                    wSkillVector * requiredSkillVectorScore +
                    wDomain * domainVectorScore;

                return {
                    userId: candidate.userId,
                    score: hybridScore,
                    profileSimilarity: candidate.similarity,
                    milestoneSimilarity,
                    requiredSkillVectorScore,
                    domainVectorScore,
                } as MatchCandidate;
            }),
        );

        // Step 4: Filter candidates based on threshold and remove nulls
        const validCandidates = scoredCandidates.filter((c): c is MatchCandidate => c !== null);

        const filtered = validCandidates.filter(c => {
            const passed = projectRequiredSkills.length === 0 || c.requiredSkillVectorScore >= skillThreshold;
            if (!passed) {
                this.logger.debug(`Candidate ${c.userId} rejected later: requiredSkillVectorScore ${c.requiredSkillVectorScore} is below skillThreshold ${skillThreshold}`);
            }
            return passed;
        });

        const filteredCount = validCandidates.length - filtered.length;
        if (filteredCount > 0) {
            this.logger.log(`Filtered ${filteredCount} candidates below skill threshold (${skillThreshold})`);
        }

        // Step 5: Sort and return top N
        const topCandidates = filtered
            .sort((a, b) => b.score - a.score)
            .slice(0, topN);

        if (topCandidates.length > 0) {
            this.logger.log(`\n=== Match Scores for Project ${project.id} ===`);
            topCandidates.slice(0, 10).forEach((c, i) => {
                this.logger.log(
                    `#${i + 1} ${c.userId.slice(0, 8)}… ` +
                    `overall=${(c.score * 100).toFixed(1)}% ` +
                    `profile=${(c.profileSimilarity * 100).toFixed(1)}% ` +
                    `milestone=${(c.milestoneSimilarity * 100).toFixed(1)}% ` +
                    `skills=${(c.requiredSkillVectorScore * 100).toFixed(1)}% ` +
                    `domain=${(c.domainVectorScore * 100).toFixed(1)}%`
                );
            });
            this.logger.log(`===========================================`);
        }

        this.logger.log(`Selected top ${topCandidates.length} candidates`);
        return topCandidates;
    }

    // -----------------------------------------------------------------------
    // Helper: fetch required skill embeddings from the project_required_skills table
    // -----------------------------------------------------------------------

    private async fetchProjectRequiredSkills(projectId: string): Promise<RequiredSkillInfo[]> {
        const rows = await this.profileVectorRepo.manager.query(`
            SELECT cs.id, cs.name, cs.embedding, cs.primary_domain_id as "primaryDomainId"
            FROM project_required_skills prs
            JOIN canonical_skills cs ON cs.id = prs.canonical_skill_id
            WHERE prs.project_id = $1
              AND cs.embedding IS NOT NULL
        `, [projectId]);

        return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            embedding: typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding,
            primaryDomainId: r.primaryDomainId
        }));
    }
}
