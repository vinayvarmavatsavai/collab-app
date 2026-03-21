import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm';
import { Post, PostVisibility } from '../entities/post.entity';
import { FriendshipsService } from '../../friendships/services/friendships.service';
import { UsersService } from '../../users/services/users/users.service';

export interface FeedCursor {
    created_at: string;
    id: string;
}

export interface FeedResponse {
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
}

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepo: Repository<Post>,
        private readonly friendshipsService: FriendshipsService,
        private readonly usersService: UsersService,
    ) { }

    async getPublicFeed(
        cursor?: string,
        limit = 20,
    ): Promise<FeedResponse> {
        // 1. Decode cursor
        const cursorData = cursor ? this.decodeCursor(cursor) : null;

        // 2. Base query (populate author)
        const qb = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.deletedAt IS NULL')
            .andWhere('post.visibility = :publicVisibility', {
                publicVisibility: PostVisibility.PUBLIC,
            })
            .andWhere('author.isPrivate = false');

        // 3. Cursor pagination
        if (cursorData) {
            qb.andWhere(
                `(post.createdAt < :cursorDate
        OR (post.createdAt = :cursorDate AND post.id < :cursorId))`,
                {
                    cursorDate: new Date(cursorData.created_at),
                    cursorId: cursorData.id,
                },
            );
        }

        // 4. Order + limit
        qb.orderBy('post.createdAt', 'DESC')
            .addOrderBy('post.id', 'DESC')
            .take(limit + 1);

        // 5. Execute
        const posts = await qb.getMany();

        // 6. Pagination result
        const hasMore = posts.length > limit;
        if (hasMore) posts.pop();

        const nextCursor =
            hasMore && posts.length > 0
                ? this.encodeCursor(posts[posts.length - 1])
                : null;

        return {
            posts,
            nextCursor,
            hasMore,
        };
    }

    /**
     * Get home feed (friends + public posts)
     * Fan-out on read strategy
     */
    async getHomeFeed(
        userId: string,
        cursor?: string,
        limit = 20,
    ): Promise<FeedResponse> {
        // 1. Fetch friend IDs
        const friendIds = await this.friendshipsService.getFriendIds(userId);

        // 2. Decode cursor
        const cursorData = cursor ? this.decodeCursor(cursor) : null;

        // 3. Base query (populate author)
        const qb = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.deletedAt IS NULL');

        // 4. Cursor pagination
        if (cursorData) {
            qb.andWhere(
                `(post.createdAt < :cursorDate
        OR (post.createdAt = :cursorDate AND post.id < :cursorId))`,
                {
                    cursorDate: new Date(cursorData.created_at),
                    cursorId: cursorData.id,
                },
            );
        }

        // 5. Visibility conditions (SAFE for 0 friends)
        const visibilityClauses: string[] = [];
        const params: any = {
            userId,
            publicVisibility: PostVisibility.PUBLIC,
        };

        // Own posts
        visibilityClauses.push(`post.authorId = :userId`);

        // Public accounts + public posts
        visibilityClauses.push(`
    author.isPrivate = false
    AND post.visibility = :publicVisibility
  `);

        // Friends' posts (ONLY if friends exist)
        if (friendIds.length > 0) {
            visibilityClauses.push(`
      post.authorId IN (:...friendIds)
      AND post.visibility IN (:...friendVisibilities)
    `);

            params.friendIds = friendIds;
            params.friendVisibilities = [
                PostVisibility.PUBLIC,
                PostVisibility.FRIENDS,
            ];
        }

        qb.andWhere(`(${visibilityClauses.join(' OR ')})`, params);

        // 6. Order + limit
        qb.orderBy('post.createdAt', 'DESC')
            .addOrderBy('post.id', 'DESC')
            .take(limit + 1);

        // 7. Execute
        const posts = await qb.getMany();

        // 8. Pagination
        const hasMore = posts.length > limit;
        if (hasMore) posts.pop();

        const nextCursor =
            hasMore && posts.length > 0
                ? this.encodeCursor(posts[posts.length - 1])
                : null;

        return {
            posts,
            nextCursor,
            hasMore,
        };
    }

    /**
     * Get user profile feed
     * Respects account privacy and post visibility
     */
    async getUserFeed(
        profileUserId: string,
        viewerId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<FeedResponse> {
        // Check if viewer can see this account
        const canViewAccount = await this.canViewAccount(viewerId, profileUserId);
        if (!canViewAccount) {
            return { posts: [], nextCursor: null, hasMore: false };
        }

        // Decode cursor
        const cursorData = cursor ? this.decodeCursor(cursor) : null;

        // Build query
        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.authorId = :profileUserId', { profileUserId })
            .andWhere('post.deletedAt IS NULL');

        // Apply cursor pagination
        if (cursorData) {
            queryBuilder.andWhere(
                '(post.createdAt < :cursorDate OR (post.createdAt = :cursorDate AND post.id < :cursorId))',
                {
                    cursorDate: new Date(cursorData.created_at),
                    cursorId: cursorData.id,
                },
            );
        }

        // Visibility filtering
        if (viewerId === profileUserId) {
            // Own profile - see all posts
            queryBuilder.andWhere('post.visibility IN (:...visibilities)', {
                visibilities: [
                    PostVisibility.PUBLIC,
                    PostVisibility.FRIENDS,
                    PostVisibility.PRIVATE,
                ],
            });
        } else {
            const areFriends = await this.friendshipsService.areFriends(
                viewerId,
                profileUserId,
            );

            if (areFriends) {
                // Friends can see public and friends-only posts
                queryBuilder.andWhere('post.visibility IN (:...visibilities)', {
                    visibilities: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
                });
            } else {
                // Non-friends can only see public posts
                queryBuilder.andWhere('post.visibility = :visibility', {
                    visibility: PostVisibility.PUBLIC,
                });
            }
        }

        // Order and limit
        queryBuilder
            .orderBy('post.createdAt', 'DESC')
            .addOrderBy('post.id', 'DESC')
            .take(limit + 1);

        const posts = await queryBuilder.getMany();

        const hasMore = posts.length > limit;
        if (hasMore) {
            posts.pop();
        }

        const nextCursor =
            hasMore && posts.length > 0
                ? this.encodeCursor(posts[posts.length - 1])
                : null;

        return { posts, nextCursor, hasMore };
    }

    /**
     * Get friends-only feed
     */
    async getFriendsFeed(
        userId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<FeedResponse> {
        const friendIds = await this.friendshipsService.getFriendIds(userId);

        if (friendIds.length === 0) {
            return { posts: [], nextCursor: null, hasMore: false };
        }

        const cursorData = cursor ? this.decodeCursor(cursor) : null;

        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.authorId IN (:...friendIds)', { friendIds })
            .andWhere('post.deletedAt IS NULL')
            .andWhere('post.visibility IN (:...visibilities)', {
                visibilities: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
            });

        if (cursorData) {
            queryBuilder.andWhere(
                '(post.createdAt < :cursorDate OR (post.createdAt = :cursorDate AND post.id < :cursorId))',
                {
                    cursorDate: new Date(cursorData.created_at),
                    cursorId: cursorData.id,
                },
            );
        }

        queryBuilder
            .orderBy('post.createdAt', 'DESC')
            .addOrderBy('post.id', 'DESC')
            .take(limit + 1);

        const posts = await queryBuilder.getMany();

        const hasMore = posts.length > limit;
        if (hasMore) {
            posts.pop();
        }

        const nextCursor =
            hasMore && posts.length > 0
                ? this.encodeCursor(posts[posts.length - 1])
                : null;

        return { posts, nextCursor, hasMore };
    }

    // ============================================
    // Visibility Logic (Centralized)
    // ============================================

    /**
     * Check if viewer can see an account (Step 1 of visibility)
     */
    private async canViewAccount(
        viewerId: string,
        accountId: string,
    ): Promise<boolean> {
        // Own account always visible
        if (viewerId === accountId) return true;

        // Check if account is private
        const isPrivate = await this.usersService.isAccountPrivate(accountId);
        if (!isPrivate) return true;

        // Private account - must be friends
        return await this.friendshipsService.areFriends(viewerId, accountId);
    }

    /**
     * Check if viewer can see a specific post (Step 2 of visibility)
     */
    private async canViewPost(viewerId: string, post: Post): Promise<boolean> {
        // Own posts always visible
        if (post.authorId === viewerId) return true;

        // Check account privacy first
        const canViewAccount = await this.canViewAccount(viewerId, post.authorId);
        if (!canViewAccount) return false;

        // Check post visibility
        if (post.visibility === PostVisibility.PUBLIC) return true;
        if (post.visibility === PostVisibility.PRIVATE) return false;

        // Friends-only posts
        return await this.friendshipsService.areFriends(viewerId, post.authorId);
    }

    // ============================================
    // Cursor Encoding/Decoding
    // ============================================

    private encodeCursor(post: Post): string {
        const cursor: FeedCursor = {
            created_at: post.createdAt.toISOString(),
            id: post.id,
        };
        return Buffer.from(JSON.stringify(cursor)).toString('base64');
    }

    private decodeCursor(cursor: string): FeedCursor {
        try {
            const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        } catch (error) {
            throw new Error('Invalid cursor format');
        }
    }
}
