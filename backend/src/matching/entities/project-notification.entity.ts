import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { ProjectRequest } from './project-request.entity';

export enum NotificationType {
    MATCH = 'match',
    SELECTED = 'selected',
    REJECTED = 'rejected',
}

@Entity({ name: 'project_notifications' })
@Index('idx_project_notifications_user_date', ['userId', 'notifiedAt'])
@Index('idx_project_notifications_project', ['projectId'])
export class ProjectNotification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'project_id' })
    projectId: string;

    @ManyToOne(() => ProjectRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: ProjectRequest;

    @Column('uuid', { name: 'user_id' })
    userId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserProfile;

    @Column({
        type: 'varchar',
        length: 50,
        name: 'notification_type',
        default: NotificationType.MATCH,
    })
    notificationType: NotificationType;

    @CreateDateColumn({ name: 'notified_at' })
    notifiedAt: Date;

    @Column('timestamp', { name: 'viewed_at', nullable: true })
    viewedAt: Date;
}
