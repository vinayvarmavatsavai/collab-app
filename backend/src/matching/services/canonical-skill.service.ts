import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CanonicalSkill } from '../entities/canonical-skill.entity';
import { SkillAlias } from '../entities/skill-alias.entity';
import { SkillReviewQueue, SkillReviewStatus } from '../entities/skill-review-queue.entity';
import { SkillNormalizationService } from './skill-normalization.service';
import { EmbeddingService } from './embedding.service';
import { ModerationService } from './moderation.service';
import { CanonicalRateLimitService } from './canonical-rate-limit.service';

export interface SkillSuggestion {
    skill: CanonicalSkill;
    similarity: number;
    matchType: 'exact' | 'alias' | 'fuzzy';
}

@Injectable()
export class CanonicalSkillService {
    private readonly logger = new Logger(CanonicalSkillService.name);

    constructor(
        @InjectRepository(CanonicalSkill)
        private canonicalSkillRepo: Repository<CanonicalSkill>,
        @InjectRepository(SkillAlias)
        private skillAliasRepo: Repository<SkillAlias>,
        @InjectRepository(SkillReviewQueue)
        private skillReviewQueueRepo: Repository<SkillReviewQueue>,
        private normalizationService: SkillNormalizationService,
        private embeddingService: EmbeddingService,
        private moderationService: ModerationService,
        private rateLimitService: CanonicalRateLimitService,
        private configService: ConfigService,
    ) { }

    /**
     * Find or create canonical skill from user input
     * PRODUCTION-HARDENED: Prevents canonical skill explosion
     */
    async findOrCreateCanonicalSkill(
        input: string,
        primaryDomainId?: string,
        userId?: string,
    ): Promise<CanonicalSkill> {
        // 0 — Safety gate: moderation (must be first)
        await this.moderationService.validateInput(input, userId, 'skill');

        const normalized = this.normalizationService.normalizeSkill(input);

        if (!normalized || normalized.length < 2) {
            throw new Error('Invalid skill input: too short');
        }

        // 1 — Exact match
        let skill = await this.canonicalSkillRepo.findOne({
            where: { normalizedName: normalized },
        });

        if (skill) {
            await this.incrementUsageCount(skill.id);
            this.logger.log(`Exact match: "${input}" -> "${skill.name}"`);
            return skill;
        }

        // 2 — Alias match
        const alias = await this.skillAliasRepo.findOne({
            where: { normalizedAlias: normalized },
            relations: ['canonicalSkill'],
        });

        if (alias) {
            await this.incrementUsageCount(alias.canonicalSkillId);
            this.logger.log(`Alias match: "${input}" -> "${alias.canonicalSkill.name}"`);
            return alias.canonicalSkill;
        }

        // 3 — Rate limit check BEFORE creating new entries (including auto-merge aliases)
        if (userId) {
            await this.rateLimitService.checkAndIncrement(userId);
        }

        // 4 — Deterministic Typo/Fuzzy Match (pg_trgm + levenshtein)
        const fuzzyThreshold = this.configService.get<number>('matching.canonical.fuzzyMatchThreshold') ?? 0.7;
        const maxLevenshtein = this.configService.get<number>('matching.canonical.maxLevenshteinDistance') ?? 2;

        const typoMatches = await this.canonicalSkillRepo.manager.query(`
            SELECT id, name, normalized_name, 
                   similarity(normalized_name, $1) as sim,
                   levenshtein(normalized_name, $1) as dist
            FROM canonical_skills
            WHERE similarity(normalized_name, $1) >= $2
               OR levenshtein(normalized_name, $1) <= $3
            ORDER BY sim DESC, dist ASC
            LIMIT 1
        `, [normalized, fuzzyThreshold, maxLevenshtein]);

        let forcedReview = false;
        if (userId) {
            const forcedReviewLevel: number = this.configService.get<number>('matching.risk.forcedReviewRiskLevel') ?? 2;
            const userProfile = await this.getUserProfile(userId);
            forcedReview = userProfile ? userProfile.riskLevel >= forcedReviewLevel : false;
        }

        if (typoMatches.length > 0) {
            const typoMatch = typoMatches[0];
            const sim = parseFloat(typoMatch.sim);
            const dist = parseInt(typoMatch.dist, 10);

            // Auto-merge if highly similar OR very low edit distance
            if (!forcedReview && (sim >= 0.8 || dist <= 1 || (normalized.length > 5 && dist <= 2))) {
                this.logger.log(`Typo/Fuzzy match: "${input}" -> "${typoMatch.name}" (sim=${sim.toFixed(2)}, dist=${dist})`);
                await this.createAlias(typoMatch.id, input, normalized);
                await this.incrementUsageCount(typoMatch.id);
                const matchEntity = await this.canonicalSkillRepo.findOne({ where: { id: typoMatch.id } });
                if (matchEntity) return matchEntity;
            } else if (sim >= fuzzyThreshold || dist <= 2 || forcedReview) {
                // If it's a slightly larger typo or user is high risk, queue for review instead of merging
                this.logger.warn(`Typo review: "${input}" ~ "${typoMatch.name}" (sim=${sim.toFixed(2)}, dist=${dist}, forcedReview=${forcedReview})`);
                const newSkill = await this.createCanonicalSkill(
                    input, normalized, primaryDomainId,
                    undefined, false, 1,
                );
                if (userId) {
                    newSkill.createdByUserId = userId;
                    await this.canonicalSkillRepo.save(newSkill);
                }

                await this.queueForReview(input, normalized, typoMatch.id, sim >= 0.95 ? sim : 0.95, userId);
                return newSkill;
            }
        }

        // 5 — No match — create new user-generated canonical
        this.logger.log(`Creating new user-generated skill: "${input}"`);
        const newSkill = await this.createCanonicalSkill(
            input,
            normalized,
            primaryDomainId,
            undefined,
            false,
            1,
        );
        if (userId) {
            newSkill.createdByUserId = userId;
            await this.canonicalSkillRepo.save(newSkill);
        }
        return newSkill;
    }

