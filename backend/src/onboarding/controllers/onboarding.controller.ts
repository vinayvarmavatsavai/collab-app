import { Controller, Post, Body, Get, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OnboardingService } from '../services/onboarding.service';
import { OnboardingStatus } from '../enums/onboarding-status.enum';
import type { HybridInput } from '../services/hybrid-extractor.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
    constructor(
        private readonly service: OnboardingService,
    ) { }

    @Post('start')
    start(@Request() req: any) {
        return this.service.start(req.user.sub);
    }

    @Post('answer')
    answer(@Request() req: any, @Body() hybridInput: HybridInput) {
        return this.service.answer(req.user.sub, hybridInput);
    }

    @Post('skip')
    skip(@Request() req: any) {
        return this.service.skip(req.user.sub);
    }

    @Post('finalize')
    finalize(@Request() req: any, @Body() profile: any) {
        return this.service.finalize(req.user.sub, profile);
    }

    @Get('status')
    getStatus(@Request() req: any) {
        return this.service.getStatus(req.user.sub);
    }

    @Post('sync')
    async syncToProfile(@Request() req: any) {
        const status = await this.service.getStatus(req.user.sub);
        if (status.status === OnboardingStatus.COMPLETED && status.profile) {
            await this.service.finalize(req.user.sub, status.profile);
            return { success: true, message: 'Profile synced successfully' };
        }
        return { success: false, message: 'Onboarding not completed' };
    }
}