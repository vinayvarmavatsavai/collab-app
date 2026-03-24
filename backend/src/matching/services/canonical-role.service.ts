import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ProfessionalRole } from '../entities/professional-role.entity';
import { RoleAlias } from '../entities/role-alias.entity';
import { RoleReviewQueue, RoleReviewStatus } from '../entities/role-review-queue.entity';
import { SkillNormalizationService } from './skill-normalization.service';
import { EmbeddingService } from './embedding.service';
import { ModerationService } from './moderation.service';
import { CanonicalRateLimitService } from './canonical-rate-limit.service';

export interface RoleSuggestion {
    role: ProfessionalRole;
    similarity: number;
    matchType: 'exact' | 'alias' | 'fuzzy';
}

@Injectable()
export class CanonicalRoleService {
    private readonly logger = new Logger(CanonicalRoleService.name);

    constructor(
        @InjectRepository(ProfessionalRole)
        private professionalRoleRepo: Repository<ProfessionalRole>,
        @InjectRepository(RoleAlias)
        private roleAliasRepo: Repository<RoleAlias>,
        @InjectRepository(RoleReviewQueue)
        private roleReviewQueueRepo: Repository<RoleReviewQueue>,
        private normalizationService: SkillNormalizationService,
        private embeddingService: EmbeddingService,
        private moderationService: ModerationService,
        private rateLimitService: CanonicalRateLimitService,
        private configService: ConfigService,
    ) { }

