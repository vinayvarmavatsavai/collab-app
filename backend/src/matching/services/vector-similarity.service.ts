import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WeightedEmbedding {
    embedding: number[];
    weight: number; // importance weight, e.g. from ProjectRequiredSkill.importance
}

@Injectable()
export class VectorSimilarityService {
    private readonly logger = new Logger(VectorSimilarityService.name);

    constructor(private readonly configService: ConfigService) { }

    /**
     * Compute cosine similarity between two vectors.
     * Returns a value in [0, 1].
     * Returns 0 if either vector is null/empty/zero-magnitude.
     */
    cosineSimilarity(a: number[] | null | undefined, b: number[] | null | undefined): number {
        if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
            return 0;
        }

        let dot = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        if (magA === 0 || magB === 0) return 0;

        const similarity = dot / (Math.sqrt(magA) * Math.sqrt(magB));
        // Clamp to [0, 1] to handle floating-point edge cases
        return Math.max(0, Math.min(1, similarity));
    }

    /**
     * Given a single query embedding, compute the maximum cosine similarity
     * against a list of candidate embeddings.
     * Returns 0 if the candidate list is empty or all embeddings are null.
     */
    maxSimilarityAgainstList(
        queryEmbedding: number[] | null | undefined,
        candidates: (number[] | null | undefined)[],
    ): number {
        if (!queryEmbedding || candidates.length === 0) return 0;

        let max = 0;
        for (const candidate of candidates) {
            const sim = this.cosineSimilarity(queryEmbedding, candidate);
            if (sim > max) max = sim;
        }
        return max;
    }

    /**
     * Compute a weighted average skill vector score.
     *
     * For each required item (skill/domain/role) with an importance weight:
     *   - Compute the max cosine similarity between that item's embedding
     *     and all user embeddings
     *   - Apply the configurable threshold: if sim < threshold → use 0
     *
     * Returns: Σ(effective_sim_i × weight_i) / Σ(weight_i)
     * Returns 0 if no required items are provided.
     */
    weightedAverageSimilarity(
        requiredItems: WeightedEmbedding[],
        userEmbeddings: (number[] | null | undefined)[],
        threshold?: number,
    ): number {
        if (requiredItems.length === 0 || userEmbeddings.length === 0) {
            return requiredItems.length === 0 ? 1.0 : 0; // No requirements = full score
        }

        const effectiveThreshold =
            threshold ?? this.configService.get<number>('matching.skillSimilarityThreshold') ?? 0.40;

        let weightedSum = 0;
        let totalWeight = 0;

        for (const item of requiredItems) {
            if (!item.embedding) continue;

            const sim = this.maxSimilarityAgainstList(item.embedding, userEmbeddings);
            const effectiveSim = sim >= effectiveThreshold ? sim : 0;

            weightedSum += effectiveSim * item.weight;
            totalWeight += item.weight;
        }

        if (totalWeight === 0) return 0;
        return weightedSum / totalWeight;
    }

    /**
     * Simple (unweighted) average of max-similarities.
     * Used for optional skills and domain/role scoring when importance is uniform.
     * Returns 1.0 if requiredItems is empty (no requirements = full score).
     */
    averageMaxSimilarity(
        requiredEmbeddings: (number[] | null | undefined)[],
        userEmbeddings: (number[] | null | undefined)[],
        threshold?: number,
    ): number {
        if (requiredEmbeddings.length === 0) return 1.0;
        if (userEmbeddings.length === 0) return 0;

        const effectiveThreshold =
            threshold ?? this.configService.get<number>('matching.skillSimilarityThreshold') ?? 0.40;

        let total = 0;
        for (const reqEmb of requiredEmbeddings) {
            const sim = this.maxSimilarityAgainstList(reqEmb, userEmbeddings);
            total += sim >= effectiveThreshold ? sim : 0;
        }
        return total / requiredEmbeddings.length;
    }
}
