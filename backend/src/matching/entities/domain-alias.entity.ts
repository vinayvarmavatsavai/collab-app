import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Domain } from './domain.entity';

@Entity({ name: 'domain_aliases' })
@Index('idx_domain_aliases_normalized', ['normalizedAlias'])
export class DomainAlias {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'domain_id' })
    domainId: string;

    @ManyToOne(() => Domain, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'domain_id' })
    domain: Domain;

    @Column()
    alias: string;

    @Column({ name: 'normalized_alias', unique: true })
    normalizedAlias: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
