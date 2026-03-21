import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ProjectRequest } from './project-request.entity';

export enum CohortStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    DISBANDED = 'disbanded',
}

@Entity({ name: 'cohorts' })
@Index('idx_cohorts_project', ['projectId'])
@Index('idx_cohorts_status', ['status'])
export class Cohort {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'project_id' })
    projectId: string;

    @ManyToOne(() => ProjectRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: ProjectRequest;

    @Column('uuid', { array: true, name: 'member_ids' })
    memberIds: string[];

    @Column({
        type: 'varchar',
        length: 50,
        default: CohortStatus.ACTIVE,
    })
    status: CohortStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column('timestamp', { name: 'completed_at', nullable: true })
    completedAt: Date;

    @Column('timestamp', { name: 'disbanded_at', nullable: true })
    disbandedAt: Date;
}