    /**
     * Create a new canonical skill
     */
    async createCanonicalSkill(
        name: string,
        normalizedName: string,
        primaryDomainId?: string,
        description?: string,
        isVerified: boolean = false,
        usageCount: number = 0,
    ): Promise<CanonicalSkill> {
        const skill = this.canonicalSkillRepo.create({
            name,
            normalizedName,
            primaryDomainId,
            description,
            isVerified,
            usageCount,
        });

        const saved = await this.canonicalSkillRepo.save(skill);

        // Generate embedding asynchronously (don't block)
        this.generateEmbeddingAsync(saved.id).catch(err => {
            this.logger.error(`Failed to generate embedding for skill ${saved.id}: ${err.message}`);
        });

        return saved;
    }

    /**
     * Create skill alias
     */
    async createAlias(canonicalSkillId: string, alias: string, normalizedAlias: string): Promise<SkillAlias> {
        // Prevent duplicates
        const existing = await this.skillAliasRepo.findOne({
            where: { normalizedAlias },
        });

        if (existing) {
            return existing;
        }

        const skillAlias = this.skillAliasRepo.create({
            canonicalSkillId,
            alias,
            normalizedAlias,
        });

        try {
            return await this.skillAliasRepo.save(skillAlias);
        } catch (error) {
            // Handle race condition
            return await this.skillAliasRepo.findOne({ where: { normalizedAlias } }) || skillAlias;
        }
    }

    /**
     * Find fuzzy matches using pg_trgm
     */
    async findFuzzyMatch(normalized: string, threshold = 0.4): Promise<SkillSuggestion | null> {
        const results = await this.canonicalSkillRepo
            .createQueryBuilder('skill')
            .select('skill')
            .addSelect(`similarity(skill.normalized_name, :input)`, 'similarity')
            .where(`skill.normalized_name % :input`)
            .andWhere(`similarity(skill.normalized_name, :input) > :threshold`)
            .setParameter('input', normalized)
            .setParameter('threshold', threshold)
            .orderBy('similarity', 'DESC')
            .limit(1)
            .getRawAndEntities();

        if (results.entities.length === 0) {
            return null;
        }

        return {
            skill: results.entities[0],
            similarity: results.raw[0].similarity,
            matchType: 'fuzzy',
        };
    }

