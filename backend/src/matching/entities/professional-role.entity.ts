import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Domain } from './domain.entity';

@Entity({ name: 'professional_roles' })
@Index('idx_roles_normalized', ['normalizedName'])
@Index('idx_roles_primary_domain', ['primaryDomainId'])
export class ProfessionalRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 100 })
    name: string;

    @Column({ name: 'normalized_name', unique: true, length: 100 })
    normalizedName: string;

    @Column({ name: 'primary_domain_id' })
    primaryDomainId: string;

    @ManyToOne(() => Domain)
    @JoinColumn({ name: 'primary_domain_id' })
    primaryDomain: Domain;

    @Column('text', { nullable: true })
    description: string;

    @Column('vector', { length: 768, nullable: true })
    embedding: number[];

    @Column({ name: 'usage_count', default: 0 })
    usageCount: number;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @Column({ name: 'created_by_user_id', nullable: true })
    createdByUserId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
