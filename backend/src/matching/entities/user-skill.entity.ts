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
import { CanonicalSkill } from './canonical-skill.entity';

@Entity({ name: 'user_skills' })
@Unique(['userProfileId', 'canonicalSkillId'])
@Index('idx_user_skills_user', ['userProfileId'])
@Index('idx_user_skills_skill', ['canonicalSkillId'])
export class UserSkill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'user_profile_id' })
    userProfileId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_profile_id' })
    userProfile: UserProfile;

    @Column('uuid', { name: 'canonical_skill_id' })
    canonicalSkillId: string;

    @ManyToOne(() => CanonicalSkill, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'canonical_skill_id' })
    canonicalSkill: CanonicalSkill;

    @Column('int', { nullable: true })
    proficiency: number; // 1-5

    @Column('decimal', { precision: 3, scale: 1, name: 'years_experience', nullable: true })
    yearsExperience: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
