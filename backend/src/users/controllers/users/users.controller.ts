import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';
import { UpdateUserProfileDto } from '../../dto/update-user-profile.dto';
import { UpdateProfileExtendedDto } from '../../dto/update-profile-extended.dto';
import { AddExperienceDto, UpdateExperienceDto } from '../../dto/experience.dto';
import { AddEducationDto, UpdateEducationDto } from '../../dto/education.dto';
import { AddCertificationDto } from '../../dto/certification.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@Request() req: any) {
        return this.usersService.getFullProfile(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/profile')
    async getMyProfile(@Request() req: any) {
        return this.usersService.getUserProfileById(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/profile')
    async updateMyProfile(
        @Request() req: any,
        @Body() updateDto: UpdateUserProfileDto,
    ) {
        return this.usersService.updateUserProfile(req.user.sub, updateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/profile/extended')
    async updateExtendedProfile(
        @Request() req: any,
        @Body() updateDto: UpdateProfileExtendedDto,
    ) {
        return this.usersService.updateUserProfile(req.user.sub, updateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('get-cloudinary-signature')
    getCloudinarySignature() {
        return this.usersService.getCloudinarySignature();
    }

    @UseGuards(JwtAuthGuard)
    @Get('search')
    async searchUsers(
        @Query('q') query: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.usersService.searchUsers(
            query,
            limit ? parseInt(limit.toString()) : 20,
            offset ? parseInt(offset.toString()) : 0,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile/:username')
    async getProfileByUsername(@Param('username') username: string) {
        return this.usersService.getProfileByUsername(username);
    }

    // PUBLIC PROFILE ENDPOINT FOR QR / SHAREABLE LINKS
    @Get('public/profile/:username')
    async getPublicProfileByUsername(@Param('username') username: string) {
        return this.usersService.getPublicProfileByUsername(username);
    }

    @UseGuards(JwtAuthGuard)
    @Get('id/:userId')
    async getUserProfileById(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.usersService.getProfileByUserId(userId);
    }

    // Experience endpoints
    @UseGuards(JwtAuthGuard)
    @Post('me/profile/experience')
    async addExperience(
        @Request() req: any,
        @Body() dto: AddExperienceDto,
    ) {
        return this.usersService.addExperience(req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/profile/experience/:id')
    async updateExperience(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateExperienceDto,
    ) {
        return this.usersService.updateExperience(req.user.sub, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/profile/experience/:id')
    async deleteExperience(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.usersService.deleteExperience(req.user.sub, id);
    }

    // Education endpoints
    @UseGuards(JwtAuthGuard)
    @Post('me/profile/education')
    async addEducation(
        @Request() req: any,
        @Body() dto: AddEducationDto,
    ) {
        return this.usersService.addEducation(req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/profile/education/:id')
    async updateEducation(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateEducationDto,
    ) {
        return this.usersService.updateEducation(req.user.sub, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/profile/education/:id')
    async deleteEducation(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.usersService.deleteEducation(req.user.sub, id);
    }

    // Certification endpoints
    @UseGuards(JwtAuthGuard)
    @Post('me/profile/certification')
    async addCertification(
        @Request() req: any,
        @Body() dto: AddCertificationDto,
    ) {
        return this.usersService.addCertification(req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/profile/certification/:id')
    async deleteCertification(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.usersService.deleteCertification(req.user.sub, id);
    }

    // Domain endpoints
    @UseGuards(JwtAuthGuard)
    @Post('me/profile/domains')
    async addUserDomain(
        @Request() req: any,
        @Body() body: { domain: string },
    ) {
        return this.usersService.addUserDomain(req.user.sub, body.domain);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/profile/domains/:id')
    async removeUserDomain(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.usersService.removeUserDomain(req.user.sub, id);
    }

    // Role endpoints
    @UseGuards(JwtAuthGuard)
    @Post('me/profile/roles')
    async addUserRole(
        @Request() req: any,
        @Body() body: { role: string },
    ) {
        return this.usersService.addUserRole(req.user.sub, body.role);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/profile/roles/:id')
    async removeUserRole(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.usersService.removeUserRole(req.user.sub, id);
    }

    // Profile completeness
    @UseGuards(JwtAuthGuard)
    @Get('me/profile/completeness')
    async getProfileCompleteness(@Request() req: any) {
        return this.usersService.getProfileCompleteness(req.user.sub);
    }
}