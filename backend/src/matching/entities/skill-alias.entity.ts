import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { CanonicalSkill } from './canonical-skill.entity';

@Entity({ name: 'skill_aliases' })
@Index('idx_skill_aliases_normalized', ['normalizedAlias'])
@Index('idx_skill_aliases_canonical', ['canonicalSkillId'])
export class SkillAlias {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'canonical_skill_id' })
    canonicalSkillId: string;

    @ManyToOne(() => CanonicalSkill, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'canonical_skill_id' })
    canonicalSkill: CanonicalSkill;

    @Column({ length: 100 })
    alias: string;

    @Column({ name: 'normalized_alias', length: 100 })
    normalizedAlias: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
