import {
    Controller,
    Post,
    Get,
    Patch,
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
import { Cohort, CohortStatus } from '../entities/cohort.entity';
import { ProjectRequest, ProjectStatus } from '../entities/project-request.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { ProjectNotification, NotificationType } from '../entities/project-notification.entity';
import { FormCohortDto } from '../dto/form-cohort.dto';

@Controller('cohorts')
@UseGuards(JwtAuthGuard)
export class CohortController {
    private readonly logger = new Logger(CohortController.name);

    constructor(
        @InjectRepository(Cohort)
        private cohortRepo: Repository<Cohort>,
        @InjectRepository(ProjectRequest)
        private projectRepo: Repository<ProjectRequest>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        @InjectRepository(ProjectNotification)
        private notificationRepo: Repository<ProjectNotification>,
    ) { }

    @Post('projects/:projectId')
    async formCohort(
        @Param('projectId') projectId: string,
        @Request() req,
        @Body() dto: FormCohortDto,
    ) {
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

        // Check if user has completed onboarding
        if (!userProfile.onboardingCompleted) {
            throw new HttpException(
                'Please complete onboarding before forming a cohort',
                HttpStatus.FORBIDDEN,
            );
        }

        if (project.creatorId !== userProfile.id) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        // Check if cohort already exists
        const existing = await this.cohortRepo.findOne({
            where: { projectId },
        });

        if (existing) {
            throw new HttpException('Cohort already formed', HttpStatus.BAD_REQUEST);
        }

        // Validate member count
        if (dto.memberIds.length > project.maxCohortSize) {
            throw new HttpException(
                `Cohort size exceeds maximum of ${project.maxCohortSize}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // Create cohort (include creator)
        const allMemberIds = [userProfile.id, ...dto.memberIds];

        const cohort = this.cohortRepo.create({
            projectId,
            memberIds: allMemberIds,
            status: CohortStatus.ACTIVE,
        });

        const saved = await this.cohortRepo.save(cohort);

        // Update project status
        await this.projectRepo.update(projectId, {
            status: ProjectStatus.IN_PROGRESS,
            cohortFormedAt: new Date(),
        });

        // Notify selected members
        const selectedNotifications = dto.memberIds.map((userId) => ({
            projectId,
            userId,
            notificationType: NotificationType.SELECTED,
        }));

        if (selectedNotifications.length > 0) {
            await this.notificationRepo.save(selectedNotifications);
        }

        this.logger.log(`Formed cohort for project ${projectId} with ${allMemberIds.length} members`);

        return saved;
    }

    @Get('project/:projectId')
    async getCohortByProject(@Param('projectId') projectId: string, @Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        const cohort = await this.cohortRepo.findOne({
            where: { projectId },
            relations: ['project'],
        });

        if (!cohort) {
            throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
        }

        // Check if user is the project creator or a member
        const isCreator = cohort.project.creatorId === userProfile.id;
        const isMember = cohort.memberIds.includes(userProfile.id);

        if (!isCreator && !isMember) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        return cohort;
    }

    @Get('me')
    async getMyCohorts(@Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        // Find cohorts where user is a member
        const cohorts = await this.cohortRepo
            .createQueryBuilder('cohort')
            .leftJoinAndSelect('cohort.project', 'project')
            .where(':userId = ANY(cohort.member_ids)', { userId: userProfile.id })
            .orderBy('cohort.created_at', 'DESC')
            .getMany();

        return cohorts;
    }

    @Get(':id')
    async getCohort(@Param('id') id: string, @Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        const cohort = await this.cohortRepo.findOne({
            where: { id },
            relations: ['project'],
        });

        if (!cohort) {
            throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
        }

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        // Check if user is a member
        if (!cohort.memberIds.includes(userProfile.id)) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        return cohort;
    }



    @Patch(':id/complete')
    async completeCohort(@Param('id') id: string, @Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        const cohort = await this.cohortRepo.findOne({
            where: { id },
            relations: ['project'],
        });

        if (!cohort) {
            throw new HttpException('Cohort not found', HttpStatus.NOT_FOUND);
        }

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        // Only creator can complete
        if (cohort.project.creatorId !== userProfile.id) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        await this.cohortRepo.update(id, {
            status: CohortStatus.COMPLETED,
            completedAt: new Date(),
        });

        await this.projectRepo.update(cohort.projectId, {
            status: ProjectStatus.COMPLETED,
            completedAt: new Date(),
        });

        return { message: 'Cohort marked as completed' };
    }
}
