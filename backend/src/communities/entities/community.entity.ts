
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { CommunityType } from '../enums/community-type.enum';
import { GovernanceMode } from '../enums/governance-mode.enum';
import { CommunityMember } from './community-member.entity';
import { Club } from './club.entity';

@Entity('communities')
@Index(['type'])
@Index(['institutionDomain'])
export class Community {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    @Index()
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: CommunityType,
        default: CommunityType.PUBLIC,
    })
    type: CommunityType;

    @Column({
        type: 'enum',
        enum: GovernanceMode,
        default: GovernanceMode.SYSTEM_MANAGED,
    })
    governanceMode: GovernanceMode;

    @Column({ name: 'institution_domain', nullable: true })
    institutionDomain: string;

    @Column({ name: 'owner_id', type: 'uuid', nullable: true })
    ownerId: string;

    @Column({ name: 'is_institution_verified', default: false })
    isInstitutionVerified: boolean;

    @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @OneToMany(() => CommunityMember, (member) => member.community)
    members: CommunityMember[];

    @OneToMany(() => Club, (club) => club.community)
    clubs: Club[];

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    cover: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
