import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FriendshipsService } from '../services/friendships.service';
import { FriendSuggestionsService } from '../services/friend-suggestions.service';
import { SendFriendRequestDto } from '../dto/send-friend-request.dto';
import { RespondFriendRequestDto } from '../dto/respond-friend-request.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
    constructor(
        private readonly friendshipsService: FriendshipsService,
        private readonly suggestionsService: FriendSuggestionsService,
    ) { }

    @Post('send-request')
    async sendFriendRequest(
        @Request() req: any,
        @Body() dto: SendFriendRequestDto,
    ) {
        return this.friendshipsService.sendFriendRequest(req.user.sub, dto.friendId);
    }

    @Patch('respond/:requestId')
    async respondToRequest(
        @Request() req: any,
        @Param('requestId', ParseUUIDPipe) requestId: string,
        @Body() dto: RespondFriendRequestDto,
    ) {
        return this.friendshipsService.respondToFriendRequest(
            requestId,
            req.user.sub,
            dto.status,
        );
    }

    @Get('my-friends')
    async getMyFriends(
        @Request() req: any,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.friendshipsService.getMyFriends(
            req.user.sub,
            limit ? parseInt(limit.toString()) : 50,
            offset ? parseInt(offset.toString()) : 0,
        );
    }

    @Get('pending-requests')
    async getPendingRequests(@Request() req: any) {
        return this.friendshipsService.getPendingRequests(req.user.sub);
    }

    @Get('sent-requests')
    async getSentRequests(@Request() req: any) {
        return this.friendshipsService.getSentRequests(req.user.sub);
    }

    @Delete(':friendshipId')
    async removeFriend(
        @Request() req: any,
        @Param('friendshipId', ParseUUIDPipe) friendshipId: string,
    ) {
        return this.friendshipsService.removeFriend(friendshipId, req.user.sub);
    }

    @Get('status/:userId')
    async getFriendshipStatus(
        @Request() req: any,
        @Param('userId', ParseUUIDPipe) userId: string,
    ) {
        return this.friendshipsService.getFriendshipStatus(req.user.sub, userId);
    }

    @Get('mutual/:userId')
    async getMutualFriends(
        @Request() req: any,
        @Param('userId', ParseUUIDPipe) userId: string,
    ) {
        return this.friendshipsService.getMutualFriends(req.user.sub, userId);
    }

    @Get('suggestions')
    async getSuggestions(
        @Request() req: any,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.suggestionsService.getSuggestions(
            req.user.sub,
            limit ? parseInt(limit.toString()) : 20,
            offset ? parseInt(offset.toString()) : 0,
        );
    }

    @Post('suggestions/refresh')
    async refreshSuggestions(@Request() req: any) {
        return this.suggestionsService.refreshSuggestions(req.user.sub);
    }
}
