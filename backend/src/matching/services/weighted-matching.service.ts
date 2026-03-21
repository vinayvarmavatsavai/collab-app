import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { ProjectRequest } from '../entities/project-request.entity';
import { UserSkill } from '../entities/user-skill.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserDomain } from '../entities/user-domain.entity';
import { ProjectRequiredSkill } from '../entities/project-required-skill.entity';
import { ProjectOptionalSkill } from '../entities/project-optional-skill.entity';
import { UserProfileVector } from '../entities/user-profile-vector.entity';
import { CommunityMember } from '../../communities/entities/community-member.entity';
import { ClubMember } from '../../communities/entities/club-member.entity';
import { VectorSimilarityService } from './vector-similarity.service';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface MatchScore {
    userId: string;
    totalScore: number;
    matchPercentage: number;
    breakdown: {
        requiredSkills: {
            score: number;
            weight: number;
            matchedCount: number;
            totalCount: number;
        };
        roleMatch: {
            score: number;
            weight: number;
        };
        domainMatch: {
            score: number;
            weight: number;
        };
        optionalSkills: {
            score: number;
            weight: number;
        };
        profileSimilarity: {
            score: number;
            weight: number;
        };
        profileCompleteness: {
            score: number;
            weight: number;
            percentage: number;
        };
    };
}

export interface MatchConfig {
    requiredSkillsWeight: number;
    roleMatchWeight: number;
    domainMatchWeight: number;
    optionalSkillsWeight: number;
    profileSimilarityWeight: number;
    profileCompletenessWeight: number;
    skillSimilarityThreshold: number;
}

// ---------------------------------------------------------------------------

@Injectable()
export class WeightedMatchingService {
    private readonly logger = new Logger(WeightedMatchingService.name);

    constructor(
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        @InjectRepository(UserSkill)
        private userSkillRepo: Repository<UserSkill>,
        @InjectRepository(UserRole)
        private userRoleRepo: Repository<UserRole>,
        @InjectRepository(UserDomain)
        private userDomainRepo: Repository<UserDomain>,
        @InjectRepository(ProjectRequiredSkill)
        private projectRequiredSkillRepo: Repository<ProjectRequiredSkill>,
        @InjectRepository(ProjectOptionalSkill)
        private projectOptionalSkillRepo: Repository<ProjectOptionalSkill>,
        @InjectRepository(ProjectRequest)
        private projectRequestRepo: Repository<ProjectRequest>,
        @InjectRepository(UserProfileVector)
        private profileVectorRepo: Repository<UserProfileVector>,
        @InjectRepository(CommunityMember)
        private communityMemberRepo: Repository<CommunityMember>,
        @InjectRepository(ClubMember)
        private clubMemberRepo: Repository<ClubMember>,
        private readonly vectorSimilarity: VectorSimilarityService,
        private readonly configService: ConfigService,
    ) { }

    // -----------------------------------------------------------------------
    // Config helpers
    // -----------------------------------------------------------------------

    private getWeights(overrides: Partial<MatchConfig> = {}): MatchConfig {
        const cfg = this.configService.get('matching') ?? {};
        const w = cfg.weights ?? {};

        return {
            requiredSkillsWeight: overrides.requiredSkillsWeight ?? w.requiredSkills ?? 0.40,
            roleMatchWeight: overrides.roleMatchWeight ?? w.role ?? 0.15,
            domainMatchWeight: overrides.domainMatchWeight ?? w.domain ?? 0.20,
            optionalSkillsWeight: overrides.optionalSkillsWeight ?? w.optionalSkills ?? 0.10,
            profileSimilarityWeight: overrides.profileSimilarityWeight ?? w.profileSimilarity ?? 0.10,
            profileCompletenessWeight: overrides.profileCompletenessWeight ?? w.profileCompleteness ?? 0.05,
            skillSimilarityThreshold: overrides.skillSimilarityThreshold
                ?? cfg.skillSimilarityThreshold
                ?? 0.40,
        };
    }

