import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CommunitiesService } from './communities.service';
import {
    CommunitiesController,
    InstitutionsController,
    ClubsController,
    MeDiscoveryController,
} from './communities.controller';
import { AdminClaimsController } from './controllers/admin-claims.controller';
import { AdminClaimsService } from './services/admin-claims.service';
import { ClaimsProcessor } from './processors/claims.processor';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { Club } from './entities/club.entity';
import { ClubMember } from './entities/club-member.entity';
import { InstitutionClaim } from './entities/institution-claim.entity';
import { UsersModule } from '../users/user.module';
import { Identity } from '../auth/entities/identity.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

@Module({
    imports: [
        UsersModule,
        TypeOrmModule.forFeature([
            Community,
            CommunityMember,
            Club,
            ClubMember,
            InstitutionClaim,
            Identity,
            UserProfile,
        ]),
        BullModule.registerQueue({
            name: 'institution-claims-review',
        }),
    ],
    controllers: [
        CommunitiesController,
        InstitutionsController,
        ClubsController,
        AdminClaimsController,
        MeDiscoveryController,
    ],
    providers: [CommunitiesService, ClaimsProcessor, AdminClaimsService],
    exports: [CommunitiesService, AdminClaimsService],
})
export class CommunitiesModule { }
