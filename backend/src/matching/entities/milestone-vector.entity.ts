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
import { Post } from '../../posts/entities/post.entity';

@Entity({ name: 'milestone_vectors' })
@Index('idx_milestone_vectors_user_date', ['userProfileId', 'createdAt'])
export class MilestoneVector {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'user_profile_id' })
    userProfileId: string;

    @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_profile_id' })
    userProfile: UserProfile;

    @Column('uuid', { name: 'post_id' })
    postId: string;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column('vector', { length: 768, nullable: true })
    embedding: number[];

    @Column('text', { name: 'content_text' })
    contentText: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
