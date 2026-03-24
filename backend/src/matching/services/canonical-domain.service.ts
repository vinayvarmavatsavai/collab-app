import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Domain } from '../entities/domain.entity';
import { DomainAlias } from '../entities/domain-alias.entity';
import { DomainReviewQueue, DomainReviewStatus } from '../entities/domain-review-queue.entity';
import { SkillNormalizationService } from './skill-normalization.service';
import { EmbeddingService } from './embedding.service';
import { ModerationService } from './moderation.service';
import { CanonicalRateLimitService } from './canonical-rate-limit.service';

export interface DomainSuggestion {
    domain: Domain;
    similarity: number;
    matchType: 'exact' | 'alias' | 'fuzzy';
}

@Injectable()
export class CanonicalDomainService {
    private readonly logger = new Logger(CanonicalDomainService.name);

    constructor(
        @InjectRepository(Domain)
        private domainRepo: Repository<Domain>,
        @InjectRepository(DomainAlias)
        private domainAliasRepo: Repository<DomainAlias>,
        @InjectRepository(DomainReviewQueue)
        private domainReviewQueueRepo: Repository<DomainReviewQueue>,
        private normalizationService: SkillNormalizationService,
        private embeddingService: EmbeddingService,
        private moderationService: ModerationService,
        private rateLimitService: CanonicalRateLimitService,
        private configService: ConfigService,
    ) { }

    async findOrCreateCanonicalDomain(
        input: string,
        parentDomainId?: string,
        userId?: string,
    ): Promise<Domain> {
        await this.moderationService.validateInput(input, userId, 'domain');

        const raw = (input || '').trim();
        const normalized = this.normalizationService.normalizeSkill(raw);

        this.logger.log(`DOMAIN INPUT RECEIVED: ${raw}`);
        this.logger.log(`DOMAIN NORMALIZED: ${normalized}`);

        if (!normalized || normalized.length < 2) {
            throw new Error('Invalid domain input: too short');
        }

        // 1. Exact match by normalized name
        let domain = await this.domainRepo.findOne({
            where: { normalizedName: normalized },
        });

        if (domain) {
            await this.incrementUsageCount(domain.id);
            this.logger.log(`Exact normalized domain match: "${raw}" -> "${domain.name}"`);
            return domain;
        }

        // 2. Exact match by actual name (case-insensitive)
        domain = await this.domainRepo.findOne({
            where: { name: ILike(raw) },
        });

        if (domain) {
            await this.incrementUsageCount(domain.id);
            this.logger.log(`Exact domain name match: "${raw}" -> "${domain.name}"`);
            return domain;
        }

        // 3. Alias match by normalized alias
        const alias = await this.domainAliasRepo.findOne({
            where: { normalizedAlias: normalized },
            relations: ['domain'],
        });

        if (alias?.domain) {
            await this.incrementUsageCount(alias.domainId);
            this.logger.log(`Alias domain match: "${raw}" -> "${alias.domain.name}"`);
            return alias.domain;
        }

        // 4. Alias match by actual alias text (case-insensitive)
        const aliasByName = await this.domainAliasRepo.findOne({
            where: { alias: ILike(raw) },
            relations: ['domain'],
        });

        if (aliasByName?.domain) {
            await this.incrementUsageCount(aliasByName.domainId);
            this.logger.log(`Alias-by-name domain match: "${raw}" -> "${aliasByName.domain.name}"`);
            return aliasByName.domain;
        }

        // 5. Rate limit before create
        if (userId) {
            await this.rateLimitService.checkAndIncrement(userId);
        }

        // 6. Fuzzy fallback
        const fuzzyThreshold = this.configService.get<number>('matching.canonical.fuzzyMatchThreshold') ?? 0.7;
        const maxLevenshtein = this.configService.get<number>('matching.canonical.maxLevenshteinDistance') ?? 2;

        const typoMatches = await this.domainRepo.manager.query(`
            SELECT id, name, normalized_name,
                   similarity(normalized_name, $1) as sim,
                   levenshtein(normalized_name, $1) as dist
            FROM domains
            WHERE similarity(normalized_name, $1) >= $2
               OR levenshtein(normalized_name, $1) <= $3
            ORDER BY sim DESC, dist ASC
            LIMIT 1
        `, [normalized, fuzzyThreshold, maxLevenshtein]);

        let forcedReview = false;
        if (userId) {
            const forcedReviewLevel = this.configService.get<number>('matching.risk.forcedReviewRiskLevel') ?? 2;
            const userProfile = await this.getUserProfile(userId);
            forcedReview = userProfile ? userProfile.riskLevel >= forcedReviewLevel : false;
        }

        if (typoMatches.length > 0) {
            const typoMatch = typoMatches[0];
            const sim = parseFloat(typoMatch.sim);
            const dist = parseInt(typoMatch.dist, 10);

            if (!forcedReview && (sim >= 0.8 || dist <= 1 || (normalized.length > 5 && dist <= 2))) {
                this.logger.log(`Typo/Fuzzy domain match: "${raw}" -> "${typoMatch.name}" (sim=${sim.toFixed(2)}, dist=${dist})`);
                await this.createAlias(typoMatch.id, raw, normalized);
                await this.incrementUsageCount(typoMatch.id);

                const matchEntity = await this.domainRepo.findOne({ where: { id: typoMatch.id } });
                if (matchEntity) return matchEntity;
            } else if (sim >= fuzzyThreshold || dist <= 2 || forcedReview) {
                this.logger.warn(`Typo review domain: "${raw}" ~ "${typoMatch.name}" (sim=${sim.toFixed(2)}, dist=${dist}, forcedReview=${forcedReview})`);

                const newDomain = await this.createCanonicalDomain(
                    raw,
                    normalized,
                    parentDomainId,
                    undefined,
                    false,
                    1,
                );

                if (userId) {
                    newDomain.createdByUserId = userId;
                    await this.domainRepo.save(newDomain);
                }

                await this.queueForReview(raw, normalized, typoMatch.id, sim >= 0.95 ? sim : 0.95, userId);
                return newDomain;
            }
        }

        // 7. Final fallback: create new canonical domain
        this.logger.log(`Creating new user-generated domain: "${raw}"`);

        const newDomain = await this.createCanonicalDomain(
            raw,
            normalized,
            parentDomainId,
            undefined,
            false,
            1,
        );

        if (userId) {
            newDomain.createdByUserId = userId;
            await this.domainRepo.save(newDomain);
        }

        return newDomain;
    }

