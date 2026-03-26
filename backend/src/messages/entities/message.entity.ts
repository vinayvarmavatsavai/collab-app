import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Identity } from 'src/auth/entities/identity.entity';

export enum MessageType {
    TEXT = 'text',
}

@Entity({ name: 'messages' })
@Index('idx_messages_conversation_created_at', ['conversationId', 'createdAt'])
@Index('idx_messages_sender', ['senderId'])
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'conversation_id' })
    conversationId: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @Column('uuid', { name: 'sender_id' })
    senderId: string;

    @ManyToOne(() => Identity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sender_id' })
    sender: Identity;

    @Column({
        type: 'varchar',
        length: 20,
        default: MessageType.TEXT,
    })
    type: MessageType;

    @Column('text')
    body: string;

    @Column('timestamp', { name: 'edited_at', nullable: true })
    editedAt: Date;

    @Column('boolean', { name: 'is_deleted', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}