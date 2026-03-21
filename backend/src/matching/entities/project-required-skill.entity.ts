import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { ProjectRequest } from './project-request.entity';
import { CanonicalSkill } from './canonical-skill.entity';

@Entity({ name: 'project_required_skills' })
@Unique(['projectId', 'canonicalSkillId'])
@Index('idx_project_required_skills_project', ['projectId'])
@Index('idx_project_required_skills_skill', ['canonicalSkillId'])
export class ProjectRequiredSkill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'project_id' })
    projectId: string;

    @ManyToOne(() => ProjectRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: ProjectRequest;

    @Column('uuid', { name: 'canonical_skill_id' })
    canonicalSkillId: string;

    @ManyToOne(() => CanonicalSkill, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'canonical_skill_id' })
    canonicalSkill: CanonicalSkill;

    @Column('int', { default: 5 })
    importance: number; // 1-5, how critical this skill is

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
