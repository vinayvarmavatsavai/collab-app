
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    Patch,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { ClubMemberStatus } from './entities/club-member.entity';
import { IdentityGuard } from '../guards/identity.guard';
import { RequireType } from '../decorators/require-type.decorator';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('communities')
export class CommunitiesController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createCommunityDto: CreateCommunityDto, @Request() req) {
        return this.communitiesService.create(createCommunityDto, req.user.sub);
    }

    @Get()
    findAll() {
        return this.communitiesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.communitiesService.findOne(id);
    }

    @Post(':id/clubs')
    @UseGuards(JwtAuthGuard)
    createClub(
        @Param('id') id: string,
        @Body() createClubDto: CreateClubDto,
        @Request() req,
    ) {
        return this.communitiesService.createClub(id, req.user.sub, createClubDto);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    join(@Param('id') id: string, @Request() req) {
        return this.communitiesService.join(id, req.user.sub);
    }

    @Get(':id/members')
    getMembers(@Param('id') id: string) {
        return this.communitiesService.getCommunityMembers(id);
    }

    @Patch(':id/members/:memberId/promote')
    @UseGuards(JwtAuthGuard)
    promoteMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Request() req
    ) {
        // Let's pass member.userId from frontend.
        return this.communitiesService.promoteToAdmin(id, memberId, req.user.sub);
    }

    @Patch(':id/members/:memberId/demote')
    @UseGuards(JwtAuthGuard)
    demoteMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Request() req
    ) {
        return this.communitiesService.demoteCommunityMember(id, memberId, req.user.sub);
    }
}

@Controller('clubs')
export class ClubsController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.communitiesService.findClub(id);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    join(@Param('id') id: string, @Request() req) {
        return this.communitiesService.joinClub(id, req.user.sub);
    }

    @Get(':id/members')
    getMembers(@Param('id') id: string, @Query('status') status?: ClubMemberStatus) {
        return this.communitiesService.getClubMembers(id, status);
    }

    @Patch(':id/members/:memberId')
    @UseGuards(JwtAuthGuard)
    respondToRequest(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Body('status') status: ClubMemberStatus,
        @Request() req
    ) {
        return this.communitiesService.respondToClubRequest(id, memberId, status, req.user.sub);
    }

    @Patch(':id/members/:memberId/promote')
    @UseGuards(JwtAuthGuard)
    promoteMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Request() req
    ) {
        return this.communitiesService.promoteToClubAdmin(id, memberId, req.user.sub);
    }

    @Patch(':id/members/:memberId/demote')
    @UseGuards(JwtAuthGuard)
    demoteMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Request() req
    ) {
        return this.communitiesService.demoteClubMember(id, memberId, req.user.sub);
    }
}

@Controller('institutions')
export class InstitutionsController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @Post(':id/claim')
    @UseGuards(JwtAuthGuard)
    claim(@Param('id') id: string, @Body() body, @Request() req) {
        return this.communitiesService.claimInstitution(id, req.user.sub, body.evidence);
    }
}

@Controller('me')
export class MeDiscoveryController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @Get('communities')
    @UseGuards(JwtAuthGuard)
    getMyCommunities(@Request() req) {
        return this.communitiesService.findMyCommunities(req.user.sub);
    }

    @Get('clubs')
    @UseGuards(JwtAuthGuard)
    getMyClubs(@Request() req) {
        return this.communitiesService.findMyClubs(req.user.sub);
    }
}




