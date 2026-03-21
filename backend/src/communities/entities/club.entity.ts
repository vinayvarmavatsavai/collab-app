
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
    Unique,
    OneToMany,
} from 'typeorm';
import { Community } from './community.entity';
import { ClubMember } from './club-member.entity';

@Entity('clubs')
@Index(['communityId'])
@Unique(['communityId', 'slug'])
export class Club {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'community_id' })
    communityId: string;

    @ManyToOne(() => Community, (community) => community.clubs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'community_id' })
    community: Community;

    @Column()
    name: string;

    @Column()
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'created_by' })
    createdBy: string;

    @OneToMany(() => ClubMember, (member) => member.club)
    members: ClubMember[];

    @Column({ nullable: true })
    avatar: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
