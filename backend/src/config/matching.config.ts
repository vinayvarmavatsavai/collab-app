import { registerAs } from '@nestjs/config';

export default registerAs('matching', () => ({
    /**
     * Weights for WeightedMatchingService
     * Must sum to 1.0
     */
    weights: {
        requiredSkills: 0.40,
        domain: 0.20,
        role: 0.15,
        optionalSkills: 0.10,
        profileSimilarity: 0.10,
        profileCompleteness: 0.05,
    },

    /**
     * Weights for VectorMatchingService hybrid score
     * Must sum to 1.0
     */
    hybridWeights: {
        profileSimilarity: 0.35,
        milestoneSimilarity: 0.25,
        requiredSkillVector: 0.30,
        domainVector: 0.10,
    },

    /**
     * Cosine similarity below this threshold is treated as 0 for that skill
     */
    skillSimilarityThreshold: 0.40,

    /**
     * ANN search limits
     */
    candidateAnnLimit: 200,
    topMatchesLimit: 50,

    /**
     * findBestMatches defaults
     */
    defaultMinScore: 20,
    defaultFindBestLimit: 20,

    // -------------------------------------------------------------------------
    // Canonical findOrCreate — vector similarity thresholds
    // -------------------------------------------------------------------------
    canonical: {
        /** Cosine sim >= this → auto-merge input into existing canonical */
        autoMergeThreshold: 0.90,

        /** Cosine sim >= this (but < autoMergeThreshold) → create new LOW + queue for review */
        reviewQueueThreshold: 0.75,

        /** Minimum cosine sim for getSuggestions vector ANN step */
        suggestionMinSimilarity: 0.50,

        /**
         * Autocomplete visibility thresholds.
         * USER_GENERATED entries only appear in autocomplete when:
         *   usage_count >= this value  OR  created_by = requesting user
         */
        quarantineMinUsage: 50,

        /**
         * Matching engine: ignore USER_GENERATED canonicals with usage_count below this.
         * Exception: project explicitly selected it.
         */
        matchingMinUsage: 5,
    },

    // -------------------------------------------------------------------------
    // Confidence level promotion thresholds
    // -------------------------------------------------------------------------
    confidencePromotion: {
        /** usage_count >= this → promote to MEDIUM (+ is_verified=true) */
        mediumThreshold: 50,

        /** usage_count >= this → promote to HIGH */
        highThreshold: 200,
    },

    // -------------------------------------------------------------------------
    // Rate limiting — canonical creation
    // -------------------------------------------------------------------------
    rateLimit: {
        /** Max new canonicals a single user may create per window */
        maxCreationsPerWindow: 10000,

        /** Window duration in seconds (24 hours) */
        windowSeconds: 86400,

        /** Redis key prefix for per-user creation counters */
        redisKeyPrefix: 'canonical_creations',
    },

    // -------------------------------------------------------------------------
    // Risk scoring — when to escalate user risk level
    // -------------------------------------------------------------------------
    risk: {
        /** moderationFlagCount >= this → riskLevel becomes 1 */
        flagsForRiskLevel1: 3,

        /** moderationFlagCount >= this → riskLevel becomes 2 */
        flagsForRiskLevel2: 5,

        /** At this riskLevel, all canonical creations go directly to review queue */
        forcedReviewRiskLevel: 2,
    },

    // -------------------------------------------------------------------------
    // Content moderation
    // -------------------------------------------------------------------------
    moderation: {
        /** Minimum input length (chars) */
        minLength: 2,

        /** Maximum input length (chars) — prevents essay-length entries */
        maxLength: 60,

        /** Min unique character ratio — catches "aaaaaaa" style spam */
        minUniqueCharRatio: 0.3,

        /** Minimum number of unique chars — catches single-char repeats */
        minUniqueChars: 2,

        /** Regex for repeated character spam — 5+ of same char in a row */
        repeatedCharPattern: /(.)(\1{4,})/,

        /** Regex to detect URLs */
        urlPattern: /https?:\/\/|www\.|\.(com|net|org|io|dev)(\/(\S*))?/i,
    },

    // -------------------------------------------------------------------------
    // Auto-cleanup job (runs daily)
    // -------------------------------------------------------------------------
    cleanup: {
        /** Cron expression — runs at 2:00 AM daily */
        cronExpression: '0 2 * * *',

        /** Delete USER_GENERATED entries older than this many days */
        staleAfterDays: 30,

        /** Only delete entries with usage_count <= this */
        maxUsageCountToDelete: 1,
    },
}));
