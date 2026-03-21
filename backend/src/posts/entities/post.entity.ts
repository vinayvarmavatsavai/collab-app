import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Identity } from '../../auth/entities/identity.entity';

export enum PostVisibility {
    PUBLIC = 'public',
    FRIENDS = 'friends',
    PRIVATE = 'private',
}

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'author_id', type: 'uuid' })
    authorId: string;

    @ManyToOne(() => Identity)
    @JoinColumn({ name: 'author_id' })
    author: Identity;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'media_urls', type: 'jsonb', default: '[]' })
    mediaUrls: string[];

    @Column({
        type: 'enum',
        enum: PostVisibility,
        default: PostVisibility.PUBLIC,
    })
    visibility: PostVisibility;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;
}
