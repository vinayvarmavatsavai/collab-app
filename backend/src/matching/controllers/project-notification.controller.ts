import {
    Controller,
    Get,
    Patch,
    Param,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ProjectNotification } from '../entities/project-notification.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';

@Controller('notifications/projects')
@UseGuards(JwtAuthGuard)
export class ProjectNotificationController {
    constructor(
        @InjectRepository(ProjectNotification)
        private notificationRepo: Repository<ProjectNotification>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
    ) { }

    @Get()
    async getMyNotifications(@Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        const notifications = await this.notificationRepo.find({
            where: { userId: userProfile.id },
            relations: ['project', 'project.creator'],
            order: { notifiedAt: 'DESC' },
            take: 50,
        });

        return notifications;
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        const notification = await this.notificationRepo.findOne({
            where: { id },
        });

        if (!notification) {
            throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
        }

        if (notification.userId !== userProfile.id) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        await this.notificationRepo.update(id, { viewedAt: new Date() });

        return { success: true };
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        const identityId = req.user.sub;

        const userProfile = await this.userProfileRepo.findOne({
            where: { identityId },
        });

        if (!userProfile) {
            throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
        }

        await this.notificationRepo
            .createQueryBuilder()
            .update(ProjectNotification)
            .set({ viewedAt: new Date() })
            .where("userId = :userId", { userId: userProfile.id })
            .andWhere("viewedAt IS NULL")
            .execute();

        return { success: true };
    }
}