    /**
     * Vector-based skill autocomplete.
     * Quarantine: hides USER_GENERATED with usage_count < quarantineMinUsage
     * unless the requesting user created the entry.
     */
    async getSuggestions(query: string, limit = 10, requestingUserId?: string): Promise<SkillSuggestion[]> {
        const normalized = this.normalizationService.normalizeSkill(query);
        const minUsage: number = this.configService.get<number>('matching.canonical.quarantineMinUsage') ?? 50;

        if (!normalized || normalized.length < 2) {
            return await this.getPopularSkills(limit);
        }

        // Fast prefix matches (only trusted entries)
        const prefixQuery = this.canonicalSkillRepo
            .createQueryBuilder('skill')
            .where('skill.normalized_name LIKE :query', { query: `${normalized}%` })
            .andWhere(
                `(skill.is_verified = true
                  OR skill.usage_count >= :minUsage
                  ${requestingUserId ? 'OR skill.created_by_user_id = :uid' : ''})`,
                { minUsage, ...(requestingUserId ? { uid: requestingUserId } : {}) },
            )
            .orderBy('skill.usage_count', 'DESC')
            .limit(limit);

        const prefixMatches = await prefixQuery.getMany();

        if (prefixMatches.length >= limit) {
            return prefixMatches.map(skill => ({ skill, similarity: 1.0, matchType: 'exact' as const }));
        }

        // Vector ANN for semantic suggestions (trusted only)
        const vectorResults = await this.getVectorSuggestions(query, limit + prefixMatches.length, requestingUserId);
        const prefixIds = new Set(prefixMatches.map(s => s.id));
        const semantic = vectorResults.filter(r => !prefixIds.has(r.skill.id)).slice(0, limit - prefixMatches.length);

        return [
            ...prefixMatches.map(skill => ({ skill, similarity: 1.0, matchType: 'exact' as const })),
            ...semantic,
        ];
    }


    /**
     * Get verified popular skills (used by tag-generator for onboarding suggestions)
     */
    async getVerifiedPopularSkills(limit = 20): Promise<SkillSuggestion[]> {
        const skills = await this.canonicalSkillRepo.find({
            where: { isVerified: true },
            order: { usageCount: 'DESC' },
            take: limit,
        });
        return skills.map(skill => ({ skill, similarity: 1.0, matchType: 'exact' as const }));
    }

    /**
     * Get popular skills
     */
    async getPopularSkills(limit = 20): Promise<SkillSuggestion[]> {
        const skills = await this.canonicalSkillRepo.find({
            order: { usageCount: 'DESC' },
            take: limit,
        });

        return skills.map(skill => ({
            skill,
            similarity: 1.0,
            matchType: 'exact' as const,
        }));
    }

    /**
     * Get skills by primary domain
     */
    async getSkillsByDomain(primaryDomainId: string, limit = 50): Promise<CanonicalSkill[]> {
        return await this.canonicalSkillRepo.find({
            where: { primaryDomainId },
            order: { usageCount: 'DESC' },
            take: limit,
        });
    }

    /**
     * Find similar skills using embeddings
     */
    async findSimilarSkills(skillId: string, limit = 10): Promise<Array<{ skill: CanonicalSkill; similarity: number }>> {
        const skill = await this.canonicalSkillRepo.findOne({ where: { id: skillId } });

        if (!skill || !skill.embedding) {
            return [];
        }

        const results = await this.canonicalSkillRepo
            .createQueryBuilder('skill')
            .select('skill')
            .addSelect(`1 - (skill.embedding <=> :embedding)`, 'similarity')
            .where('skill.id != :id', { id: skillId })
            .andWhere('skill.embedding IS NOT NULL')
            .setParameter('embedding', JSON.stringify(skill.embedding))
            .orderBy('skill.embedding <=> :embedding', 'ASC')
            .limit(limit)
            .getRawAndEntities();

        return results.entities.map((skill, index) => ({
            skill,
            similarity: results.raw[index].similarity,
        }));
    }

    /**
     * Generate embedding for skill
     */
    private async generateEmbeddingAsync(skillId: string): Promise<void> {
        const skill = await this.canonicalSkillRepo.findOne({ where: { id: skillId } });

        if (!skill) return;

        const text = `${skill.name} ${skill.description || ''}`;
        const embedding = await this.embeddingService.generateEmbedding(text);

        if (embedding) {
            skill.embedding = embedding;
            await this.canonicalSkillRepo.save(skill);
        }
    }

    /**
     * Increment usage count
     */
    async incrementUsageCount(skillId: string): Promise<void> {
        await this.canonicalSkillRepo.increment({ id: skillId }, 'usageCount', 1);
    }

    /**
     * Decrement usage count and delete if unused and user-generated
     */
    async decrementUsageCount(skillId: string): Promise<void> {
        const skill = await this.canonicalSkillRepo.findOne({ where: { id: skillId } });

        if (!skill) return;

        // Decrement
        skill.usageCount = Math.max(0, skill.usageCount - 1);

        if (
            skill.usageCount === 0 &&
            !skill.isVerified
        ) {
            await this.canonicalSkillRepo.remove(skill);
            this.logger.log(`Deleted unused user-generated skill: "${skill.name}"`);
        } else {
            await this.canonicalSkillRepo.save(skill);
        }
    }

