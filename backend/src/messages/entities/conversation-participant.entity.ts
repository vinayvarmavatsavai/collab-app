import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Identity } from 'src/auth/entities/identity.entity';

@Entity({ name: 'conversation_participants' })
@Unique('uq_conversation_identity', ['conversationId', 'identityId'])
@Index('idx_conversation_participants_conversation', ['conversationId'])
@Index('idx_conversation_participants_identity', ['identityId'])
export class ConversationParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'conversation_id' })
    conversationId: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @Column('uuid', { name: 'identity_id' })
    identityId: string;

    @ManyToOne(() => Identity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'identity_id' })
    identity: Identity;

    @Column('timestamp', { name: 'last_read_at', nullable: true })
    lastReadAt: Date;

    @Column('boolean', { name: 'is_muted', default: false })
    isMuted: boolean;

    @Column('boolean', { name: 'is_archived', default: false })
    isArchived: boolean;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;
}