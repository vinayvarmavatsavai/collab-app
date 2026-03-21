import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OnboardingSession } from './entities/onboarding-session.entity';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { TagGeneratorService } from './services/tag-generator.service';
import { HybridExtractorService } from './services/hybrid-extractor.service';
import { UsersModule } from 'src/users/user.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OnboardingSession]),
        ConfigModule,
        UsersModule,
        MatchingModule,
    ],
    controllers: [OnboardingController],
    providers: [
        OnboardingService,
        TagGeneratorService,
        HybridExtractorService,
    ],
    exports: [OnboardingService],
})
export class OnboardingModule { }
