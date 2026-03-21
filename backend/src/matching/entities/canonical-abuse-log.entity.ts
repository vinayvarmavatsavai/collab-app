import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'canonical_abuse_log' })
@Index('idx_abuse_log_user_id', ['userId'])
@Index('idx_abuse_log_created_at', ['createdAt'])
export class CanonicalAbuseLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ name: 'raw_input', type: 'text' })
    rawInput: string;

    @Column({ name: 'normalized_input', type: 'text' })
    normalizedInput: string;

    @Column({ name: 'reason_flagged', type: 'text' })
    reasonFlagged: string;

    @Column({ name: 'entity_type', type: 'varchar', length: 20, default: 'skill' })
    entityType: 'skill' | 'role' | 'domain';

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
