import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CanonicalAbuseLog } from '../entities/canonical-abuse-log.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';

export interface ModerationResult {
    valid: boolean;
    reason?: string;
}

// ─────────────────────────────────────────────────────────────────
//  Inline blocklist — profanity + hate speech + slurs (English core)
//  Add entries freely; matching is whole-word on the normalized form.
// ─────────────────────────────────────────────────────────────────
const BLOCKED_TERMS = new Set([
    // English profanity
    'fuck', 'shit', 'ass', 'asshole', 'bitch', 'bastard', 'damn', 'crap',
    'piss', 'cock', 'dick', 'pussy', 'cunt', 'whore', 'slut', 'fag',
    'faggot', 'dyke', 'twat', 'wank', 'wanker', 'bollocks', 'bugger',
    // Hate speech / slurs
    'nigger', 'nigga', 'chink', 'spic', 'kike', 'wetback', 'beaner',
    'gook', 'raghead', 'towelhead', 'tranny', 'retard', 'retarded',
    'spaz', 'nazi', 'fascist',
    // Sexual explicit
    'porn', 'hentai', 'xxx', 'nsfw', 'rape', 'molest',
    // Spam common
    'clickhere', 'freemoney', 'buynow', 'casino'
]);

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(
        @InjectRepository(CanonicalAbuseLog)
        private abuseLogRepo: Repository<CanonicalAbuseLog>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        private configService: ConfigService,
    ) { }

    /**
     * Validate a raw canonical input string.
     * If invalid: logs to canonical_abuse_log and increments user risk counters.
     * Throws BadRequestException so the caller doesn't need to check the return value.
     */
    async validateInput(
        rawInput: string,
        userId?: string,
        entityType: 'skill' | 'role' | 'domain' = 'skill',
    ): Promise<void> {
        const result = this.check(rawInput);

        if (!result.valid) {
            this.logger.warn(
                `Moderation blocked "${rawInput}" (${result.reason}) user=${userId ?? 'anon'}`,
            );

            // Log the abuse event (fire & forget — never block the pipeline on this)
            this.logAbuse(rawInput, userId, entityType, result.reason!).catch(e =>
                this.logger.error(`abuse log write failed: ${e.message}`),
            );

            // Update user risk counters (fire & forget)
            if (userId) {
                this.incrementUserRisk(userId).catch(e =>
                    this.logger.error(`risk increment failed: ${e.message}`),
                );
            }

            throw new BadRequestException(
                `Input rejected: ${result.reason}. Please use a valid, professional term.`,
            );
        }
    }

    // ─── internal sync check (no DB) ────────────────────────────────────────

    private check(rawInput: string): ModerationResult {
        const cfg = this.configService.get('matching.moderation');
        const minLen: number = cfg?.minLength ?? 2;
        const maxLen: number = cfg?.maxLength ?? 60;
        const minUniqueChars: number = cfg?.minUniqueChars ?? 2;
        const minUniqueRatio: number = cfg?.minUniqueCharRatio ?? 0.3;

        const input = rawInput?.trim() ?? '';

        // 1. Length
        if (input.length < minLen) return { valid: false, reason: 'too short' };
        if (input.length > maxLen) return { valid: false, reason: 'too long (max 60 chars)' };

        // 2. URL detection
        const urlPattern: RegExp = cfg?.urlPattern ?? /https?:\/\/|www\.|\.com/i;
        if (urlPattern.test(input)) return { valid: false, reason: 'URLs are not allowed' };

        // 3. Repeated character spam (e.g. "aaaaaaa")
        const repeatPattern: RegExp = cfg?.repeatedCharPattern ?? /(.)\1{4,}/;
        if (repeatPattern.test(input.toLowerCase())) {
            return { valid: false, reason: 'repeated character spam detected' };
        }

        // 4. Emoji-only detection (contains only emoji + optional whitespace)
        const emojiOnlyPattern = /^[\s\p{Emoji}\u200d\ufe0f]+$/u;
        if (emojiOnlyPattern.test(input)) {
            return { valid: false, reason: 'emoji-only inputs are not allowed' };
        }

        // 5. Unique character check (catches "ababab" patterns)
        const stripped = input.toLowerCase().replace(/\s/g, '');
        const uniqueChars = new Set(stripped).size;
        if (uniqueChars < minUniqueChars) {
            return { valid: false, reason: 'insufficient character variety' };
        }
        if (stripped.length > 4 && uniqueChars / stripped.length < minUniqueRatio) {
            return { valid: false, reason: 'insufficient character variety' };
        }

        // 6. Profanity / blocklist — check normalized word tokens
        const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (BLOCKED_TERMS.has(normalized)) {
            return { valid: false, reason: 'inappropriate content detected' };
        }
        // Also check individual word tokens with space separation
        const tokens = input.toLowerCase().split(/[\s,._\-/]+/);
        for (const token of tokens) {
            const normToken = token.replace(/[^a-z0-9]/g, '');
            if (normToken.length > 1 && BLOCKED_TERMS.has(normToken)) {
                return { valid: false, reason: 'inappropriate content detected' };
            }
        }

        return { valid: true };
    }

    // ─── async side effects ──────────────────────────────────────────────────

    private async logAbuse(
        rawInput: string,
        userId: string | undefined,
        entityType: 'skill' | 'role' | 'domain',
        reason: string,
    ): Promise<void> {
        const log = this.abuseLogRepo.create({
            userId,
            rawInput,
            normalizedInput: rawInput.toLowerCase().trim().replace(/[^a-z0-9]/g, ''),
            reasonFlagged: reason,
            entityType,
        });
        await this.abuseLogRepo.save(log);
    }

    private async incrementUserRisk(userId: string): Promise<void> {
        const profile = await this.userProfileRepo.findOne({ where: { identityId: userId } });
        if (!profile) return;

        profile.moderationFlagCount = (profile.moderationFlagCount ?? 0) + 1;

        const flagsR1: number = this.configService.get('matching.risk.flagsForRiskLevel1') ?? 3;
        const flagsR2: number = this.configService.get('matching.risk.flagsForRiskLevel2') ?? 5;

        if (profile.moderationFlagCount >= flagsR2 && profile.riskLevel < 2) {
            profile.riskLevel = 2;
            this.logger.warn(`User ${userId} elevated to riskLevel 2 (flags=${profile.moderationFlagCount})`);
        } else if (profile.moderationFlagCount >= flagsR1 && profile.riskLevel < 1) {
            profile.riskLevel = 1;
            this.logger.warn(`User ${userId} elevated to riskLevel 1 (flags=${profile.moderationFlagCount})`);
        }

        await this.userProfileRepo.save(profile);
    }
}