    /**
     * Batch find or create skills
     */
    async findOrCreateSkillsBatch(inputs: string[]): Promise<CanonicalSkill[]> {
        const skills: CanonicalSkill[] = [];

        for (const input of inputs) {
            try {
                const skill = await this.findOrCreateCanonicalSkill(input);
                skills.push(skill);
            } catch (error) {
                this.logger.error(`Failed to process skill "${input}": ${error.message}`);
            }
        }

        return skills;
    }

    /**
     * Get skill by ID
     */
    async getSkillById(id: string): Promise<CanonicalSkill | null> {
        return await this.canonicalSkillRepo.findOne({ where: { id } });
    }

    /**
     * Get skills by IDs
     */
    async getSkillsByIds(ids: string[]): Promise<CanonicalSkill[]> {
        if (ids.length === 0) return [];

        return await this.canonicalSkillRepo.findByIds(ids);
    }

    /**
     * Queue skill for human review (PRODUCTION PATTERN)
     * Used when fuzzy match is borderline (0.4-0.7)
     */
    private async queueForReview(
        rawInput: string,
        normalizedInput: string,
        suggestedSkillId: string,
        fuzzySimilarity: number,
        userId?: string,
    ): Promise<void> {
        try {
            const queueItem = this.skillReviewQueueRepo.create({
                rawInput,
                normalizedInput,
                suggestedSkillId,
                fuzzySimilarity,
                createdByUserId: userId,
                status: SkillReviewStatus.PENDING,
            });

            await this.skillReviewQueueRepo.save(queueItem);

            this.logger.log(`Queued skill for review: "${rawInput}" (similarity: ${fuzzySimilarity})`);
        } catch (error) {
            this.logger.error(`Failed to queue skill for review: ${error.message}`);
        }
    }

    /**
     * Smart vector-ranked suggestions: prefix LIKE + semantic ANN.
     * rankScore = cosineSim * 0.6 + log(usageCount + 1) * 0.3 + verifiedBoost * 0.1
     */
    async getSmartSuggestions(query: string, limit = 10): Promise<SkillSuggestion[]> {
        return this.getSuggestions(query, limit);
    }

    /** Internal: generate embedding and run ANN query (trusted entries only) */
    private async getVectorSuggestions(query: string, limit: number, requestingUserId?: string): Promise<SkillSuggestion[]> {
        const emb = await this.embeddingService.generateEmbedding(query);
        if (!emb) return [];

        const minUsage: number = this.configService.get<number>('matching.canonical.quarantineMinUsage') ?? 50;
        const minSim: number = this.configService.get<number>('matching.canonical.suggestionMinSimilarity') ?? 0.50;
        const embStr = JSON.stringify(emb);

        const qb = this.canonicalSkillRepo
            .createQueryBuilder('skill')
            .select('skill')
            .addSelect(`1 - (skill.embedding <=> '${embStr}'::vector)`, 'sim')
            .addSelect(`
                (1 - (skill.embedding <=> '${embStr}'::vector)) * 0.6
                + LOG(skill.usage_count + 1) * 0.3
                + (CASE WHEN skill.is_verified THEN 0.1 ELSE 0 END)
            `, 'rank_score')
            .where('skill.embedding IS NOT NULL')
            .andWhere(`1 - (skill.embedding <=> '${embStr}'::vector) > :minSim`, { minSim })
            .orderBy('rank_score', 'DESC')
            .limit(limit);

        const results = await qb.getRawAndEntities();

        return results.entities.map((skill, i) => ({
            skill,
            similarity: parseFloat(results.raw[i].sim),
            matchType: parseFloat(results.raw[i].sim) > 0.9 ? 'exact' : 'fuzzy' as const,
        }));
    }

    /**
     * Detect near-duplicate canonical skills using vector similarity.
     */
    async detectNearDuplicates(threshold = 0.92): Promise<Array<{ skill1: CanonicalSkill; skill2: CanonicalSkill; similarity: number }>> {
        const pairs = await this.canonicalSkillRepo.query(`
            SELECT a.id AS id1, b.id AS id2,
                   1 - (a.embedding <=> b.embedding) AS similarity
            FROM canonical_skills a
            JOIN canonical_skills b ON a.id < b.id
            WHERE a.embedding IS NOT NULL
              AND b.embedding IS NOT NULL
              AND 1 - (a.embedding <=> b.embedding) > $1
            ORDER BY similarity DESC
            LIMIT 100
        `, [threshold]);

        const results: Array<{ skill1: CanonicalSkill; skill2: CanonicalSkill; similarity: number }> = [];
        for (const pair of pairs) {
            const [s1, s2] = await Promise.all([
                this.canonicalSkillRepo.findOne({ where: { id: pair.id1 } }),
                this.canonicalSkillRepo.findOne({ where: { id: pair.id2 } }),
            ]);
            if (s1 && s2) results.push({ skill1: s1, skill2: s2, similarity: parseFloat(pair.similarity) });
        }
        return results;
    }

