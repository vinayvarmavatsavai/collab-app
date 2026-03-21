import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Delete,
} from '@nestjs/common';
import { IdentityGuard } from '../../guards/identity.guard';
import { RequireType } from '../../decorators/require-type.decorator';
import { CanonicalSkillService } from '../services/canonical-skill.service';
import { CanonicalDomainService } from '../services/canonical-domain.service';
import { CanonicalRoleService } from '../services/canonical-role.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('admin/matching')
@UseGuards(JwtAuthGuard, IdentityGuard)
@RequireType('ADMIN')
export class AdminMatchingController {
    constructor(
        private readonly canonicalSkillService: CanonicalSkillService,
        private readonly canonicalDomainService: CanonicalDomainService,
        private readonly canonicalRoleService: CanonicalRoleService,
    ) { }

    // ----------------------------------------------------------------
    // SKILL REVIEW QUEUE
    // ----------------------------------------------------------------

    @Get('skills/reviews')
    async getPendingReviews(
        @Query('limit') limit = 50,
        @Query('offset') offset = 0,
    ) {
        return this.canonicalSkillService.getPendingReviews(Number(limit), Number(offset));
    }

    @Patch('skills/reviews/:id/reject')
    async rejectReview(
        @Param('id') id: string,
        @Request() req,
        @Body('notes') notes?: string,
    ) {
        return this.canonicalSkillService.rejectReviewItem(id, req.user.id, notes);
    }

    @Patch('skills/reviews/:id/approve')
    async approveReview(
        @Param('id') id: string,
        @Request() req,
        @Body('mergeToSkillId') mergeToSkillId: string,
    ) {
        return this.canonicalSkillService.approveReviewItem(id, req.user.id, mergeToSkillId);
    }

    // ----------------------------------------------------------------
    // UNVERIFIED SKILLS MANAGEMENT
    // ----------------------------------------------------------------

    @Get('skills/unverified')
    async getUnverifiedSkills(
        @Query('limit') limit = 50,
        @Query('offset') offset = 0,
    ) {
        return this.canonicalSkillService.getUnverifiedSkills(Number(limit), Number(offset));
    }

    @Patch('skills/:id/verify')
    async verifySkill(@Param('id') id: string) {
        return this.canonicalSkillService.verifySkill(id);
    }

    @Post('skills/merge')
    async mergeSkills(
        @Request() req,
        @Body() body: { targetSkillId: string; mergeIntoSkillId: string },
    ) {
        return this.canonicalSkillService.mergeSkill(
            body.targetSkillId,
            body.mergeIntoSkillId,
            req.user.id
        );
    }

    @Delete('skills/:id')
    async deleteSkill(
        @Param('id') id: string,
        @Request() req,
    ) {
        return this.canonicalSkillService.deleteSkill(id, req.user.id);
    }

    // ----------------------------------------------------------------
    // DOMAINS
    // ----------------------------------------------------------------

    @Get('domains/reviews')
    async getPendingDomainReviews(
        @Query('limit') limit = 50,
        @Query('offset') offset = 0,
    ) {
        return this.canonicalDomainService.getPendingReviews(Number(limit), Number(offset));
    }

    @Patch('domains/reviews/:id/reject')
    async rejectDomainReview(
        @Param('id') id: string,
        @Request() req,
        @Body('notes') notes?: string,
    ) {
        return this.canonicalDomainService.rejectReviewItem(id, req.user.id, notes);
    }

    @Patch('domains/reviews/:id/approve')
    async approveDomainReview(
        @Param('id') id: string,
        @Request() req,
        @Body('mergeToDomainId') mergeToDomainId: string,
    ) {
        return this.canonicalDomainService.approveReviewItem(id, req.user.id, mergeToDomainId);
    }

    @Get('domains/unverified')
    async getUnverifiedDomains(
        @Query('limit') limit = 50,
        @Query('offset') offset = 0,
    ) {
        return this.canonicalDomainService.getUnverifiedDomains(Number(limit), Number(offset));
    }

    @Patch('domains/:id/verify')
    async verifyDomain(@Param('id') id: string) {
        return this.canonicalDomainService.verifyDomain(id);
    }

    @Post('domains/merge')
    async mergeDomains(
        @Request() req,
        @Body() body: { targetDomainId: string; mergeIntoDomainId: string },
    ) {
        return this.canonicalDomainService.mergeDomain(
            body.targetDomainId,
            body.mergeIntoDomainId,
            req.user.id
        );
    }

    @Delete('domains/:id')
    async deleteDomain(
        @Param('id') id: string,
        @Request() req,
    ) {
        return this.canonicalDomainService.deleteDomain(id, req.user.id);
    }

    // ----------------------------------------------------------------
    // ROLES
    // ----------------------------------------------------------------

    @Get('roles/reviews')
    async getPendingRoleReviews(
        @Query('limit') limit = 50,
        @Query('offset') offset = 0,
    ) {
        return this.canonicalRoleService.getPendingReviews(Number(limit), Number(offset));
    }

    @Patch('roles/reviews/:id/reject')
    async rejectRoleReview(
        @Param('id') id: string,
        @Request() req,
        @Body('notes') notes?: string,
    ) {
        return this.canonicalRoleService.rejectReviewItem(id, req.user.id, notes);
    }

    @Patch('roles/reviews/:id/approve')
    async approveRoleReview(
        @Param('id') id: string,
        @Request() req,
        @Body('mergeToRoleId') mergeToRoleId: string,
    ) {
        return this.canonicalRoleService.approveReviewItem(id, req.user.id, mergeToRoleId);
    }

    @Get('roles/unverified')
    async getUnverifiedRoles(
        @Query('limit') limit = 50,
        @Query('offset') offset = 0,
    ) {
        return this.canonicalRoleService.getUnverifiedRoles(Number(limit), Number(offset));
    }

    @Patch('roles/:id/verify')
    async verifyRole(@Param('id') id: string) {
        return this.canonicalRoleService.verifyRole(id);
    }

    @Post('roles/merge')
    async mergeRoles(
        @Request() req,
        @Body() body: { targetRoleId: string; mergeIntoRoleId: string },
    ) {
        return this.canonicalRoleService.mergeRole(
            body.targetRoleId,
            body.mergeIntoRoleId,
            req.user.id
        );
    }

    @Delete('roles/:id')
    async deleteRole(
        @Param('id') id: string,
        @Request() req,
    ) {
        return this.canonicalRoleService.deleteRole(id, req.user.id);
    }
}
