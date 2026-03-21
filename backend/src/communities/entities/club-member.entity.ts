
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
} from 'typeorm';
import { Club } from './club.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';

export enum ClubRole {
    MEMBER = 'member',
    ADMIN = 'admin',
}

export enum ClubMemberStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    REJECTED = 'rejected',
}

@Entity('club_members')
@Unique(['clubId', 'userId'])
export class ClubMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'club_id' })
    clubId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => Club, (club) => club.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'club_id' })
    club: Club;

    @ManyToOne(() => UserProfile)
    @JoinColumn({ name: 'user_id' })
    user: UserProfile;

    @Column({
        type: 'enum',
        enum: ClubRole,
        default: ClubRole.MEMBER,
    })
    role: ClubRole;

    @Column({
        type: 'enum',
        enum: ClubMemberStatus,
        default: ClubMemberStatus.PENDING,
    })
    status: ClubMemberStatus;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;
}
