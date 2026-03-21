import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UserProfileVector } from './entities/user-profile-vector.entity';
import { MilestoneVector } from './entities/milestone-vector.entity';
import { ProjectRequest } from './entities/project-request.entity';
import { ProjectInterest } from './entities/project-interest.entity';
import { Cohort } from './entities/cohort.entity';
import { ProjectNotification } from './entities/project-notification.entity';
import { CanonicalSkill } from './entities/canonical-skill.entity';
import { SkillAlias } from './entities/skill-alias.entity';
import { UserSkill } from './entities/user-skill.entity';
import { ProjectRequiredSkill } from './entities/project-required-skill.entity';
import { ProjectOptionalSkill } from './entities/project-optional-skill.entity';
import { SkillReviewQueue } from './entities/skill-review-queue.entity';
import { ProfessionalRole } from './entities/professional-role.entity';
import { RoleAlias } from './entities/role-alias.entity';
import { RoleReviewQueue } from './entities/role-review-queue.entity';
import { Domain } from './entities/domain.entity';
import { DomainAlias } from './entities/domain-alias.entity';
import { DomainReviewQueue } from './entities/domain-review-queue.entity';
import { CanonicalAbuseLog } from './entities/canonical-abuse-log.entity';
import { CommunityMember } from '../communities/entities/community-member.entity';
import { ClubMember } from '../communities/entities/club-member.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserRole } from './entities/user-role.entity';
import { UserDomain } from './entities/user-domain.entity';
import { Post } from '../posts/entities/post.entity';
import { EmbeddingService } from './services/embedding.service';
import { VectorMatchingService } from './services/vector-matching.service';
import { VectorSimilarityService } from './services/vector-similarity.service';
import { BackgroundJobsService } from './services/background-jobs.service';
import { SkillNormalizationService } from './services/skill-normalization.service';
import { CanonicalSkillService } from './services/canonical-skill.service';
import { CanonicalRoleService } from './services/canonical-role.service';
import { CanonicalDomainService } from './services/canonical-domain.service';
import { ModerationService } from './services/moderation.service';
import { CanonicalRateLimitService } from './services/canonical-rate-limit.service';
import { CanonicalCleanupService } from './services/canonical-cleanup.service';
import { MatchingProcessor } from './processors/matching.processor';
import { ProjectRequestController } from './controllers/project-request.controller';
import { ProjectInterestController } from './controllers/project-interest.controller';
import { CohortController } from './controllers/cohort.controller';
import { ProjectNotificationController } from './controllers/project-notification.controller';
import { CanonicalSkillController } from './controllers/canonical-skill.controller';
import { CanonicalRoleController } from './controllers/canonical-role.controller';
import { CanonicalDomainController } from './controllers/canonical-domain.controller';
import { AdminMatchingController } from './controllers/admin-matching.controller';

@Module({
    imports: [
        ConfigModule,
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([
            UserProfileVector,
            MilestoneVector,
            ProjectRequest,
            ProjectInterest,
            Cohort,
            ProjectNotification,
            CanonicalSkill,
            SkillAlias,
            UserSkill,
            UserRole,
            UserDomain,
            ProjectRequiredSkill,
            ProjectOptionalSkill,
            SkillReviewQueue,
            UserProfile,
            Post,
            ProfessionalRole,
            RoleAlias,
            RoleReviewQueue,
            Domain,
            DomainAlias,
            DomainReviewQueue,
            CanonicalAbuseLog,
            CommunityMember,
            ClubMember,
        ]),
        BullModule.registerQueue({
            name: 'matching',
        }),
    ],
    controllers: [
        ProjectRequestController,
        ProjectInterestController,
        CohortController,
        ProjectNotificationController,
        CanonicalSkillController,
        CanonicalRoleController,
        CanonicalDomainController,
        AdminMatchingController,
    ],
    providers: [
        EmbeddingService,
        VectorSimilarityService,
        VectorMatchingService,
        BackgroundJobsService,
        SkillNormalizationService,
        CanonicalSkillService,
        CanonicalRoleService,
        CanonicalDomainService,
        ModerationService,
        CanonicalRateLimitService,
        CanonicalCleanupService,
        MatchingProcessor,
    ],
    exports: [
        BackgroundJobsService,
        EmbeddingService,
        VectorSimilarityService,
        VectorMatchingService,
        SkillNormalizationService,
        CanonicalSkillService,
        CanonicalRoleService,
        CanonicalDomainService,
        ModerationService,
    ],
})
export class MatchingModule {
    constructor(private readonly processor: MatchingProcessor) {
        console.log('>>> MatchingModule initialized, MatchingProcessor injected <<<');
    }
}
