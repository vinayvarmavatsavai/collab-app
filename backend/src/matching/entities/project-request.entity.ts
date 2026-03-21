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
} from 'typeorm';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { ProfessionalRole } from './professional-role.entity';
import { Domain } from './domain.entity';

export enum ProjectStatus {
    OPEN = 'open',
    MATCHING = 'matching',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum ExperienceLevel {
    JUNIOR = 'junior',
    MID = 'mid',
    SENIOR = 'senior',
    ANY = 'any',
}

@Entity({ name: 'project_requests' })
@Index('idx_project_requests_creator', ['creatorId'])
@Index('idx_project_requests_status', ['status'])
@Index('idx_project_requests_created', ['createdAt'])
export class ProjectRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'creator_id' })
    creatorId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creator_id' })
    creator: UserProfile;

    @Column('varchar', { length: 255 })
    title: string;

    @Column('text')
    description: string;

    @Column('text', { array: true, name: 'required_skills', default: '{}' })
    requiredSkills: string[];

    @Column('text', { array: true, name: 'required_domains', default: '{}' })
    requiredDomains: string[];

    // New Canonical Relations
    @ManyToMany(() => ProfessionalRole)
    @JoinTable({
        name: 'project_required_roles',
        joinColumn: { name: 'project_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: ProfessionalRole[];

    @ManyToMany(() => Domain)
    @JoinTable({
        name: 'project_required_domains',
        joinColumn: { name: 'project_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'domain_id', referencedColumnName: 'id' },
    })
    domains: Domain[];

    @Column('text', { array: true, name: 'optional_skills', default: '{}' })
    optionalSkills: string[];

    @Column('varchar', {
        length: 50,
        name: 'preferred_experience_level',
        nullable: true,
    })
    preferredExperienceLevel: ExperienceLevel;

    @Column('int', { name: 'max_cohort_size', default: 5 })
    maxCohortSize: number;

    @Column({
        type: 'varchar',
        length: 50,
        default: ProjectStatus.OPEN,
    })
    status: ProjectStatus;

    @Column('varchar', {
        length: 20,
        name: 'visibility_mode',
        default: 'hybrid'
    })
    visibilityMode: 'matching-only' | 'open' | 'hybrid';

    @Column({
        type: 'enum',
        enum: ['GLOBAL', 'COMMUNITY', 'CLUB'],
        default: 'GLOBAL',
        name: 'matching_scope'
    })
    matchingScope: 'GLOBAL' | 'COMMUNITY' | 'CLUB';

    @Column('uuid', { array: true, nullable: true, name: 'community_ids' })
    communityIds: string[];

    @Column('uuid', { array: true, nullable: true, name: 'club_ids' })
    clubIds: string[];

    @Column('vector', { length: 768, nullable: true })
    embedding: number[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column('timestamp', { name: 'matching_completed_at', nullable: true })
    matchingCompletedAt: Date;

    @Column('timestamp', { name: 'cohort_formed_at', nullable: true })
    cohortFormedAt: Date;

    @Column('timestamp', { name: 'completed_at', nullable: true })
    completedAt: Date;
}
