
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { CommunitiesService } from '../communities.service';

@Processor('institution-claims-review')
export class ClaimsProcessor {
    private readonly logger = new Logger(ClaimsProcessor.name);

    constructor(private readonly communitiesService: CommunitiesService) { }

    @Process('review-claim')
    async handleReviewClaim(job: Job<{ claimId: string }>) {
        this.logger.log(`New claim received for review: ${job.data.claimId}`);
        // In a real system, this might send an email to admins or update an external dashboard
    }

    // Future jobs: approve-claim, reject-claim if offloaded to background
}
