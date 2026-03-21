import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum SkillReviewStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    AUTO_MERGED = 'auto_merged',
}

@Entity({ name: 'skill_review_queue' })
@Index('idx_skill_review_status', ['status'])
@Index('idx_skill_review_created', ['createdAt'])
export class SkillReviewQueue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'raw_input', length: 100 })
    rawInput: string;

    @Column({ name: 'normalized_input', length: 100 })
    normalizedInput: string;

    @Column('uuid', { name: 'suggested_skill_id', nullable: true })
    suggestedSkillId: string;

    @Column({ name: 'fuzzy_similarity', type: 'float', nullable: true })
    fuzzySimilarity: number;

    @Column({
        type: 'enum',
        enum: SkillReviewStatus,
        default: SkillReviewStatus.PENDING,
    })
    status: SkillReviewStatus;

    @Column('uuid', { name: 'created_by_user_id', nullable: true })
    createdByUserId: string;

    @Column('uuid', { name: 'reviewed_by_admin_id', nullable: true })
    reviewedByAdminId: string;

    @Column({ name: 'review_notes', type: 'text', nullable: true })
    reviewNotes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
    reviewedAt: Date;
}