    async createCanonicalDomain(
        name: string,
        normalizedName: string,
        parentDomainId?: string,
        description?: string,
        isVerified: boolean = false,
        usageCount: number = 0,
    ): Promise<Domain> {
        const domain = this.domainRepo.create({
            name,
            normalizedName,
            parentDomainId,
            description,
            isVerified,
            usageCount,
        });

        const saved = await this.domainRepo.save(domain);

        this.generateEmbeddingAsync(saved.id).catch(err => {
            this.logger.error(`Failed to generate embedding for domain ${saved.id}: ${err.message}`);
        });

        return saved;
    }

    async createAlias(domainId: string, alias: string, normalizedAlias: string): Promise<DomainAlias> {
        const existing = await this.domainAliasRepo.findOne({
            where: { normalizedAlias },
        });

        if (existing) {
            return existing;
        }

        const domainAlias = this.domainAliasRepo.create({
            domainId,
            alias,
            normalizedAlias,
        });

        try {
            return await this.domainAliasRepo.save(domainAlias);
        } catch {
            return await this.domainAliasRepo.findOne({ where: { normalizedAlias } }) || domainAlias;
        }
    }

    async findFuzzyMatch(normalized: string, _threshold = 0.4): Promise<DomainSuggestion | null> {
        const results = await this.getVectorSuggestions(normalized, 1);
        return results.length > 0 ? results[0] : null;
    }

