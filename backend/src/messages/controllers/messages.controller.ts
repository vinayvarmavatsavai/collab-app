import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { MessagesService } from '../services/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Post('conversations/direct/:userId')
    async getOrCreateDirectConversation(
        @Request() req: any,
        @Param('userId', ParseUUIDPipe) userId: string,
    ) {
        return this.messagesService.getOrCreateDirectConversation(req.user.sub, userId);
    }

    @Get('conversations')
    async listConversations(@Request() req: any) {
        return this.messagesService.listConversations(req.user.sub);
    }

    @Get('conversations/:conversationId')
    async getConversationSummary(
        @Request() req: any,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
    ) {
        return this.messagesService.getConversationSummaryForUser(
            req.user.sub,
            conversationId,
        );
    }

    @Get('conversations/:conversationId/messages')
    async getConversationMessages(
        @Request() req: any,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagesService.getConversationMessages(
            req.user.sub,
            conversationId,
            limit ? parseInt(limit, 10) : 50,
        );
    }

    @Post('conversations/:conversationId/messages')
    async sendMessage(
        @Request() req: any,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Body() dto: SendMessageDto,
    ) {
        return this.messagesService.sendMessage(req.user.sub, conversationId, dto);
    }

    @Patch('conversations/:conversationId/read')
    async markConversationRead(
        @Request() req: any,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
    ) {
        return this.messagesService.markConversationRead(req.user.sub, conversationId);
    }

    @Patch('conversations/:conversationId/archive')
    async archiveConversation(
        @Request() req: any,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
    ) {
        return this.messagesService.archiveConversation(req.user.sub, conversationId);
    }
}