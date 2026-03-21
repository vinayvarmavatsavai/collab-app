import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { UserProfile } from '../../users/entities/user-profile.entity';

@Entity({ name: 'user_profile_vectors' })
@Unique(['userProfileId'])
@Index('idx_user_profile_vectors_user', ['userProfileId'])
export class UserProfileVector {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid', { name: 'user_profile_id' })
    userProfileId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_profile_id' })
    userProfile: UserProfile;

    @Column('vector', { length: 768, nullable: true })
    embedding: number[];

    @Column('text', { name: 'summary_text' })
    summaryText: string;

    @Column('jsonb', { default: {} })
    metadata: {
        skills: string[];
        domains: string[];
    };

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