    // -----------------------------------------------------------------------
    // Main scoring entry point
    // -----------------------------------------------------------------------

    async calculateMatchScore(
        userId: string,
        projectId: string,
        configOverrides: Partial<MatchConfig> = {},
    ): Promise<MatchScore> {
        const weights = this.getWeights(configOverrides);

        // --- Load user data -------------------------------------------------
        const userProfile = await this.userProfileRepo.findOne({
            where: { id: userId },
        });
        if (!userProfile) throw new Error(`User profile not found: ${userId}`);

        const userSkillsRaw = await this.userSkillRepo.find({
            where: { userProfileId: userId },
            relations: ['canonicalSkill'],
        });

        // --- Matching engine quarantine filter ---------------------------------
        // Exclude USER_GENERATED canonicals with low usage (potential junk)
        // Exception: if project explicitly selected the canonical, always include it
        const matchingMinUsage: number =
            this.configService.get<number>('matching.canonical.matchingMinUsage') ?? 5;
        const projectSkillIds = new Set<string>();
        for (const s of await this.projectRequiredSkillRepo.find({ where: { projectId } })) {
            projectSkillIds.add(s.canonicalSkillId);
        }

        const userSkills = userSkillsRaw.filter(us => {
            const skill = us.canonicalSkill;
            if (!skill) return false;
            // Always include if project explicitly uses it
            if (projectSkillIds.has(skill.id)) return true;
            // Quarantine: hide low usage and unverified
            if (
                skill.usageCount < matchingMinUsage &&
                !skill.isVerified
            ) return false;
            return true;
        });

        const userRoles = await this.userRoleRepo.find({
            where: { userProfileId: userId },
            relations: ['role'],
        });

        const userDomains = await this.userDomainRepo.find({
            where: { userProfileId: userId },
            relations: ['domain'],
        });

        const profileVector = await this.profileVectorRepo.findOne({
            where: { userProfileId: userId },
        });

        // --- Load project data ----------------------------------------------
        const project = await this.projectRequestRepo.findOne({
            where: { id: projectId },
            relations: ['roles', 'domains'],
        });
        if (!project) throw new Error(`Project request not found: ${projectId}`);

        const projectRequiredSkills = await this.projectRequiredSkillRepo.find({
            where: { projectId },
            relations: ['canonicalSkill'],
        });

        const projectOptionalSkills = await this.projectOptionalSkillRepo.find({
            where: { projectId },
            relations: ['canonicalSkill'],
        });

        // --- Collect user embeddings ----------------------------------------
        const userSkillEmbeddings = userSkills
            .map(us => us.canonicalSkill?.embedding)
            .filter(Boolean) as number[][];

        const userRoleEmbeddings = [
            ...(userRoles.map(ur => ur.role?.embedding).filter(Boolean) as number[][]),
        ];
        // Include primaryRole if set (fetched via profile relation or separate)
        // primaryRole is not loaded here; it's covered if userRoles is populated correctly.

        const userDomainEmbeddings = userDomains
            .map(ud => ud.domain?.embedding)
            .filter(Boolean) as number[][];

        // ====================================================================
        // 1. REQUIRED SKILL SCORE
        //    Σ(maxSim_i × importance_i) / Σ(importance_i)
        //    Skills below skillSimilarityThreshold contribute 0.
        // ====================================================================
        let requiredSkillScore = 1.0; // default: no requirements = perfect
        let aboveThresholdCount = 0;

        if (projectRequiredSkills.length > 0) {
            const weightedItems = projectRequiredSkills
                .filter(prs => !!prs.canonicalSkill?.embedding)
                .map(prs => ({
                    embedding: prs.canonicalSkill.embedding,
                    weight: prs.importance ?? 5,
                }));

            requiredSkillScore = this.vectorSimilarity.weightedAverageSimilarity(
                weightedItems,
                userSkillEmbeddings,
                weights.skillSimilarityThreshold,
            );

            // Count how many required skills are "above threshold" for the breakdown
            for (const prs of projectRequiredSkills) {
                if (!prs.canonicalSkill?.embedding) continue;
                const sim = this.vectorSimilarity.maxSimilarityAgainstList(
                    prs.canonicalSkill.embedding,
                    userSkillEmbeddings,
                );
                if (sim >= weights.skillSimilarityThreshold) aboveThresholdCount++;
            }
        }

        // ====================================================================
        // 2. ROLE SCORE
        //    max cosine similarity across all (project role × user role) pairs
        // ====================================================================
        let roleScore = 1.0; // default: no requirements = perfect

        const projectRoleEmbeddings = (project.roles ?? [])
            .map(r => r.embedding)
            .filter(Boolean) as number[][];

        if (projectRoleEmbeddings.length > 0 && userRoleEmbeddings.length > 0) {
            roleScore = this.vectorSimilarity.averageMaxSimilarity(
                projectRoleEmbeddings,
                userRoleEmbeddings,
                0, // no threshold for roles; any similarity counts
            );
        } else if (projectRoleEmbeddings.length > 0 && userRoleEmbeddings.length === 0) {
            roleScore = 0;
        }

        // ====================================================================
        // 3. DOMAIN SCORE
        //    max cosine similarity across all (project domain × user domain) pairs
        // ====================================================================
        let domainScore = 1.0;

        const projectDomainEmbeddings = (project.domains ?? [])
            .map(d => d.embedding)
            .filter(Boolean) as number[][];

        if (projectDomainEmbeddings.length > 0 && userDomainEmbeddings.length > 0) {
            domainScore = this.vectorSimilarity.averageMaxSimilarity(
                projectDomainEmbeddings,
                userDomainEmbeddings,
                0,
            );
        } else if (projectDomainEmbeddings.length > 0 && userDomainEmbeddings.length === 0) {
            domainScore = 0;
        }

        // ====================================================================
        // 4. OPTIONAL SKILL SCORE
        // ====================================================================
        let optionalSkillScore = 0;

        if (projectOptionalSkills.length > 0) {
            const optionalEmbeddings = projectOptionalSkills
                .map(pos => pos.canonicalSkill?.embedding)
                .filter(Boolean) as number[][];

            optionalSkillScore = this.vectorSimilarity.averageMaxSimilarity(
                optionalEmbeddings,
                userSkillEmbeddings,
                weights.skillSimilarityThreshold,
            );
        }

        // ====================================================================
        // 5. PROFILE SIMILARITY (project embedding vs user profile vector)
        // ====================================================================
        let profileSimilarityScore = 0;

        if (project.embedding && profileVector?.embedding) {
            profileSimilarityScore = this.vectorSimilarity.cosineSimilarity(
                project.embedding,
                profileVector.embedding,
            );
        }

        // ====================================================================
        // 6. PROFILE COMPLETENESS
        // ====================================================================
        const profileCompletenessScore = (userProfile.profileCompleteness ?? 0) / 100;

        // ====================================================================
        // 7. FINAL WEIGHTED SCORE
        // ====================================================================
        const totalScore =
            requiredSkillScore * weights.requiredSkillsWeight +
            roleScore * weights.roleMatchWeight +
            domainScore * weights.domainMatchWeight +
            optionalSkillScore * weights.optionalSkillsWeight +
            profileSimilarityScore * weights.profileSimilarityWeight +
            profileCompletenessScore * weights.profileCompletenessWeight;

        const matchPercentage = Math.round(totalScore * 100);

        this.logger.debug(
            `Score for user ${userId.slice(0, 8)} on project ${projectId.slice(0, 8)}: ` +
            `total=${matchPercentage}% ` +
            `(req=${(requiredSkillScore * 100).toFixed(1)}% ` +
            `role=${(roleScore * 100).toFixed(1)}% ` +
            `domain=${(domainScore * 100).toFixed(1)}%)`
        );

        return {
            userId,
            totalScore,
            matchPercentage,
            breakdown: {
                requiredSkills: {
                    score: requiredSkillScore,
                    weight: weights.requiredSkillsWeight,
                    matchedCount: aboveThresholdCount,
                    totalCount: projectRequiredSkills.length,
                },
                roleMatch: {
                    score: roleScore,
                    weight: weights.roleMatchWeight,
                },
                domainMatch: {
                    score: domainScore,
                    weight: weights.domainMatchWeight,
                },
                optionalSkills: {
                    score: optionalSkillScore,
                    weight: weights.optionalSkillsWeight,
                },
                profileSimilarity: {
                    score: profileSimilarityScore,
                    weight: weights.profileSimilarityWeight,
                },
                profileCompleteness: {
                    score: profileCompletenessScore,
                    weight: weights.profileCompletenessWeight,
                    percentage: userProfile.profileCompleteness ?? 0,
                },
            },
        };
    }