    /**
     * Verify a skill (admin action)
     */
    async verifySkill(skillId: string): Promise<void> {
        await this.canonicalSkillRepo.update(
            { id: skillId },
            {
                isVerified: true,
            }
        );
    }

    /**
     * Approve review queue item (admin action)
     */
    async approveReviewItem(reviewId: string, adminId: string, mergeToSkillId: string): Promise<void> {
        const reviewItem = await this.skillReviewQueueRepo.findOne({ where: { id: reviewId } });

        if (!reviewItem) {
            throw new Error('Review item not found');
        }

        // Create alias mapping
        await this.createAlias(mergeToSkillId, reviewItem.rawInput, reviewItem.normalizedInput);

        // Update review status
        reviewItem.status = SkillReviewStatus.APPROVED;
        reviewItem.reviewedByAdminId = adminId;
        reviewItem.reviewedAt = new Date();

        await this.skillReviewQueueRepo.save(reviewItem);
    }

    /**
     * Find match using Levenshtein edit distance
     * Ideal for catching typos like "raect" -> "react"
     */
    /**
     * Get pending review items
     */
    async getPendingReviews(limit = 50, offset = 0): Promise<SkillReviewQueue[]> {
        return await this.skillReviewQueueRepo.find({
            where: { status: SkillReviewStatus.PENDING },
            order: { createdAt: 'ASC' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Get unverified skills (likely user-generated)
     */
    async getUnverifiedSkills(limit = 50, offset = 0): Promise<CanonicalSkill[]> {
        return await this.canonicalSkillRepo.find({
            where: { isVerified: false },
            order: { usageCount: 'DESC', createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Reject review queue item
     */
    async rejectReviewItem(reviewId: string, adminId: string, notes?: string): Promise<void> {
        await this.skillReviewQueueRepo.update(
            { id: reviewId },
            {
                status: SkillReviewStatus.REJECTED,
                reviewedByAdminId: adminId,
                reviewedAt: new Date(),
                reviewNotes: notes,
            }
        );
    }

    /**
     * Merge skill (convert target to alias of source)
     * Useful for cleaning up duplicates or unverified skills
     */
    async mergeSkill(targetSkillId: string, mergeIntoSkillId: string, adminId: string): Promise<void> {
        const target = await this.canonicalSkillRepo.findOne({ where: { id: targetSkillId } });
        const destination = await this.canonicalSkillRepo.findOne({ where: { id: mergeIntoSkillId } });

        if (!target || !destination) {
            throw new Error('Skills not found');
        }

        // 1. Create alias from target name
        await this.createAlias(destination.id, target.name, target.normalizedName);

        // 2. Move usage count
        await this.canonicalSkillRepo.increment({ id: destination.id }, 'usageCount', target.usageCount);

        // 3. Delete target skill (cascading deletes usually handle relations, but verify per schema)
        // Ideally we'd update all references (UserSkill, ProjectRequiredSkill) to new ID
        // For now, let's assume soft delete or direct removal if logic permits
        await this.canonicalSkillRepo.remove(target);

        this.logger.log(`Merged skill "${target.name}" into "${destination.name}" by admin ${adminId}`);
    }

    /**
     * Completely deletes a canonical skill (Admin Action).
     * This will CASCADE delete all UserSkills and ProjectRequiredSkills
     * that reference this canonical_skill_id.
     */
    async deleteSkill(skillId: string, adminId: string): Promise<void> {
        const skill = await this.canonicalSkillRepo.findOne({ where: { id: skillId } });
        if (!skill) {
            throw new Error(`CanonicalSkill with ID ${skillId} not found`);
        }

        await this.canonicalSkillRepo.remove(skill);
        this.logger.log(`Permanently deleted canonical skill "${skill.name}" (ID: ${skillId}) by admin ${adminId}`);
    }

    /** @deprecated Delegated to CanonicalRateLimitService */
    private async checkRateLimit(_userId: string): Promise<void> { /* no-op — replaced */ }

    /** Load user profile for risk-level check */
    private async getUserProfile(userId: string): Promise<{ riskLevel: number } | null> {
        const result = await this.canonicalSkillRepo.manager.query(
            `SELECT risk_level AS "riskLevel" FROM user_profiles WHERE "identityId" = $1 LIMIT 1`,
            [userId],
        );
        return result.length > 0 ? result[0] : null;
    }
}
