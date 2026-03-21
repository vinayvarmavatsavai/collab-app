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
import { ProfessionalRole } from './professional-role.entity';

@Entity({ name: 'user_roles' })
@Unique(['userProfileId', 'roleId'])
@Index('idx_user_roles_user', ['userProfileId'])
@Index('idx_user_roles_role', ['roleId'])
export class UserRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'user_profile_id' })
    userProfileId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_profile_id' })
    userProfile: UserProfile;

    @Column('uuid', { name: 'role_id' })
    roleId: string;

    @ManyToOne(() => ProfessionalRole, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: ProfessionalRole;

    @Column('decimal', { precision: 3, scale: 1, name: 'years_experience', nullable: true })
    yearsExperience: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
