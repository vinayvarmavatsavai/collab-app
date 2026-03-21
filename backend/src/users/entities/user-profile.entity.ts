import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    ManyToMany,
    JoinColumn,
    JoinTable,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { Identity } from '../../auth/entities/identity.entity';
import { ProfessionalRole } from '../../matching/entities/professional-role.entity';
import { UserSkill } from '../../matching/entities/user-skill.entity';
import { UserRole } from '../../matching/entities/user-role.entity';
import { UserDomain } from '../../matching/entities/user-domain.entity';
import { UserIntent } from '../enums/user-intent.enum';

@Entity({ name: 'user_profiles' })
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid')
    identityId: string;

    @OneToOne(() => Identity)
    @JoinColumn({ name: 'identityId' })
    identity: Identity;

    @Column()
    firstname: string;

    @Column()
    lastname: string;

    @Column()
    phone: string;

    @Column({
        type: 'enum',
        enum: UserIntent,
    })
    intent: UserIntent;

    @Column({ nullable: true })
    headline: string;

    @Column('text', { nullable: true })
    bio: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    coverPhoto: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    currentCompany: string;

    @Column({ nullable: true })
    currentPosition: string;

    @Column('jsonb', { nullable: true, default: [] })
    experience: Array<{
        id: string;
        company: string;
        position: string;
        startDate: string;
        endDate?: string;
        current: boolean;
        description?: string;
        location?: string;
    }>;

    @Column('jsonb', { nullable: true, default: [] })
    education: Array<{
        id: string;
        school: string;
        degree: string;
        field: string;
        startYear: string;
        endYear?: string;
        description?: string;
    }>;

    @Column('jsonb', { nullable: true, default: [] })
    certifications: Array<{
        id: string;
        name: string;
        issuer: string;
        issueDate: string;
        expiryDate?: string;
        credentialId?: string;
        credentialUrl?: string;
    }>;

    @Column('text', { array: true, nullable: true, default: [] })
    languages: string[];

    @Column('int', { default: 20 })
    profileCompleteness: number;

    @Column({ default: true })
    isProfilePublic: boolean;

    @Column({ default: false })
    onboardingCompleted: boolean;

    @Column('jsonb', { nullable: true, default: [] })
    projects: Array<{
        title: string;
        description: string;
        role: string;
        technologies: string[];
        duration?: string;
    }>;

    // New Canonical Relations
    @Column({ nullable: true })
    primaryRoleId: string;

    @ManyToOne(() => ProfessionalRole, { nullable: true })
    @JoinColumn({ name: 'primaryRoleId' })
    primaryRole: ProfessionalRole;

    @OneToMany(() => UserRole, userRole => userRole.userProfile, { cascade: true })
    userRoles: UserRole[];

    @OneToMany(() => UserDomain, userDomain => userDomain.userProfile, { cascade: true })
    userDomains: UserDomain[];

    @OneToMany(() => UserSkill, userSkill => userSkill.userProfile, { cascade: true })
    userSkills: UserSkill[];


    @Column('int', { nullable: true })
    availabilityHours: number;

    @Column('text', { nullable: true })
    collaborationGoals: string;

    @Column('text', { nullable: true })
    profileSummaryText: string;

    // Admin Claim & Risk Tracking
    @Column('int', { name: 'risk_level', default: 0 })
    riskLevel: number;

    @Column('int', { name: 'moderation_flag_count', default: 0 })
    moderationFlagCount: number;

    @Column('int', { name: 'rejected_canonical_count', default: 0 })
    rejectedCanonicalCount: number;

    @Column('int', { name: 'canonical_creation_count_24h', default: 0 })
    canonicalCreationCount24h: number;

    @Column('int', { name: 'failed_admin_claims', default: 0 })
    failedAdminClaims: number;

    @Column('timestamp', { nullable: true })
    lastAdminClaimAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
