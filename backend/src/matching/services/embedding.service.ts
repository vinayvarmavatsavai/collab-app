import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { Post } from '../../posts/entities/post.entity';

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);
    private readonly ollamaBaseUrl: string;
    private readonly embeddingModel: string;
    private readonly embeddingDimensions: number;

    constructor(private configService: ConfigService) {
        const appConfig = this.configService.get('app');
        this.ollamaBaseUrl = appConfig.ollama.baseUrl;
        this.embeddingModel = appConfig.ollama.embeddingModel;
        this.embeddingDimensions = appConfig.ollama.embeddingDimensions;

        this.logger.log(
            `Embedding service initialized with model: ${this.embeddingModel} (${this.embeddingDimensions}D)`,
        );
    }

    /**
     * Generate embedding vector from text using Ollama nomic-embed-text
     */
    async generateEmbedding(text: string): Promise<number[] | null> {
        if (!text || text.trim().length === 0) {
            this.logger.warn('Cannot generate embedding for empty text');
            return null;
        }

        try {
            const response = await fetch(`${this.ollamaBaseUrl}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.embeddingModel,
                    prompt: text,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${error}`);
            }

            const data = await response.json();

            if (!data.embedding || !Array.isArray(data.embedding)) {
                throw new Error('Invalid embedding response from Ollama');
            }

            // Validate dimensions
            if (data.embedding.length !== this.embeddingDimensions) {
                this.logger.warn(
                    `Expected ${this.embeddingDimensions} dimensions, got ${data.embedding.length}`,
                );
            }

            return data.embedding;
        } catch (error) {
            this.logger.error(`Failed to generate embedding: ${error.message}`, error.stack);
            return null;
        }
    }

    /**
     * Create deterministic summary text from user profile
     * This text is used to generate the profile embedding
     */
    createProfileSummary(profile: UserProfile): string {
        const parts: string[] = [];

        // Add headline/bio
        if (profile.headline) {
            parts.push(`Professional: ${profile.headline}`);
        }
        if (profile.bio) {
            parts.push(`Bio: ${profile.bio}`);
        }

        // Add skills
        if (profile.userSkills && profile.userSkills.length > 0) {
            const skillNames = profile.userSkills.map(s => s.canonicalSkill?.name || 'Unknown');
            parts.push(`Skills: ${skillNames.join(', ')}`);
        }

        // Add domains
        if (profile.userDomains && profile.userDomains.length > 0) {
            const domainNames = profile.userDomains.map(d => d.domain?.name || 'Unknown');
            parts.push(`Domains: ${domainNames.join(', ')}`);
        }

        // Add current position
        if (profile.currentPosition && profile.currentCompany) {
            parts.push(`Current: ${profile.currentPosition} at ${profile.currentCompany}`);
        }

        // Add collaboration goals
        if (profile.collaborationGoals) {
            parts.push(`Goals: ${profile.collaborationGoals}`);
        }

        // Add experience summary (top 3)
        if (profile.experience && profile.experience.length > 0) {
            const expSummary = profile.experience
                .slice(0, 3)
                .map(exp => `${exp.position} at ${exp.company}`)
                .join('; ');
            parts.push(`Experience: ${expSummary}`);
        }

        // Add education (top 2)
        if (profile.education && profile.education.length > 0) {
            const eduSummary = profile.education
                .slice(0, 2)
                .map(edu => `${edu.degree} in ${edu.field} from ${edu.school}`)
                .join('; ');
            parts.push(`Education: ${eduSummary}`);
        }

        return parts.join('\n');
    }

    /**
     * Create summary text from post content
     */
    createMilestoneSummary(post: Post): string {
        return post.content.trim();
    }

    /**
     * Create summary text from project request
     */
    createProjectSummary(title: string, description: string, requiredSkills: string[], requiredDomains: string[]): string {
        const parts: string[] = [];

        parts.push(`Project: ${title}`);
        parts.push(`Description: ${description}`);

        if (requiredSkills && requiredSkills.length > 0) {
            parts.push(`Required Skills: ${requiredSkills.join(', ')}`);
        }

        if (requiredDomains && requiredDomains.length > 0) {
            parts.push(`Domains: ${requiredDomains.join(', ')}`);
        }

        return parts.join('\n');
    }

    /**
     * Batch generate embeddings for multiple texts
     * More efficient for bulk operations
     */
    async generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
        // Ollama usually processes one by one, but let's iterate
        // Or if OpenAI, use batch input

        const results: (number[] | null)[] = [];
        for (const text of texts) {
            try {
                const emb = await this.generateEmbedding(text);
                results.push(emb);
            } catch (e) {
                this.logger.error(`Failed to generate embedding in batch: ${e.message}`);
                results.push(null);
            }
        }
        return results;
    }

    /**
     * Get embedding model info
     */
    getModelInfo() {
        return {
            model: this.embeddingModel,
            dimensions: this.embeddingDimensions,
            baseUrl: this.ollamaBaseUrl,
        };
    }
}
