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

@Entity({ name: 'domains' })
@Index('idx_domains_normalized', ['normalizedName'])
export class Domain {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 100 })
    name: string;

    @Column({ name: 'normalized_name', unique: true, length: 100 })
    normalizedName: string;

    @Column({ name: 'parent_domain_id', nullable: true })
    parentDomainId: string;

    @ManyToOne(() => Domain)
    @JoinColumn({ name: 'parent_domain_id' })
    parentDomain: Domain;

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
