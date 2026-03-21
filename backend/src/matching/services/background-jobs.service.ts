import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class BackgroundJobsService {
    private readonly logger = new Logger(BackgroundJobsService.name);

    constructor(
        @InjectQueue('matching') private matchingQueue: Queue,
    ) { }

    /**
     * Queue profile vector generation
     * Non-blocking, runs asynchronously
     */
    async queueProfileVectorUpdate(profileId: string): Promise<void> {
        try {
            await this.matchingQueue.add(
                'generate-profile-vector',
                { profileId },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            );
            this.logger.log(`Queued profile vector update for ${profileId}`);
        } catch (error) {
            this.logger.error(
                `Failed to queue profile vector update: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Queue milestone vector generation
     * Non-blocking, runs asynchronously
     */
    async queueMilestoneVectorGeneration(postId: string): Promise<void> {
        try {
            await this.matchingQueue.add(
                'generate-milestone-vector',
                { postId },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            );
            this.logger.log(`Queued milestone vector generation for post ${postId}`);
        } catch (error) {
            this.logger.error(
                `Failed to queue milestone vector generation: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Queue matching job for a project
     * Non-blocking, runs asynchronously
     */
    async queueMatching(projectId: string): Promise<void> {
        try {
            await this.matchingQueue.add(
                'run-matching',
                { projectId },
                {
                    attempts: 2,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    delay: 1000, // Wait 1 second before starting
                },
            );
            this.logger.log(`Queued matching for project ${projectId}`);
        } catch (error) {
            this.logger.error(
                `Failed to queue matching: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }> {
        const [waiting, active, completed, failed] = await Promise.all([
            this.matchingQueue.getWaitingCount(),
            this.matchingQueue.getActiveCount(),
            this.matchingQueue.getCompletedCount(),
            this.matchingQueue.getFailedCount(),
        ]);

        return { waiting, active, completed, failed };
    }
}
