import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { Identity } from 'src/auth/entities/identity.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';

@Injectable()
export class FriendshipsService {
    constructor(
        @InjectRepository(Friendship)
        private readonly friendshipRepo: Repository<Friendship>,
        @InjectRepository(Identity)
        private readonly identityRepo: Repository<Identity>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: Repository<UserProfile>,
    ) { }

    async sendFriendRequest(userId: string, friendId: string) {
        // Validate not sending to self
        if (userId === friendId) {
            throw new BadRequestException('Cannot send friend request to yourself');
        }

        // Check if friend exists
        const friend = await this.identityRepo.findOne({ where: { id: friendId } });
        if (!friend) {
            throw new NotFoundException('User not found');
        }

        // Check if friendship already exists
        const existing = await this.friendshipRepo.findOne({
            where: [
                { userId, friendId },
                { userId: friendId, friendId: userId },
            ],
        });

        if (existing) {
            if (existing.status === FriendshipStatus.PENDING) {
                throw new ConflictException('Friend request already sent');
            }
            if (existing.status === FriendshipStatus.ACCEPTED) {
                throw new ConflictException('Already friends');
            }
        }

        // Create friend request
        const friendship = this.friendshipRepo.create({
            userId,
            friendId,
            status: FriendshipStatus.PENDING,
        });

        return this.friendshipRepo.save(friendship);
    }

    async respondToFriendRequest(
        requestId: string,
        userId: string,
        status: FriendshipStatus.ACCEPTED | FriendshipStatus.REJECTED,
    ) {
        const friendship = await this.friendshipRepo.findOne({
            where: { id: requestId, friendId: userId, status: FriendshipStatus.PENDING },
        });

        if (!friendship) {
            throw new NotFoundException('Friend request not found');
        }

        friendship.status = status;
        await this.friendshipRepo.save(friendship);

        // If accepted, create reverse friendship for bidirectional relationship
        if (status === FriendshipStatus.ACCEPTED) {
            const reverseFriendship = this.friendshipRepo.create({
                userId: friendship.friendId,
                friendId: friendship.userId,
                status: FriendshipStatus.ACCEPTED,
            });
            await this.friendshipRepo.save(reverseFriendship);
        }

        return friendship;
    }

    async getMyFriends(userId: string, limit = 50, offset = 0) {
        const friendships = await this.friendshipRepo.find({
            where: { userId, status: FriendshipStatus.ACCEPTED },
            take: limit,
            skip: offset,
            order: { createdAt: 'DESC' },
        });

        const friendIds = friendships.map(f => f.friendId);
        if (friendIds.length === 0) {
            return { friends: [], total: 0 };
        }

        const friends = await this.identityRepo.find({
            where: { id: In(friendIds) },
            select: ['id', 'username', 'email'],
        });

        const profiles = await this.profileRepo.find({
            where: { identityId: In(friendIds) },
        });

        const total = await this.friendshipRepo.count({
            where: { userId, status: FriendshipStatus.ACCEPTED },
        });

        const friendsWithProfiles = friends.map(friend => {
            const profile = profiles.find(p => p.identityId === friend.id);
            return {
                ...friend,
                profile,
            };
        });

        return { friends: friendsWithProfiles, total };
    }

    async getPendingRequests(userId: string) {
        const friendships = await this.friendshipRepo.find({
            where: { friendId: userId, status: FriendshipStatus.PENDING },
            order: { createdAt: 'DESC' },
        });

        const senderIds = friendships.map(f => f.userId);
        if (senderIds.length === 0) {
            return [];
        }

        const senders = await this.identityRepo.find({
            where: { id: In(senderIds) },
            select: ['id', 'username', 'email'],
        });

        const profiles = await this.profileRepo.find({
            where: { identityId: In(senderIds) },
        });

        return friendships.map(friendship => {
            const sender = senders.find(s => s.id === friendship.userId);
            const profile = profiles.find(p => p.identityId === friendship.userId);
            return {
                ...friendship,
                sender: {
                    ...sender,
                    profile,
                },
            };
        });
    }

