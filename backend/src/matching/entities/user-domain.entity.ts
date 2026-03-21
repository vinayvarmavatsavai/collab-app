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
import { UserProfile } from '../../users/entities/user-profile.entity';
import { Domain } from './domain.entity';

@Entity({ name: 'user_domains' })
@Unique(['userProfileId', 'domainId'])
@Index('idx_user_domains_user', ['userProfileId'])
@Index('idx_user_domains_domain', ['domainId'])
export class UserDomain {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'user_profile_id' })
    userProfileId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_profile_id' })
    userProfile: UserProfile;

    @Column('uuid', { name: 'domain_id' })
    domainId: string;

    @ManyToOne(() => Domain, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'domain_id' })
    domain: Domain;

    @Column('decimal', { precision: 3, scale: 1, name: 'years_experience', nullable: true })
    yearsExperience: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
