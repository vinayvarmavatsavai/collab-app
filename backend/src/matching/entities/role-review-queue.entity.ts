import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum RoleReviewStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    IGNORED = 'ignored',
}

@Entity({ name: 'role_review_queue' })
@Index('idx_role_review_status', ['status'])
export class RoleReviewQueue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'raw_input' })
    rawInput: string;

    @Column({ name: 'normalized_input' })
    normalizedInput: string;

    @Column({ name: 'suggested_role_id' })
    suggestedRoleId: string;

    @Column('float', { name: 'fuzzy_similarity' })
    fuzzySimilarity: number;

    @Column({
        type: 'enum',
        enum: RoleReviewStatus,
        default: RoleReviewStatus.PENDING,
    })
    status: RoleReviewStatus;

    @Column({ name: 'created_by_user_id', nullable: true })
    createdByUserId: string;

    @Column({ name: 'reviewed_by_admin_id', nullable: true })
    reviewedByAdminId: string;

    @Column('text', { name: 'review_notes', nullable: true })
    reviewNotes: string;

    @Column({ name: 'reviewed_at', nullable: true })
    reviewedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