    async findOrCreateCanonicalRole(
        input: string,
        primaryDomainId?: string,
        userId?: string,
    ): Promise<ProfessionalRole> {
        await this.moderationService.validateInput(input, userId, 'role');

        const raw = (input || '').trim();
        const normalized = this.normalizationService.normalizeSkill(raw);

        this.logger.log(`ROLE INPUT RECEIVED: ${raw}`);
        this.logger.log(`ROLE NORMALIZED: ${normalized}`);

        if (!normalized || normalized.length < 2) {
            throw new Error('Invalid role input: too short');
        }

        // 1. Exact match by normalized name
        let role = await this.professionalRoleRepo.findOne({
            where: { normalizedName: normalized },
        });

        if (role) {
            await this.incrementUsageCount(role.id);
            this.logger.log(`Exact normalized role match: "${raw}" -> "${role.name}"`);
            return role;
        }

        // 2. Exact match by actual name (case-insensitive)
        role = await this.professionalRoleRepo.findOne({
            where: { name: ILike(raw) },
        });

        if (role) {
            await this.incrementUsageCount(role.id);
            this.logger.log(`Exact role name match: "${raw}" -> "${role.name}"`);
            return role;
        }

        // 3. Alias match by normalized alias
        const alias = await this.roleAliasRepo.findOne({
            where: { normalizedAlias: normalized },
            relations: ['professionalRole'],
        });

        if (alias?.professionalRole) {
            await this.incrementUsageCount(alias.professionalRoleId);
            this.logger.log(`Alias role match: "${raw}" -> "${alias.professionalRole.name}"`);
            return alias.professionalRole;
        }

        // 4. Alias match by actual alias text (case-insensitive)
        const aliasByName = await this.roleAliasRepo.findOne({
            where: { alias: ILike(raw) },
            relations: ['professionalRole'],
        });

        if (aliasByName?.professionalRole) {
            await this.incrementUsageCount(aliasByName.professionalRoleId);
            this.logger.log(`Alias-by-name role match: "${raw}" -> "${aliasByName.professionalRole.name}"`);
            return aliasByName.professionalRole;
        }

        // 5. Rate limit before creating new entries
        if (userId) {
            await this.rateLimitService.checkAndIncrement(userId);
        }

        // 6. Fuzzy fallback
        const fuzzyThreshold = this.configService.get<number>('matching.canonical.fuzzyMatchThreshold') ?? 0.7;
        const maxLevenshtein = this.configService.get<number>('matching.canonical.maxLevenshteinDistance') ?? 2;

        const typoMatches = await this.professionalRoleRepo.manager.query(`
            SELECT id, name, normalized_name,
                   similarity(normalized_name, $1) as sim,
                   levenshtein(normalized_name, $1) as dist
            FROM professional_roles
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
                this.logger.log(`Typo/Fuzzy role match: "${raw}" -> "${typoMatch.name}" (sim=${sim.toFixed(2)}, dist=${dist})`);
                await this.createAlias(typoMatch.id, raw, normalized);
                await this.incrementUsageCount(typoMatch.id);

                const matchEntity = await this.professionalRoleRepo.findOne({ where: { id: typoMatch.id } });
                if (matchEntity) return matchEntity;
            } else if (sim >= fuzzyThreshold || dist <= 2 || forcedReview) {
                this.logger.warn(`Typo review role: "${raw}" ~ "${typoMatch.name}" (sim=${sim.toFixed(2)}, dist=${dist}, forcedReview=${forcedReview})`);

                const newRole = await this.createCanonicalRole(
                    raw,
                    normalized,
                    primaryDomainId,
                    undefined,
                    false,
                    1,
                );

                if (userId) {
                    newRole.createdByUserId = userId;
                    await this.professionalRoleRepo.save(newRole);
                }

                await this.queueForReview(raw, normalized, typoMatch.id, sim >= 0.95 ? sim : 0.95, userId);
                return newRole;
            }
        }

        // 7. Final fallback: create new canonical role
        this.logger.log(`Creating new user-generated role: "${raw}"`);

        const newRole = await this.createCanonicalRole(
            raw,
            normalized,
            primaryDomainId,
            undefined,
            false,
            1,
        );

        if (userId) {
            newRole.createdByUserId = userId;
            await this.professionalRoleRepo.save(newRole);
        }

        return newRole;
    }

    async createCanonicalRole(
        name: string,
        normalizedName: string,
        primaryDomainId?: string,
        description?: string,
        isVerified: boolean = false,
        usageCount: number = 0,
    ): Promise<ProfessionalRole> {
        const role = this.professionalRoleRepo.create({
            name,
            normalizedName,
            primaryDomainId,
            description,
            isVerified,
            usageCount,
        });

        const saved = await this.professionalRoleRepo.save(role);

        this.generateEmbeddingAsync(saved.id).catch(err => {
            this.logger.error(`Failed to generate embedding for role ${saved.id}: ${err.message}`);
        });

        return saved;
    }

    async createAlias(professionalRoleId: string, alias: string, normalizedAlias: string): Promise<RoleAlias> {
        const existing = await this.roleAliasRepo.findOne({
            where: { normalizedAlias },
        });

        if (existing) {
            return existing;
        }

        const roleAlias = this.roleAliasRepo.create({
            professionalRoleId,
            alias,
            normalizedAlias,
        });

        try {
            return await this.roleAliasRepo.save(roleAlias);
        } catch {
            return await this.roleAliasRepo.findOne({ where: { normalizedAlias } }) || roleAlias;
        }
    }

    async findFuzzyMatch(normalized: string, _threshold = 0.4): Promise<RoleSuggestion | null> {
        const results = await this.getVectorSuggestions(normalized, 1);
        return results.length > 0 ? results[0] : null;
    }

    async getSuggestions(query: string, limit = 10): Promise<RoleSuggestion[]> {
        const normalized = this.normalizationService.normalizeSkill(query);

        if (!normalized || normalized.length < 2) {
            return await this.getPopularRoles(limit);
        }

        const prefixMatches = await this.professionalRoleRepo
            .createQueryBuilder('role')
            .where('role.normalized_name LIKE :query', { query: `${normalized}%` })
            .andWhere('role.is_verified = true')
            .orderBy('role.usage_count', 'DESC')
            .limit(limit)
            .getMany();

        if (prefixMatches.length >= limit) {
            return prefixMatches.map(role => ({ role, similarity: 1.0, matchType: 'exact' as const }));
        }

        const vectorResults = await this.getVectorSuggestions(query, limit + prefixMatches.length);
        const prefixIds = new Set(prefixMatches.map(r => r.id));
        const semantic = vectorResults.filter(r => !prefixIds.has(r.role.id)).slice(0, limit - prefixMatches.length);

        return [
            ...prefixMatches.map(role => ({ role, similarity: 1.0, matchType: 'exact' as const })),
            ...semantic,
        ];
    }

    async findSimilarRoles(roleId: string, limit = 10): Promise<Array<{ role: ProfessionalRole; similarity: number }>> {
        const role = await this.professionalRoleRepo.findOne({ where: { id: roleId } });

        if (!role || !role.embedding) {
            return [];
        }

        const results = await this.professionalRoleRepo
            .createQueryBuilder('role')
            .select('role')
            .addSelect(`1 - (role.embedding <=> :embedding)`, 'similarity')
            .where('role.id != :id', { id: roleId })
            .andWhere('role.embedding IS NOT NULL')
            .setParameter('embedding', JSON.stringify(role.embedding))
            .orderBy('role.embedding <=> :embedding', 'ASC')
            .limit(limit)
            .getRawAndEntities();

        return results.entities.map((role, index) => ({
            role,
            similarity: results.raw[index].similarity,
        }));
    }

    private async generateEmbeddingAsync(roleId: string): Promise<void> {
        const role = await this.professionalRoleRepo.findOne({ where: { id: roleId } });

        if (!role) return;

        const text = `${role.name} ${role.description || ''}`;
        const embedding = await this.embeddingService.generateEmbedding(text);

        if (embedding) {
            role.embedding = embedding;
            await this.professionalRoleRepo.save(role);
        }
    }

    async incrementUsageCount(roleId: string): Promise<void> {
        await this.professionalRoleRepo.increment({ id: roleId }, 'usageCount', 1);
    }

    async decrementUsageCount(roleId: string): Promise<void> {
        const role = await this.professionalRoleRepo.findOne({ where: { id: roleId } });

        if (!role) return;

        role.usageCount = Math.max(0, role.usageCount - 1);

        if (role.usageCount === 0 && !role.isVerified) {
            await this.professionalRoleRepo.remove(role);
            this.logger.log(`Deleted unused user-generated role: "${role.name}"`);
        } else {
            await this.professionalRoleRepo.save(role);
        }
    }

    async getSmartSuggestions(query: string, limit = 10): Promise<RoleSuggestion[]> {
        return this.getSuggestions(query, limit);
    }

    private async getVectorSuggestions(query: string, limit: number): Promise<RoleSuggestion[]> {
        const emb = await this.embeddingService.generateEmbedding(query);
        if (!emb) return [];

        const embStr = JSON.stringify(emb);
        const results = await this.professionalRoleRepo
            .createQueryBuilder('role')
            .select('role')
            .addSelect(`1 - (role.embedding <=> '${embStr}'::vector)`, 'sim')
            .addSelect(`
                (1 - (role.embedding <=> '${embStr}'::vector)) * 0.6
                + LOG(role.usage_count + 1) * 0.3
                + (CASE WHEN role.is_verified THEN 0.1 ELSE 0 END)
            `, 'rank_score')
            .where('role.embedding IS NOT NULL')
            .andWhere(`1 - (role.embedding <=> '${embStr}'::vector) > 0.50`)
            .orderBy('rank_score', 'DESC')
            .limit(limit)
            .getRawAndEntities();

        return results.entities.map((role, i) => ({
            role,
            similarity: parseFloat(results.raw[i].sim),
            matchType: parseFloat(results.raw[i].sim) > 0.9 ? 'exact' : 'fuzzy' as const,
        }));
    }

    async getPopularRoles(limit = 20): Promise<RoleSuggestion[]> {
        const roles = await this.professionalRoleRepo.find({
            order: { usageCount: 'DESC' },
            take: limit,
        });

        return roles.map(role => ({
            role,
            similarity: 1.0,
            matchType: 'exact' as const,
        }));
    }

    private async queueForReview(
        rawInput: string,
        normalizedInput: string,
        suggestedRoleId: string,
        fuzzySimilarity: number,
        userId?: string,
    ): Promise<void> {
        try {
            const queueItem = this.roleReviewQueueRepo.create({
                rawInput,
                normalizedInput,
                suggestedRoleId,
                fuzzySimilarity,
                createdByUserId: userId,
                status: RoleReviewStatus.PENDING,
            });

            await this.roleReviewQueueRepo.save(queueItem);
            this.logger.log(`Queued role for review: "${rawInput}" (similarity: ${fuzzySimilarity})`);
        } catch (error: any) {
            this.logger.error(`Failed to queue role for review: ${error.message}`);
        }
    }

    async getPendingReviews(limit = 50, offset = 0): Promise<RoleReviewQueue[]> {
        return await this.roleReviewQueueRepo.find({
            where: { status: RoleReviewStatus.PENDING },
            order: { createdAt: 'ASC' },
            take: limit,
            skip: offset,
        });
    }

    async getUnverifiedRoles(limit = 50, offset = 0): Promise<ProfessionalRole[]> {
        return await this.professionalRoleRepo.find({
            where: { isVerified: false },
            order: { usageCount: 'DESC', createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async rejectReviewItem(reviewId: string, adminId: string, notes?: string): Promise<void> {
        await this.roleReviewQueueRepo.update(
            { id: reviewId },
            {
                status: RoleReviewStatus.REJECTED,
                reviewedByAdminId: adminId,
                reviewedAt: new Date(),
                reviewNotes: notes,
            }
        );
    }

    async approveReviewItem(reviewId: string, adminId: string, mergeToRoleId: string): Promise<void> {
        const reviewItem = await this.roleReviewQueueRepo.findOne({ where: { id: reviewId } });

        if (!reviewItem) {
            throw new Error('Review item not found');
        }

        await this.createAlias(mergeToRoleId, reviewItem.rawInput, reviewItem.normalizedInput);

        reviewItem.status = RoleReviewStatus.APPROVED;
        reviewItem.reviewedByAdminId = adminId;
        reviewItem.reviewedAt = new Date();

        await this.roleReviewQueueRepo.save(reviewItem);
    }

    async verifyRole(roleId: string): Promise<void> {
        await this.professionalRoleRepo.update(
            { id: roleId },
            { isVerified: true }
        );
    }

    async mergeRole(targetRoleId: string, mergeIntoRoleId: string, adminId: string): Promise<void> {
        const target = await this.professionalRoleRepo.findOne({ where: { id: targetRoleId } });
        const destination = await this.professionalRoleRepo.findOne({ where: { id: mergeIntoRoleId } });

        if (!target || !destination) {
            throw new Error('Roles not found');
        }

        await this.createAlias(destination.id, target.name, target.normalizedName);
        await this.professionalRoleRepo.increment({ id: destination.id }, 'usageCount', target.usageCount);
        await this.professionalRoleRepo.remove(target);

        this.logger.log(`Merged role "${target.name}" into "${destination.name}" by admin ${adminId}`);
    }

    async deleteRole(roleId: string, adminId: string): Promise<void> {
        const role = await this.professionalRoleRepo.findOne({ where: { id: roleId } });
        if (!role) {
            throw new Error(`ProfessionalRole with ID ${roleId} not found`);
        }

        await this.professionalRoleRepo.remove(role);
        this.logger.log(`Permanently deleted canonical role "${role.name}" (ID: ${roleId}) by admin ${adminId}`);
    }

    async getRoleById(id: string): Promise<ProfessionalRole | null> {
        return await this.professionalRoleRepo.findOne({ where: { id } });
    }

    private async checkRateLimit(_userId: string): Promise<void> { /* no-op */ }

    private async getUserProfile(userId: string): Promise<{ riskLevel: number } | null> {
        const result = await this.professionalRoleRepo.manager.query(
            `SELECT risk_level AS "riskLevel" FROM user_profiles WHERE "identityId" = $1 LIMIT 1`,
            [userId],
        );
        return result.length > 0 ? result[0] : null;
    }
}