    async getSuggestions(query: string, limit = 10, requestingUserId?: string): Promise<DomainSuggestion[]> {
        const normalized = this.normalizationService.normalizeSkill(query);
        const minUsage = this.configService.get<number>('matching.canonical.quarantineMinUsage') ?? 50;

        if (!normalized || normalized.length < 2) {
            return await this.getPopularDomains(limit);
        }

        const prefixMatches = await this.domainRepo
            .createQueryBuilder('domain')
            .where('domain.normalized_name LIKE :query', { query: `${normalized}%` })
            .andWhere(
                `(domain.is_verified = true
                  OR domain.usage_count >= :minUsage
                  ${requestingUserId ? 'OR domain.created_by_user_id = :uid' : ''})`,
                { minUsage, ...(requestingUserId ? { uid: requestingUserId } : {}) },
            )
            .orderBy('domain.usage_count', 'DESC')
            .limit(limit)
            .getMany();

        if (prefixMatches.length >= limit) {
            return prefixMatches.map(domain => ({ domain, similarity: 1.0, matchType: 'exact' as const }));
        }

        const vectorResults = await this.getVectorSuggestions(query, limit + prefixMatches.length, requestingUserId);
        const prefixIds = new Set(prefixMatches.map(d => d.id));
        const semantic = vectorResults.filter(r => !prefixIds.has(r.domain.id)).slice(0, limit - prefixMatches.length);

        return [
            ...prefixMatches.map(domain => ({ domain, similarity: 1.0, matchType: 'exact' as const })),
            ...semantic,
        ];
    }

    async getPopularDomains(limit = 20): Promise<DomainSuggestion[]> {
        const domains = await this.domainRepo.find({
            order: { usageCount: 'DESC' },
            take: limit,
        });

        return domains.map(domain => ({
            domain,
            similarity: 1.0,
            matchType: 'exact' as const,
        }));
    }

    async findSimilarDomains(domainId: string, limit = 10): Promise<Array<{ domain: Domain; similarity: number }>> {
        const domain = await this.domainRepo.findOne({ where: { id: domainId } });

        if (!domain || !domain.embedding) {
            return [];
        }

        const results = await this.domainRepo
            .createQueryBuilder('domain')
            .select('domain')
            .addSelect(`1 - (domain.embedding <=> :embedding)`, 'similarity')
            .where('domain.id != :id', { id: domainId })
            .andWhere('domain.embedding IS NOT NULL')
            .setParameter('embedding', JSON.stringify(domain.embedding))
            .orderBy('domain.embedding <=> :embedding', 'ASC')
            .limit(limit)
            .getRawAndEntities();

        return results.entities.map((domain, index) => ({
            domain,
            similarity: results.raw[index].similarity,
        }));
    }

    private async generateEmbeddingAsync(domainId: string): Promise<void> {
        const domain = await this.domainRepo.findOne({ where: { id: domainId } });

        if (!domain) return;

        const text = `${domain.name} ${domain.description || ''}`;
        const embedding = await this.embeddingService.generateEmbedding(text);

        if (embedding) {
            domain.embedding = embedding;
            await this.domainRepo.save(domain);
        }
    }

    async incrementUsageCount(domainId: string): Promise<void> {
        await this.domainRepo.increment({ id: domainId }, 'usageCount', 1);
    }

    async decrementUsageCount(domainId: string): Promise<void> {
        const domain = await this.domainRepo.findOne({ where: { id: domainId } });

        if (!domain) return;

        domain.usageCount = Math.max(0, domain.usageCount - 1);

        if (domain.usageCount === 0 && !domain.isVerified) {
            await this.domainRepo.remove(domain);
            this.logger.log(`Deleted unused user-generated domain: "${domain.name}"`);
        } else {
            await this.domainRepo.save(domain);
        }
    }

    async getSmartSuggestions(query: string, limit = 10): Promise<DomainSuggestion[]> {
        return this.getSuggestions(query, limit);
    }

    private async getVectorSuggestions(query: string, limit: number, requestingUserId?: string): Promise<DomainSuggestion[]> {
        const emb = await this.embeddingService.generateEmbedding(query);
        if (!emb) return [];

        const minUsage = this.configService.get<number>('matching.canonical.quarantineMinUsage') ?? 50;
        const minSim = this.configService.get<number>('matching.canonical.suggestionMinSimilarity') ?? 0.50;
        const embStr = JSON.stringify(emb);

        const results = await this.domainRepo
            .createQueryBuilder('domain')
            .select('domain')
            .addSelect(`1 - (domain.embedding <=> '${embStr}'::vector)`, 'sim')
            .addSelect(`
                (1 - (domain.embedding <=> '${embStr}'::vector)) * 0.6
                + LOG(domain.usage_count + 1) * 0.3
                + (CASE WHEN domain.is_verified THEN 0.1 ELSE 0 END)
            `, 'rank_score')
            .where('domain.embedding IS NOT NULL')
            .andWhere(`1 - (domain.embedding <=> '${embStr}'::vector) > :minSim`, { minSim })
            .orderBy('rank_score', 'DESC')
            .limit(limit)
            .getRawAndEntities();

        return results.entities.map((domain, i) => ({
            domain,
            similarity: parseFloat(results.raw[i].sim),
            matchType: parseFloat(results.raw[i].sim) > 0.9 ? 'exact' : 'fuzzy' as const,
        }));
    }

