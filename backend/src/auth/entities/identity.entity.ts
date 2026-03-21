import { Column, Entity, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum IdentityStatus {
    ACTIVE = 'active',
    DISABLED = 'disabled',
}

@Entity({ name: 'identities' })
export class Identity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column()
    email: string;

    @Index({ unique: true })
    @Column()
    username: string;

    @Column({ select: false })
    passwordHash: string;

    @Column({
        type: 'varchar',
        length: 32,
    })
    type: 'USER' | 'ADMIN';

    @Column({
        type: 'enum',
        enum: IdentityStatus,
        default: IdentityStatus.ACTIVE,
    })
    status: IdentityStatus;

    @Column({ name: 'is_private', type: 'boolean', default: false })
    isPrivate: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
