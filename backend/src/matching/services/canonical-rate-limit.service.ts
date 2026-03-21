import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { Redis } from 'ioredis';

@Injectable()
export class CanonicalRateLimitService {
    private readonly logger = new Logger(CanonicalRateLimitService.name);

    constructor(
        @Inject('REDIS_CLIENT') private redis: Redis,
        private configService: ConfigService,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
    ) { }

    /**
     * Check if user is within the canonical creation rate limit.
     * Increments their counter in Redis.
     * Throws 429 TooManyRequests if limit exceeded.
     */
    async checkAndIncrement(userId: string): Promise<void> {
        const max: number = this.configService.get<number>('matching.rateLimit.maxCreationsPerWindow') ?? 5;
        const window: number = this.configService.get<number>('matching.rateLimit.windowSeconds') ?? 86400;
        const prefix: string = this.configService.get<string>('matching.rateLimit.redisKeyPrefix') ?? 'canonical_creations';

        const key = `${prefix}:${userId}`;
        const redis = this.redis;

        // Atomic increment + TTL set using pipeline
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.ttl(key);
        const results = await pipeline.exec();

        const count = results![0][1] as number;
        const ttl = results![1][1] as number;

        // Set expiry on first creation
        if (ttl === -1) {
            await redis.expire(key, window);
        }

        if (count > max) {
            this.logger.warn(`Rate limit exceeded for user ${userId} (count=${count})`);

            // Escalate riskLevel (fire & forget)
            this.escalateRisk(userId, count).catch(e =>
                this.logger.error(`risk escalate failed: ${e.message}`),
            );

            throw new HttpException(
                `Canonical creation rate limit exceeded. Max ${max} new entries per 24 hours.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Mirror count in DB for admin visibility (non-blocking)
        this.mirrorCountToDB(userId, count).catch(() => { });
    }

    /**
     * Returns the current creation count for a user (for admin display).
     */
    async getCurrentCount(userId: string): Promise<number> {
        const prefix: string = this.configService.get<string>('matching.rateLimit.redisKeyPrefix') ?? 'canonical_creations';
        const key = `${prefix}:${userId}`;
        const val = await this.redis.get(key);
        return val ? parseInt(val, 10) : 0;
    }

    private async escalateRisk(userId: string, count: number): Promise<void> {
        const profile = await this.userProfileRepo.findOne({ where: { identityId: userId } });
        if (!profile) return;

        // Each breach increments rejectedCanonicalCount; riskLevel escalates at thresholds
        profile.rejectedCanonicalCount = (profile.rejectedCanonicalCount ?? 0) + 1;

        const forcedLevel: number = this.configService.get<number>('matching.risk.forcedReviewRiskLevel') ?? 2;
        if (profile.riskLevel < forcedLevel) {
            profile.riskLevel = Math.min(profile.riskLevel + 1, forcedLevel);
        }

        await this.userProfileRepo.save(profile);
    }

    private async mirrorCountToDB(userId: string, count: number): Promise<void> {
        await this.userProfileRepo.update(
            { identityId: userId },
            { canonicalCreationCount24h: count },
        );
    }
}
