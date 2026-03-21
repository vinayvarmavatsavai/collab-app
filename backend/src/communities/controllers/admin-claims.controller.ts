import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AdminClaimsService } from '../services/admin-claims.service';
import { CreateAdminClaimDto } from '../dto/create-admin-claim.dto';
import { ReviewAdminClaimDto } from '../dto/review-admin-claim.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TypesGuard } from '../../guards/types.guard';
import { Types } from '../../decorators/types.decorator';
import { ClaimStatus } from '../entities/institution-claim.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class AdminClaimsController {
    constructor(private readonly claimsService: AdminClaimsService) { }

    @Post('communities/:id/claims')
    async createClaim(
        @Request() req,
        @Param('id') communityId: string,
        @Body() dto: CreateAdminClaimDto,
    ) {
        return this.claimsService.createClaim(req.user.sub, communityId, dto);
    }

    @Get('admin/claims')
    @UseGuards(TypesGuard)
    @Types('ADMIN')
    async findAll(@Query('status') status?: ClaimStatus) {
        return this.claimsService.findAll(status);
    }

    @Post('admin/claims/:id/review')
    @UseGuards(TypesGuard)
    @Types('ADMIN')
    async reviewClaim(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: ReviewAdminClaimDto,
    ) {
        return this.claimsService.reviewClaim(id, req.user.sub, dto);
    }
}
