import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Identity } from 'src/auth/entities/identity.entity';

export enum FriendshipStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Entity({ name: 'friendships' })
@Index(['userId', 'friendId'], { unique: true })
export class Friendship {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid')
    userId: string;

    @Index()
    @Column('uuid')
    friendId: string;

    @Column({
        type: 'enum',
        enum: FriendshipStatus,
        default: FriendshipStatus.PENDING,
    })
    @Index()
    status: FriendshipStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Identity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: Identity;

    @ManyToOne(() => Identity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'friendId' })
    friend: Identity;
}
