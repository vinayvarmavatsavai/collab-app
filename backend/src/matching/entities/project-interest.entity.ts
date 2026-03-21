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

@Entity({ name: 'project_interests' })
@Index('idx_project_interests_project_score', ['projectId', 'relevanceScore'])
@Index('idx_project_interests_user', ['userId', 'createdAt'])
export class ProjectInterest {
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

    @Column('text', { name: 'interest_text' })
    interestText: string;

    @Column('text', { array: true, name: 'attachment_urls', default: '{}' })
    attachmentUrls: string[];

    @Column('float', { name: 'relevance_score', nullable: true })
    relevanceScore: number;

    @Column('float', { name: 'profile_similarity', nullable: true })
    profileSimilarity: number;

    @Column('float', { name: 'milestone_similarity', nullable: true })
    milestoneSimilarity: number;

    @Column('float', { name: 'skill_overlap', nullable: true })
    skillOverlap: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
