import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './controllers/messages.controller';
import { MessagesService } from './services/messages.service';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { Identity } from 'src/auth/entities/identity.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Conversation,
            ConversationParticipant,
            Message,
            Identity,
        ]),
    ],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
})
export class MessagesModule {}