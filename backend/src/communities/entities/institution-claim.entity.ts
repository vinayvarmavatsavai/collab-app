
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ClaimStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('institution_claims')
export class InstitutionClaim {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'community_id' })
    communityId: string;

    @Column({ name: 'requested_by' })
    requestedBy: string;

    @Column({
        type: 'enum',
        enum: ClaimStatus,
        default: ClaimStatus.PENDING,
    })
    status: ClaimStatus;

    @Column('text')
    reason: string;

    @Column('text')
    officialProfileUrl: string;

    @Column({ type: 'text', nullable: true })
    contactEmail: string | null;

    @Column({ type: 'text', nullable: true })
    contactPhone: string | null;

    @Column({ type: 'text', nullable: true })
    proofDocumentUrl: string | null;

    @Column('int', { default: 0 })
    trustScore: number;

    @Column('text', { nullable: true })
    rejectionReason: string | null;

    @Column('jsonb', { nullable: true })
    evidence: any;

    @Column({ name: 'reviewed_by', type: 'text', nullable: true })
    reviewedBy: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
    reviewedAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
