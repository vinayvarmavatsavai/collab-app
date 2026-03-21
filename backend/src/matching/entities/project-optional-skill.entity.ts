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

@Entity({ name: 'project_optional_skills' })
@Unique(['projectId', 'canonicalSkillId'])
@Index('idx_project_optional_skills_project', ['projectId'])
@Index('idx_project_optional_skills_skill', ['canonicalSkillId'])
export class ProjectOptionalSkill {
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

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
