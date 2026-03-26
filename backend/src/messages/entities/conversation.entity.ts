import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

export enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group',
}

@Entity({ name: 'conversations' })
@Index('idx_conversations_type', ['type'])
@Index('idx_conversations_last_message_at', ['lastMessageAt'])
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: ConversationType.DIRECT,
    })
    type: ConversationType;

    @Column({ nullable: true })
    title: string;

    @Column('uuid', { name: 'created_by_id', nullable: true })
    createdById: string;

    @Column('uuid', { name: 'cohort_id', nullable: true })
    cohortId: string;

    @Column('text', { name: 'last_message_text', nullable: true })
    lastMessageText: string;

    @Column('timestamp', { name: 'last_message_at', nullable: true })
    lastMessageAt: Date;

    @OneToMany(() => ConversationParticipant, (participant) => participant.conversation, {
        cascade: true,
    })
    participants: ConversationParticipant[];

    @OneToMany(() => Message, (message) => message.conversation, {
        cascade: true,
    })
    messages: Message[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}