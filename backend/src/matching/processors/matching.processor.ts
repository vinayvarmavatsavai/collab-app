import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileVector } from '../entities/user-profile-vector.entity';
import { MilestoneVector } from '../entities/milestone-vector.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { Post } from '../../posts/entities/post.entity';
import { ProjectRequest } from '../entities/project-request.entity';
import { ProjectNotification, NotificationType } from '../entities/project-notification.entity';
import { EmbeddingService } from '../services/embedding.service';
import { VectorMatchingService } from '../services/vector-matching.service';

export interface GenerateProfileVectorJob {
    profileId: string;
}

export interface GenerateMilestoneVectorJob {
    postId: string;
}

export interface RunMatchingJob {
    projectId: string;
}

@Processor('matching')
export class MatchingProcessor {
    private readonly logger = new Logger(MatchingProcessor.name);

    constructor(
        @InjectRepository(UserProfileVector)
        private profileVectorRepo: Repository<UserProfileVector>,
        @InjectRepository(MilestoneVector)
        private milestoneVectorRepo: Repository<MilestoneVector>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        @InjectRepository(Post)
        private postRepo: Repository<Post>,
        @InjectRepository(ProjectRequest)
        private projectRepo: Repository<ProjectRequest>,
        @InjectRepository(ProjectNotification)
        private notificationRepo: Repository<ProjectNotification>,
        private embeddingService: EmbeddingService,
        private matchingService: VectorMatchingService,
    ) { }

    @Process('generate-profile-vector')
    async handleProfileVector(job: Job<GenerateProfileVectorJob>) {
        const { profileId } = job.data;
        this.logger.log(`Processing profile vector generation for ${profileId}`);

        try {
            const profile = await this.userProfileRepo.findOne({
                where: { id: profileId },
                relations: ['userSkills', 'userSkills.canonicalSkill', 'userDomains', 'userDomains.domain']
            });

            if (!profile) {
                this.logger.warn(`Profile ${profileId} not found`);
                return;
            }

            // Create deterministic summary
            const summary = this.embeddingService.createProfileSummary(profile);

            // Generate embedding
            const embedding = await this.embeddingService.generateEmbedding(summary);

            // Upsert vector
            if (embedding) {
                this.logger.debug(`Generated embedding with length ${embedding.length} for profile ${profileId}`);

                try {
                    await this.profileVectorRepo.upsert(
                        {
                            userProfileId: profile.id,
                            embedding,
                            summaryText: summary,
                            metadata: {
                                skills: profile.userSkills?.map(s => s.canonicalSkill?.name || 'Unknown') || [],
                                domains: profile.userDomains?.map(d => d.domain?.name || 'Unknown') || [],
                            },
                        },
                        ['userProfileId'],
                    );
                    this.logger.log(`Successfully generated/updated profile vector for ${profileId}`);
                } catch (upsertError) {
                    this.logger.error(`Failed to upsert profile vector for ${profileId}: ${upsertError.message}`, upsertError.stack);
                    throw upsertError;
                }
            } else {
                this.logger.warn(`Skipped profile vector for ${profileId}: null embedding`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to generate profile vector for ${profileId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    @Process('generate-milestone-vector')
    async handleMilestoneVector(job: Job<GenerateMilestoneVectorJob>) {
        const { postId } = job.data;
        this.logger.log(`Processing milestone vector generation for post ${postId}`);

        try {
            const post = await this.postRepo.findOne({
                where: { id: postId },
                relations: ['author'],
            });

            if (!post) {
                this.logger.warn(`Post ${postId} not found`);
                return;
            }

            // Only embed meaningful posts (length > 100 chars)
            if (post.content.length < 100) {
                this.logger.log(`Post ${postId} too short, skipping embedding`);
                return;
            }

            // Get user profile ID
            const userProfile = await this.userProfileRepo.findOne({
                where: { identityId: post.authorId },
            });

            if (!userProfile) {
                this.logger.warn(`User profile not found for author ${post.authorId}`);
                return;
            }

            // Generate embedding
            const summary = this.embeddingService.createMilestoneSummary(post);
            const embedding = await this.embeddingService.generateEmbedding(summary);

            if (embedding) {
                // Save milestone vector
                await this.milestoneVectorRepo.upsert(
                    {
                        userProfileId: userProfile.id,
                        postId: post.id,
                        embedding,
                        contentText: post.content,
                    },
                    ['postId'],
                );

                // Clean up old milestones (keep only last 20 per user)
                await this.cleanupOldMilestones(userProfile.id);

                this.logger.log(`Successfully generated milestone vector for post ${postId}`);
            } else {
                this.logger.warn(`Skipped milestone vector for post ${postId}: null embedding`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to generate milestone vector for post ${postId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    @Process('run-matching')
    async handleMatching(job: Job<RunMatchingJob>) {
        const { projectId } = job.data;
        this.logger.log(`Processing matching for project ${projectId}`);

        try {
            const project = await this.projectRepo.findOne({
                where: { id: projectId },
            });

            if (!project) {
                this.logger.warn(`Project ${projectId} not found`);
                return;
            }

            const candidates = await this.matchingService.matchCandidates(project, 50);

            this.logger.log(`Found ${candidates.length} candidates for project ${projectId}`);

            // Log match scores for each candidate
            if (candidates.length > 0) {
                this.logger.log(`\n=== Match Scores for Project ${projectId} ===`);
                candidates.forEach((candidate, index) => {
                    this.logger.log(
                        `#${index + 1} - User: ${candidate.userId.substring(0, 8)}... | ` +
                        `Overall: ${(candidate.score * 100).toFixed(1)}% | ` +
                        `Profile: ${(candidate.profileSimilarity * 100).toFixed(1)}% | ` +
                        `Milestone: ${(candidate.milestoneSimilarity * 100).toFixed(1)}% | ` +
                        `Skills: ${(candidate.requiredSkillVectorScore * 100).toFixed(1)}%`
                    );
                });
                this.logger.log(`===========================================\n`);
            }


            // Create notifications for top candidates
            const notificationEntities = candidates.map((candidate) =>
                this.notificationRepo.create({
                    projectId: project.id,
                    userId: candidate.userId,
                    notificationType: NotificationType.MATCH,
                }),
            );

            if (notificationEntities.length > 0) {
                await this.notificationRepo.save(notificationEntities);
            }

            // Update project status
            await this.projectRepo.update(project.id, {
                status: 'matching' as any,
                matchingCompletedAt: new Date(),
            });

            this.logger.log(`Successfully completed matching for project ${projectId}`);
        } catch (error) {
            this.logger.error(
                `Failed to run matching for project ${projectId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Keep only last 20 milestones per user
     */
    private async cleanupOldMilestones(userProfileId: string): Promise<void> {
        const milestones = await this.milestoneVectorRepo.find({
            where: { userProfileId },
            order: { createdAt: 'DESC' },
        });

        if (milestones.length > 20) {
            const toDelete = milestones.slice(20);
            await this.milestoneVectorRepo.remove(toDelete);
            this.logger.log(
                `Cleaned up ${toDelete.length} old milestones for user ${userProfileId}`,
            );
        }
    }
}