    // -----------------------------------------------------------------------
    // Batch calculation
    // -----------------------------------------------------------------------

    async calculateMatchScoresBatch(
        userIds: string[],
        projectId: string,
        configOverrides: Partial<MatchConfig> = {},
    ): Promise<MatchScore[]> {
        const scores: MatchScore[] = [];

        for (const userId of userIds) {
            try {
                const score = await this.calculateMatchScore(userId, projectId, configOverrides);
                scores.push(score);
            } catch (error) {
                this.logger.error(`Failed to calculate match for user ${userId}: ${error.message}`);
            }
        }

        return scores.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    // -----------------------------------------------------------------------
    // Find best matches for a project
    // -----------------------------------------------------------------------

    async findBestMatches(
        projectId: string,
        limit?: number,
        minScore?: number,
        configOverrides: Partial<MatchConfig> = {},
    ): Promise<MatchScore[]> {
        const cfg = this.configService.get('matching') ?? {};
        const effectiveLimit = limit ?? cfg.defaultFindBestLimit ?? 20;
        const effectiveMinScore = minScore ?? cfg.defaultMinScore ?? 20;

        const project = await this.projectRequestRepo.findOne({
            where: { id: projectId },
        });
        if (!project) throw new Error(`Project request not found: ${projectId}`);

        const userIds = await this.getEligibleUsersForProject(project);
        const scores = await this.calculateMatchScoresBatch(userIds, projectId, configOverrides);

        return scores
            .filter(s => s.matchPercentage >= effectiveMinScore)
            .slice(0, effectiveLimit);
    }

    // -----------------------------------------------------------------------
    // Scope-based user pool
    // -----------------------------------------------------------------------

    private async getEligibleUsersForProject(project: ProjectRequest): Promise<string[]> {
        if (!project.matchingScope || project.matchingScope === 'GLOBAL') {
            const users = await this.userProfileRepo.find({
                select: ['id'],
                where: { onboardingCompleted: true },
            });
            return users.map(u => u.id);
        }

        if (project.matchingScope === 'COMMUNITY') {
            if (!project.communityIds || project.communityIds.length === 0) return [];

            const members = await this.communityMemberRepo
                .createQueryBuilder('cm')
                .select('cm.userId')
                .where('cm.communityId IN (:...ids)', { ids: project.communityIds })
                .getMany();

            return [...new Set(members.map(m => m.userId))];
        }

        if (project.matchingScope === 'CLUB') {
            if (!project.clubIds || project.clubIds.length === 0) return [];

            const members = await this.clubMemberRepo
                .createQueryBuilder('cm')
                .select('cm.userId')
                .where('cm.clubId IN (:...ids)', { ids: project.clubIds })
                .getMany();

            return [...new Set(members.map(m => m.userId))];
        }

        return [];
    }
}