    private async queueForReview(
        rawInput: string,
        normalizedInput: string,
        suggestedDomainId: string,
        fuzzySimilarity: number,
        userId?: string,
    ): Promise<void> {
        try {
            const queueItem = this.domainReviewQueueRepo.create({
                rawInput,
                normalizedInput,
                suggestedDomainId,
                fuzzySimilarity,
                createdByUserId: userId,
                status: DomainReviewStatus.PENDING,
            });

            await this.domainReviewQueueRepo.save(queueItem);
            this.logger.log(`Queued domain for review: "${rawInput}" (similarity: ${fuzzySimilarity})`);
        } catch (error: any) {
            this.logger.error(`Failed to queue domain for review: ${error.message}`);
        }
    }

    async getPendingReviews(limit = 50, offset = 0): Promise<DomainReviewQueue[]> {
        return await this.domainReviewQueueRepo.find({
            where: { status: DomainReviewStatus.PENDING },
            order: { createdAt: 'ASC' },
            take: limit,
            skip: offset,
        });
    }

    async getUnverifiedDomains(limit = 50, offset = 0): Promise<Domain[]> {
        return await this.domainRepo.find({
            where: { isVerified: false },
            order: { usageCount: 'DESC', createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async rejectReviewItem(reviewId: string, adminId: string, notes?: string): Promise<void> {
        await this.domainReviewQueueRepo.update(
            { id: reviewId },
            {
                status: DomainReviewStatus.REJECTED,
                reviewedByAdminId: adminId,
                reviewedAt: new Date(),
                reviewNotes: notes,
            }
        );
    }

    async approveReviewItem(reviewId: string, adminId: string, mergeToDomainId: string): Promise<void> {
        const reviewItem = await this.domainReviewQueueRepo.findOne({ where: { id: reviewId } });

        if (!reviewItem) {
            throw new Error('Review item not found');
        }

        await this.createAlias(mergeToDomainId, reviewItem.rawInput, reviewItem.normalizedInput);

        reviewItem.status = DomainReviewStatus.APPROVED;
        reviewItem.reviewedByAdminId = adminId;
        reviewItem.reviewedAt = new Date();

        await this.domainReviewQueueRepo.save(reviewItem);
    }

    async verifyDomain(domainId: string): Promise<void> {
        await this.domainRepo.update(
            { id: domainId },
            { isVerified: true }
        );
    }

    async mergeDomain(targetDomainId: string, mergeIntoDomainId: string, adminId: string): Promise<void> {
        const target = await this.domainRepo.findOne({ where: { id: targetDomainId } });
        const destination = await this.domainRepo.findOne({ where: { id: mergeIntoDomainId } });

        if (!target || !destination) {
            throw new Error('Domains not found');
        }

        await this.createAlias(destination.id, target.name, target.normalizedName);
        await this.domainRepo.increment({ id: destination.id }, 'usageCount', target.usageCount);
        await this.domainRepo.remove(target);

        this.logger.log(`Merged domain "${target.name}" into "${destination.name}" by admin ${adminId}`);
    }

    async deleteDomain(domainId: string, adminId: string): Promise<void> {
        const domain = await this.domainRepo.findOne({ where: { id: domainId } });
        if (!domain) {
            throw new Error(`Domain with ID ${domainId} not found`);
        }

        await this.domainRepo.remove(domain);
        this.logger.log(`Permanently deleted canonical domain "${domain.name}" (ID: ${domainId}) by admin ${adminId}`);
    }

    async getDomainById(id: string): Promise<Domain | null> {
        return await this.domainRepo.findOne({ where: { id } });
    }

    private async checkRateLimit(_userId: string): Promise<void> { /* no-op */ }

    private async getUserProfile(userId: string): Promise<{ riskLevel: number } | null> {
        const result = await this.domainRepo.manager.query(
            `SELECT risk_level AS "riskLevel" FROM user_profiles WHERE "identityId" = $1 LIMIT 1`,
            [userId],
        );
        return result.length > 0 ? result[0] : null;
    }
}