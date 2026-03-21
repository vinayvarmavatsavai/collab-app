import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('auth_sessions')
export class AuthSession {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column('uuid')
    identityId!: string;

    @Column({ type: 'varchar', length: 128 })
    refreshTokenHash!: string;

    @Column({ type: 'timestamptz' })
    expiresAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    revokedAt!: Date | null;

    @Column({ type: 'uuid', nullable: true })
    replacedBy!: string | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    ip!: string | null;

    @Column({ type: 'varchar', length: 256, nullable: true })
    userAgent!: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    lastUsedAt!: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
