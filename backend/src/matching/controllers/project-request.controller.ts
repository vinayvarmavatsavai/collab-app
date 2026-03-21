import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ProjectRequest, ProjectStatus } from '../entities/project-request.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { EmbeddingService } from '../services/embedding.service';
import { BackgroundJobsService } from '../services/background-jobs.service';
import { ProjectRequiredSkill } from '../entities/project-required-skill.entity';
import { CanonicalSkillService } from '../services/canonical-skill.service';
import { CanonicalDomainService } from '../services/canonical-domain.service';
import { CreateProjectRequestDto } from '../dto/create-project-request.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectRequestController {
    private readonly logger = new Logger(ProjectRequestController.name);

    constructor(
        @InjectRepository(ProjectRequest)
        private projectRepo: Repository<ProjectRequest>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        @InjectRepository(ProjectRequiredSkill)
        private projectRequiredSkillRepo: Repository<ProjectRequiredSkill>,
        private canonicalSkillService: CanonicalSkillService,
        private canonicalDomainService: CanonicalDomainService,
        private embeddingService: EmbeddingService,
        private backgroundJobs: BackgroundJobsService,
    ) { }

    @Post()
    async createProject(@Request() req, @Body() dto: CreateProjectRequestDto) {
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
                'Please complete onboarding before creating a collaboration request',
                HttpStatus.FORBIDDEN,
            );
        }



        // Generate embedding for project
        const projectSummary = this.embeddingService.createProjectSummary(
            dto.title,
            dto.description,
            dto.requiredSkills,
            dto.requiredDomains,
        );



        const embedding = await this.embeddingService.generateEmbedding(projectSummary);

        // Create project
        const project = this.projectRepo.create({
            creatorId: userProfile.id,
            title: dto.title,
            description: dto.description,
            requiredSkills: dto.requiredSkills,
            requiredDomains: dto.requiredDomains,
            optionalSkills: dto.optionalSkills || [],
            preferredExperienceLevel: dto.preferredExperienceLevel,
            maxCohortSize: dto.maxCohortSize || 5,
            visibilityMode: dto.visibilityMode || 'hybrid',
            embedding: embedding || undefined,
            status: ProjectStatus.OPEN,
        });

        const saved = await this.projectRepo.save(project);

        if (dto.requiredSkills && dto.requiredSkills.length > 0) {
            const canonicalSkills = await this.canonicalSkillService.findOrCreateSkillsBatch(dto.requiredSkills);

            const requiredSkillEntities = canonicalSkills.map(skill => {
                return this.projectRequiredSkillRepo.create({
                    projectId: saved.id,
                    canonicalSkillId: skill.id,
                    importance: 5,
                });
            });
            await this.projectRequiredSkillRepo.save(requiredSkillEntities);
        }

        // Queue matching job only for matching-only and hybrid modes
        if (saved.visibilityMode === 'matching-only' || saved.visibilityMode === 'hybrid') {
            await this.backgroundJobs.queueMatching(saved.id);
            this.logger.log(`Created project ${saved.id} with ${saved.visibilityMode} mode and queued matching`);
        } else {
            this.logger.log(`Created project ${saved.id} with open mode (no matching)`);
        }

        return saved;
    }

    @Get('my-requests')
    async getMyProjects(@Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        const projects = await this.projectRepo.find({
            where: { creatorId: userProfile.id },
            relations: ['creator'],
            order: { createdAt: 'DESC' },
        });

        return projects;
    }

    @Get(':id')
    async getProject(@Param('id') id: string, @Request() req) {
        const project = await this.projectRepo.findOne({
            where: { id },
            relations: ['creator'],
        });

        if (!project) {
            throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
        }

        return project;
    }

    @Get()
    async listProjects(
        @Query('status') status?: ProjectStatus,
        @Query('limit') limit: number = 20,
        @Query('offset') offset: number = 0,
    ) {
        const query = this.projectRepo
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.creator', 'creator')
            // Exclude matching-only projects from public listings
            .where('project.visibility_mode IN (:...modes)', {
                modes: ['open', 'hybrid']
            })
            .orderBy('project.createdAt', 'DESC')
            .skip(offset)
            .take(Math.min(limit, 100));

        if (status) {
            query.andWhere('project.status = :status', { status });
        }

        const [projects, total] = await query.getManyAndCount();

        return {
            projects,
            total,
            limit,
            offset,
        };
    }

    @Patch(':id')
    async updateProject(
        @Param('id') id: string,
        @Request() req,
        @Body() updates: Partial<CreateProjectRequestDto>,
    ) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        const project = await this.projectRepo.findOne({ where: { id } });

        if (!project) {
            throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
        }

        if (project.creatorId !== userProfile.id) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        // Update project
        await this.projectRepo.update(id, updates);

        let relationsUpdated = false;

        // Sync Domains Domain Entities if updated
        if (updates.requiredDomains) {
            const domainEntities = await Promise.all(
                updates.requiredDomains.map(d => this.canonicalDomainService.findOrCreateCanonicalDomain(d, undefined, identityId))
            );
            project.domains = domainEntities;
            await this.projectRepo.save(project);
            relationsUpdated = true;
        }

        // Sync Skills
        if (updates.requiredSkills) {
            await this.projectRequiredSkillRepo.delete({ projectId: id });
            if (updates.requiredSkills.length > 0) {
                const canonicalSkills = await this.canonicalSkillService.findOrCreateSkillsBatch(updates.requiredSkills);
                const requiredSkillEntities = canonicalSkills.map(skill => {
                    return this.projectRequiredSkillRepo.create({
                        projectId: id,
                        canonicalSkillId: skill.id,
                        importance: 5,
                    });
                });
                await this.projectRequiredSkillRepo.save(requiredSkillEntities);
            }
            relationsUpdated = true;
        }

        // If description/skills/domains changed, regenerate embedding
        if (updates.description || updates.requiredSkills || updates.requiredDomains || relationsUpdated) {
            const updated = await this.projectRepo.findOne({ where: { id } });
            if (updated) {
                const projectSummary = this.embeddingService.createProjectSummary(
                    updated.title,
                    updated.description,
                    updated.requiredSkills,
                    updated.requiredDomains,
                );
                const embedding = await this.embeddingService.generateEmbedding(projectSummary);
                if (embedding) {
                    await this.projectRepo.update(id, { embedding });
                }
            }
        }

        return this.projectRepo.findOne({ where: { id } });
    }

    @Delete(':id')
    async cancelProject(@Param('id') id: string, @Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        const project = await this.projectRepo.findOne({ where: { id } });

        if (!project) {
            throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
        }

        if (project.creatorId !== userProfile.id) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        await this.projectRepo.update(id, { status: ProjectStatus.CANCELLED });

        return { message: 'Project cancelled successfully' };
    }
}
