import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { Conversation, ConversationType } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message, MessageType } from '../entities/message.entity';
import { Identity } from 'src/auth/entities/identity.entity';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,

        @InjectRepository(ConversationParticipant)
        private readonly participantRepo: Repository<ConversationParticipant>,

        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        @InjectRepository(Identity)
        private readonly identityRepo: Repository<Identity>,
    ) {}

    async getOrCreateDirectConversation(currentUserId: string, otherUserId: string) {
        if (currentUserId === otherUserId) {
            throw new ForbiddenException('Cannot create a direct conversation with yourself');
        }

        const otherUser = await this.identityRepo.findOne({
            where: { id: otherUserId },
            select: ['id', 'username', 'email'],
        });

        if (!otherUser) {
            throw new NotFoundException('Target user not found');
        }

        const currentParticipantRows = await this.participantRepo.find({
            where: { identityId: currentUserId },
            select: ['conversationId'],
        });

        if (currentParticipantRows.length > 0) {
            const candidateConversationIds = currentParticipantRows.map((row) => row.conversationId);

            const participants = await this.participantRepo.find({
                where: candidateConversationIds.map((conversationId) => ({ conversationId })),
                relations: ['conversation'],
            });

            const grouped = new Map<string, ConversationParticipant[]>();

            for (const participant of participants) {
                if (!participant.conversation || participant.conversation.type !== ConversationType.DIRECT) {
                    continue;
                }

                const list = grouped.get(participant.conversationId) || [];
                list.push(participant);
                grouped.set(participant.conversationId, list);
            }

            for (const [conversationId, conversationParticipants] of grouped.entries()) {
                const ids = conversationParticipants.map((p) => p.identityId).sort();
                if (
                    ids.length === 2 &&
                    ids.includes(currentUserId) &&
                    ids.includes(otherUserId)
                ) {
                    return this.getConversationSummaryForUser(currentUserId, conversationId);
                }
            }
        }

        const conversation = this.conversationRepo.create({
            type: ConversationType.DIRECT,
            createdById: currentUserId,
            lastMessageAt: new Date(),
        });

        const savedConversation = await this.conversationRepo.save(conversation);

        const participantsToCreate = [currentUserId, otherUserId].map((identityId) =>
            this.participantRepo.create({
                conversationId: savedConversation.id,
                identityId,
            }),
        );

        await this.participantRepo.save(participantsToCreate);

        return this.getConversationSummaryForUser(currentUserId, savedConversation.id);
    }

    async listConversations(currentUserId: string) {
        const memberships = await this.participantRepo.find({
            where: { identityId: currentUserId, isArchived: false },
            relations: ['conversation'],
            order: {
                conversation: {
                    lastMessageAt: 'DESC',
                },
            },
        });

        const results = await Promise.all(
            memberships.map((membership) =>
                this.getConversationSummaryForUser(currentUserId, membership.conversationId),
            ),
        );

        return results.filter(Boolean);
    }

    async getConversationSummaryForUser(currentUserId: string, conversationId: string) {
        await this.assertParticipant(currentUserId, conversationId);

        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
            relations: ['participants', 'participants.identity'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const selfParticipant = conversation.participants.find(
            (p) => p.identityId === currentUserId,
        );

        const otherParticipants = conversation.participants.filter(
            (p) => p.identityId !== currentUserId,
        );

        const lastMessage = await this.messageRepo.findOne({
            where: { conversationId },
            order: { createdAt: 'DESC' },
            relations: ['sender'],
        });

        const unreadCount = selfParticipant?.lastReadAt
            ? await this.messageRepo.count({
                  where: {
                      conversationId,
                      createdAt: MoreThan(selfParticipant.lastReadAt),
                  },
              })
            : await this.messageRepo.count({
                  where: {
                      conversationId,
                  },
              });

        const otherDisplay =
            conversation.type === ConversationType.DIRECT
                ? otherParticipants[0]?.identity?.username || 'Unknown user'
                : conversation.title || 'Group conversation';

        return {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            displayName: otherDisplay,
            lastMessage: lastMessage
                ? {
                      id: lastMessage.id,
                      body: lastMessage.body,
                      createdAt: lastMessage.createdAt,
                      senderId: lastMessage.senderId,
                      senderUsername: lastMessage.sender?.username || null,
                  }
                : null,
            unreadCount: Math.max(0, unreadCount),
            participants: conversation.participants.map((participant) => ({
                id: participant.id,
                identityId: participant.identityId,
                username: participant.identity?.username || null,
                email: participant.identity?.email || null,
                joinedAt: participant.joinedAt,
                lastReadAt: participant.lastReadAt,
            })),
            updatedAt: conversation.updatedAt,
            createdAt: conversation.createdAt,
        };
    }

    async getConversationMessages(
        currentUserId: string,
        conversationId: string,
        limit = 50,
    ) {
        await this.assertParticipant(currentUserId, conversationId);

        const messages = await this.messageRepo.find({
            where: { conversationId },
            relations: ['sender'],
            order: { createdAt: 'ASC' },
            take: Math.min(Math.max(limit, 1), 100),
        });

        return messages.map((message) => ({
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderUsername: message.sender?.username || null,
            type: message.type,
            body: message.isDeleted ? '' : message.body,
            isDeleted: message.isDeleted,
            createdAt: message.createdAt,
            editedAt: message.editedAt,
            mine: message.senderId === currentUserId,
        }));
    }

    async sendMessage(
        currentUserId: string,
        conversationId: string,
        dto: SendMessageDto,
    ) {
        await this.assertParticipant(currentUserId, conversationId);

        const message = this.messageRepo.create({
            conversationId,
            senderId: currentUserId,
            type: (dto.type as MessageType) || MessageType.TEXT,
            body: dto.body.trim(),
        });

        const saved = await this.messageRepo.save(message);

        await this.conversationRepo.update(conversationId, {
            lastMessageText: saved.body,
            lastMessageAt: saved.createdAt,
        });

        return this.messageRepo.findOne({
            where: { id: saved.id },
            relations: ['sender'],
        });
    }

    async markConversationRead(currentUserId: string, conversationId: string) {
        const participant = await this.assertParticipant(currentUserId, conversationId);

        participant.lastReadAt = new Date();
        await this.participantRepo.save(participant);

        return {
            success: true,
            conversationId,
            lastReadAt: participant.lastReadAt,
        };
    }

    async archiveConversation(currentUserId: string, conversationId: string) {
        const participant = await this.assertParticipant(currentUserId, conversationId);

        participant.isArchived = true;
        await this.participantRepo.save(participant);

        return {
            success: true,
            conversationId,
            archived: true,
        };
    }

    private async assertParticipant(currentUserId: string, conversationId: string) {
        const participant = await this.participantRepo.findOne({
            where: {
                conversationId,
                identityId: currentUserId,
            },
        });

        if (!participant) {
            throw new ForbiddenException('You are not part of this conversation');
        }

        return participant;
    }
}