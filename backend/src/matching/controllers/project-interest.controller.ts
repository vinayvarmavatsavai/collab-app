import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ProjectInterest } from '../entities/project-interest.entity';
import { ProjectRequest } from '../entities/project-request.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { ProjectNotification } from '../entities/project-notification.entity';
import { SubmitInterestDto } from '../dto/submit-interest.dto';
import { VectorMatchingService } from '../services/vector-matching.service';
import { VectorSimilarityService } from '../services/vector-similarity.service';
import { UserProfileVector } from '../entities/user-profile-vector.entity';

@Controller('project-interests')
@UseGuards(JwtAuthGuard)
export class ProjectInterestController {
    private readonly logger = new Logger(ProjectInterestController.name);

    constructor(
        @InjectRepository(ProjectInterest)
        private interestRepo: Repository<ProjectInterest>,
        @InjectRepository(ProjectRequest)
        private projectRepo: Repository<ProjectRequest>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        @InjectRepository(ProjectNotification)
        private notificationRepo: Repository<ProjectNotification>,
        @InjectRepository(UserProfileVector)
        private profileVectorRepo: Repository<UserProfileVector>,
        private matchingService: VectorMatchingService,
        private vectorSimilarity: VectorSimilarityService,
    ) { }

    @Get('me')
    async getMyInterests(@Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        // Get all interests submitted by this user
        const interests = await this.interestRepo
            .createQueryBuilder('interest')
            .leftJoinAndSelect('interest.project', 'project')
            .leftJoinAndSelect('project.creator', 'creator')
            .where('interest.user_id = :userId', { userId: userProfile.id })
            .orderBy('interest.created_at', 'DESC')
            .getMany();

        return interests;
    }

    @Post(':projectId')
    async submitInterest(
        @Param('projectId') projectId: string,
        @Request() req,
        @Body() dto: SubmitInterestDto,
    ) {
        const identityId = req.user.sub;

        // Get user profile
        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        // Check if user has completed onboarding
        if (!userProfile.onboardingCompleted) {
            throw new HttpException(
                'Please complete onboarding before submitting interest',
                HttpStatus.FORBIDDEN,
            );
        }

        // Check project exists
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
        }

        if (project.creatorId === userProfile.id) {
            throw new HttpException(
                'Cannot submit interest in your own project',
                HttpStatus.BAD_REQUEST,
            );
        }

        const existingInterest = await this.interestRepo.findOne({
            where: {
                projectId,
                userId: userProfile.id,
            },
        });

        if (existingInterest) {
            throw new HttpException(
                'You have already submitted interest in this project',
                HttpStatus.CONFLICT,
            );
        }

        // Check visibility mode and notification requirement
        if (project.visibilityMode === 'matching-only') {
            // For matching-only projects, user must have been notified
            const notification = await this.notificationRepo.findOne({
                where: {
                    projectId,
                    userId: userProfile.id,
                    notificationType: 'match' as any,
                },
            });

            if (!notification) {
                throw new HttpException(
                    'This project is invite-only. Only matched candidates can apply.',
                    HttpStatus.FORBIDDEN,
                );
            }
        }
        // For 'open' and 'hybrid' modes, anyone can apply (no notification check needed)

        // Calculate match scores
        let profileSimilarity = 0;
        let milestoneSimilarity = 0;
        let skillOverlap = 0;
        let relevanceScore = 0;

        try {
            // Get user's profile vector for similarity calculation
            const userVector = await this.profileVectorRepo.findOne({
                where: { userProfileId: userProfile.id },
            });

            if (userVector && project.embedding) {
                // Profile similarity via VectorSimilarityService
                profileSimilarity = this.vectorSimilarity.cosineSimilarity(
                    userVector.embedding,
                    project.embedding,
                );

                // Milestone similarity
                milestoneSimilarity = await this.matchingService.getMaxMilestoneSimilarity(
                    userProfile.id,
                    project.embedding,
                );

                // Required skill vector score (replaces text-fuzzy overlap)
                const requiredSkillVectorScore = await this.matchingService.computeRequiredSkillVectorScore(
                    userProfile.id,
                    [], // will be fetched internally from project_required_skills table
                    0.40,
                );
                skillOverlap = requiredSkillVectorScore;

                // Hybrid relevance score — same formula as VectorMatchingService
                relevanceScore = 0.35 * profileSimilarity
                    + 0.25 * milestoneSimilarity
                    + 0.30 * requiredSkillVectorScore
                    + 0.10 * 0; // domainVectorScore not computed separately here
            }
        } catch (error) {
            this.logger.warn(`Failed to calculate match scores: ${error.message}`);
            // Continue without scores
        }

        // Create or update interest
        const interest = this.interestRepo.create({
            projectId,
            userId: userProfile.id,
            interestText: dto.interestText,
            attachmentUrls: dto.attachmentUrls || [],
            profileSimilarity,
            milestoneSimilarity,
            skillOverlap,
            relevanceScore,
        });

        const saved = await this.interestRepo.save(interest);

        this.logger.log(`User ${userProfile.id} submitted interest in project ${projectId}`);

        return saved;
    }


    @Get('project/:projectId')
    async getProjectInterests(@Param('projectId') projectId: string, @Request() req) {
        const identityId = req.user.sub;

        // Get user profile
        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        // Check project exists and user is creator
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
        }

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        if (project.creatorId !== userProfile.id) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        // Get all interests with user details
        const interests = await this.interestRepo
            .createQueryBuilder('interest')
            .leftJoinAndSelect('interest.user', 'user')
            .where('interest.project_id = :projectId', { projectId })
            .orderBy('interest.relevance_score', 'DESC', 'NULLS LAST')
            .addOrderBy('interest.created_at', 'DESC')
            .getMany();

        return interests;
    }
}
