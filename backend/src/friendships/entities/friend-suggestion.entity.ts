import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Identity } from 'src/auth/entities/identity.entity';

@Entity({ name: 'friend_suggestions' })
@Index(['userId', 'suggestedUserId'], { unique: true })
export class FriendSuggestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid')
    userId: string;

    @Column('uuid')
    suggestedUserId: string;

    @Column('decimal', { precision: 10, scale: 2 })
    @Index()
    score: number;

    @Column('int', { default: 0 })
    mutualCount: number;

    @Column('varchar', { length: 50, default: 'random' })
    reason: 'friends_of_friends' | 'same_organization' | 'random';

    @CreateDateColumn()
    generatedAt: Date;

    @ManyToOne(() => Identity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: Identity;

    @ManyToOne(() => Identity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'suggestedUserId' })
    suggestedUser: Identity;
}
