import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ProfessionalRole } from './professional-role.entity';

@Entity({ name: 'role_aliases' })
@Index('idx_role_aliases_normalized', ['normalizedAlias'])
export class RoleAlias {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'professional_role_id' })
    professionalRoleId: string;

    @ManyToOne(() => ProfessionalRole, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'professional_role_id' })
    professionalRole: ProfessionalRole;

    @Column()
    alias: string;

    @Column({ name: 'normalized_alias', unique: true })
    normalizedAlias: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