    async getSentRequests(userId: string) {
        const friendships = await this.friendshipRepo.find({
            where: { userId, status: FriendshipStatus.PENDING },
            order: { createdAt: 'DESC' },
        });

        const recipientIds = friendships.map(f => f.friendId);
        if (recipientIds.length === 0) {
            return [];
        }

        const recipients = await this.identityRepo.find({
            where: { id: In(recipientIds) },
            select: ['id', 'username', 'email'],
        });

        const profiles = await this.profileRepo.find({
            where: { identityId: In(recipientIds) },
        });

        return friendships.map(friendship => {
            const recipient = recipients.find(r => r.id === friendship.friendId);
            const profile = profiles.find(p => p.identityId === friendship.friendId);
            return {
                ...friendship,
                recipient: {
                    ...recipient,
                    profile,
                },
            };
        });
    }

    async removeFriend(friendshipId: string, userId: string) {
        const friendship = await this.friendshipRepo.findOne({
            where: { id: friendshipId, userId },
        });

        if (!friendship) {
            throw new NotFoundException('Friendship not found');
        }

        // Remove both directions
        await this.friendshipRepo.delete({ id: friendshipId });
        await this.friendshipRepo.delete({
            userId: friendship.friendId,
            friendId: friendship.userId,
        });

        return { message: 'Friend removed successfully' };
    }

    async getFriendshipStatus(userId: string, targetUserId: string) {
        if (userId === targetUserId) {
            return { status: 'self' };
        }

        const friendship = await this.friendshipRepo.findOne({
            where: [
                { userId, friendId: targetUserId },
                { userId: targetUserId, friendId: userId },
            ],
        });

        if (!friendship) {
            return { status: 'none' };
        }

        if (friendship.status === FriendshipStatus.ACCEPTED) {
            return { status: 'friends', friendshipId: friendship.id };
        }

        if (friendship.userId === userId) {
            return { status: 'pending_sent', friendshipId: friendship.id };
        } else {
            return { status: 'pending_received', friendshipId: friendship.id };
        }
    }

    async getMutualFriends(userId: string, targetUserId: string) {
        // Get user's friends
        const userFriendships = await this.friendshipRepo.find({
            where: { userId, status: FriendshipStatus.ACCEPTED },
        });
        const userFriendIds = userFriendships.map(f => f.friendId);

        // Get target's friends
        const targetFriendships = await this.friendshipRepo.find({
            where: { userId: targetUserId, status: FriendshipStatus.ACCEPTED },
        });
        const targetFriendIds = targetFriendships.map(f => f.friendId);

        // Find mutual friends
        const mutualIds = userFriendIds.filter(id => targetFriendIds.includes(id));

        if (mutualIds.length === 0) {
            return { mutualFriends: [], count: 0 };
        }

        const mutualFriends = await this.identityRepo.find({
            where: { id: In(mutualIds) },
            select: ['id', 'username', 'email'],
        });

        const profiles = await this.profileRepo.find({
            where: { identityId: In(mutualIds) },
        });

        const mutualWithProfiles = mutualFriends.map(friend => {
            const profile = profiles.find(p => p.identityId === friend.id);
            return {
                ...friend,
                profile,
            };
        });

        return { mutualFriends: mutualWithProfiles, count: mutualIds.length };
    }

    // ============================================
    // Service Functions for Cross-Module Access
    // (Microservice-Ready Architecture)
    // ============================================

    /**
     * Get list of friend IDs for a user (accepted friendships only)
     * Used by: PostsModule (FeedService)
     */
    async getFriendIds(userId: string): Promise<string[]> {
        const friendships = await this.friendshipRepo.find({
            where: { userId, status: FriendshipStatus.ACCEPTED },
            select: ['friendId'],
        });

        return friendships.map(f => f.friendId);
    }

    /**
     * Check if two users are friends
     * Used by: PostsModule (FeedService)
     */
    async areFriends(userId: string, targetUserId: string): Promise<boolean> {
        if (userId === targetUserId) return false;

        const friendship = await this.friendshipRepo.findOne({
            where: {
                userId,
                friendId: targetUserId,
                status: FriendshipStatus.ACCEPTED,
            },
        });

        return !!friendship;
    }
}
