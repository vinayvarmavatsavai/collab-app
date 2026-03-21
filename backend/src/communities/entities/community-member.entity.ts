
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
    Index,
} from 'typeorm';
import { Community } from './community.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';

export enum CommunityRole {
    MEMBER = 'member',
    ADMIN = 'admin',
    OWNER = 'owner',
}

@Entity('community_members')
@Unique(['communityId', 'userId'])
@Index(['userId'])
@Index(['communityId'])
export class CommunityMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'community_id' })
    communityId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => UserProfile)
    @JoinColumn({ name: 'user_id' })
    user: UserProfile;

    @ManyToOne(() => Community, (community) => community.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'community_id' })
    community: Community;

    @Column({
        type: 'enum',
        enum: CommunityRole,
        default: CommunityRole.MEMBER,
    })
    role: CommunityRole;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;

    @Column({ name: 'role_granted_at', type: 'timestamp', nullable: true })
    roleGrantedAt: Date;

    @Column({ name: 'role_granted_by', nullable: true })
    roleGrantedBy: string;
}
