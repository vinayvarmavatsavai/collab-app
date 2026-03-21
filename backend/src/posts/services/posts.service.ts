import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post, PostVisibility } from '../entities/post.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { BackgroundJobsService } from '../../matching/services/background-jobs.service';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepo: Repository<Post>,
        @Inject(forwardRef(() => BackgroundJobsService))
        private readonly backgroundJobs?: BackgroundJobsService, // Optional to maintain backward compatibility
    ) { }

    async createPost(userId: string, dto: CreatePostDto): Promise<Post> {

        const post = this.postRepo.create({
            authorId: userId,
            content: dto.content,
            mediaUrls: dto.mediaUrls || [],
            visibility: dto.visibility || PostVisibility.PUBLIC,
        });

        const savedPost = await this.postRepo.save(post);

        // NON-BLOCKING: Queue milestone vector generation for meaningful posts (additive, backward-compatible)
        if (this.backgroundJobs && typeof this.backgroundJobs.queueMilestoneVectorGeneration === 'function') {
            if (savedPost.content.length >= 100) { // Only embed meaningful posts
                try {
                    await this.backgroundJobs.queueMilestoneVectorGeneration(savedPost.id);
                } catch (error) {
                    console.error('Failed to queue milestone vector generation:', error);
                }
            }
        }

        return savedPost;
    }

    async updatePost(postId: string, userId: string, dto: UpdatePostDto): Promise<Post> {
        const post = await this.postRepo.findOne({
            where: { id: postId, deletedAt: IsNull() },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== userId) {
            throw new ForbiddenException('You can only edit your own posts');
        }

        Object.assign(post, dto);
        return this.postRepo.save(post);
    }

    async deletePost(postId: string, userId: string): Promise<void> {
        const post = await this.postRepo.findOne({
            where: { id: postId, deletedAt: IsNull() },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        // Soft delete
        post.deletedAt = new Date();
        await this.postRepo.save(post);
    }

    async getPostById(postId: string): Promise<Post> {
        const post = await this.postRepo.findOne({
            where: { id: postId, deletedAt: IsNull() },
            relations: ['author'],
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return post;
    }

    async getPostsByAuthor(authorId: string, limit: number = 20): Promise<Post[]> {
        return this.postRepo.find({
            where: { authorId, deletedAt: IsNull() },
            order: { createdAt: 'DESC', id: 'DESC' },
            take: limit,
            relations: ['author'],
        });
    }
}
