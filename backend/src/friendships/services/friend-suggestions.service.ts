import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { FriendSuggestion } from '../entities/friend-suggestion.entity';
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { Identity } from 'src/auth/entities/identity.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';

@Injectable()
export class FriendSuggestionsService {
    constructor(
        @InjectRepository(FriendSuggestion)
        private readonly suggestionRepo: Repository<FriendSuggestion>,
        @InjectRepository(Friendship)
        private readonly friendshipRepo: Repository<Friendship>,
        @InjectRepository(Identity)
        private readonly identityRepo: Repository<Identity>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: Repository<UserProfile>,
    ) { }

    async generateSuggestions(userId: string) {
        // Get user's current friends and pending requests
        const userFriendships = await this.friendshipRepo.find({
            where: [
                { userId, status: FriendshipStatus.ACCEPTED },
                { friendId: userId, status: FriendshipStatus.ACCEPTED },
            ],
        });
        const friendIds = [
            ...userFriendships.filter(f => f.userId === userId).map(f => f.friendId),
            ...userFriendships.filter(f => f.friendId === userId).map(f => f.userId),
        ];

        // Get user's profile for organization matching
        const userProfile = await this.profileRepo.findOne({
            where: { identityId: userId },
            relations: ['userSkills', 'userSkills.canonicalSkill']
        });

        const suggestions: Array<{
            userId: string;
            suggestedUserId: string;
            score: number;
            mutualCount: number;
            reason: 'friends_of_friends' | 'same_organization' | 'random';
        }> = [];

        // 1. PRIORITY 1: Friends of friends (2nd degree connections)
        if (friendIds.length > 0) {
            const friendsOfFriends = await this.friendshipRepo
                .createQueryBuilder('f1')
                .select('f1.friendId', 'suggestedUserId')
                .addSelect('COUNT(*)', 'mutualCount')
                .where('f1.userId IN (:...friendIds)', { friendIds })
                .andWhere('f1.friendId != :userId', { userId })
                .andWhere('f1.status = :status', { status: FriendshipStatus.ACCEPTED })
                .andWhere('f1.friendId NOT IN (:...friendIds)', { friendIds })
                .groupBy('f1.friendId')
                .limit(30)
                .getRawMany();

            friendsOfFriends.forEach(fof => {
                const mutualCount = parseInt(fof.mutualCount);
                suggestions.push({
                    userId,
                    suggestedUserId: fof.suggestedUserId,
                    score: mutualCount * 20 + 100, // High priority
                    mutualCount,
                    reason: 'friends_of_friends',
                });
            });
        }

        // 2. PRIORITY 2: Same organization
        if (userProfile?.currentCompany) {
            const sameOrgQuery = this.profileRepo
                .createQueryBuilder('profile')
                .select('profile.identityId')
                .where('profile.currentCompany = :company', { company: userProfile.currentCompany })
                .andWhere('profile.identityId != :userId', { userId });

            if (friendIds.length > 0) {
                sameOrgQuery.andWhere('profile.identityId NOT IN (:...friendIds)', { friendIds });
            }

            const sameOrgUsers = await sameOrgQuery.limit(20).getMany();

            sameOrgUsers.forEach(user => {
                // Don't add if already suggested as friend of friend
                if (!suggestions.find(s => s.suggestedUserId === user.identityId)) {
                    suggestions.push({
                        userId,
                        suggestedUserId: user.identityId,
                        score: 50, // Medium priority
                        mutualCount: 0,
                        reason: 'same_organization',
                    });
                }
            });
        }

        // 3. PRIORITY 3: Random users (fallback when no matches)
        if (suggestions.length < 10) {
            const randomQuery = this.identityRepo
                .createQueryBuilder('identity')
                .select('identity.id')
                .where('identity.id != :userId', { userId });

            if (friendIds.length > 0) {
                randomQuery.andWhere('identity.id NOT IN (:...friendIds)', { friendIds });
            }

            const randomUsers = await randomQuery
                .orderBy('RANDOM()')
                .limit(20)
                .getMany();

            randomUsers.forEach(user => {
                // Don't add if already suggested
                if (!suggestions.find(s => s.suggestedUserId === user.id)) {
                    suggestions.push({
                        userId,
                        suggestedUserId: user.id,
                        score: 10, // Low priority
                        mutualCount: 0,
                        reason: 'random',
                    });
                }
            });
        }

        if (suggestions.length === 0) {
            return { message: 'No suggestions available', count: 0 };
        }

        // Get suggested users' profiles for additional scoring
        const suggestedUserIds = suggestions.map(s => s.suggestedUserId);
        const suggestedProfiles = await this.profileRepo.find({
            where: { identityId: In(suggestedUserIds) },
            relations: ['userSkills', 'userSkills.canonicalSkill']
        });

        // Enhance scores with profile data
        suggestions.forEach(suggestion => {
            const profile = suggestedProfiles.find(p => p.identityId === suggestion.suggestedUserId);

            if (profile && userProfile) {
                // Same location bonus
                if (profile.location && profile.location === userProfile.location) {
                    suggestion.score += 5;
                }

                // Profile completeness bonus
                suggestion.score += (profile.profileCompleteness / 100) * 2;

                // Similar skills bonus
                const userSkillIds = userProfile.userSkills?.map(s => s.canonicalSkillId) || [];
                const commonSkills = profile.userSkills?.filter(skill =>
                    userSkillIds.includes(skill.canonicalSkillId)
                ).length || 0;
                suggestion.score += commonSkills * 3;
            }
        });

        // Sort by score and take top 50
        suggestions.sort((a, b) => b.score - a.score);
        const topSuggestions = suggestions.slice(0, 50);

        // Clear old suggestions
        await this.suggestionRepo.delete({ userId });

        // Save new suggestions
        const suggestionEntities = topSuggestions.map(s =>
            this.suggestionRepo.create(s)
        );
        await this.suggestionRepo.save(suggestionEntities);

        return { message: 'Suggestions generated successfully', count: topSuggestions.length };
    }

    async getSuggestions(userId: string, limit = 20, offset = 0) {
        // Check if suggestions exist
        const count = await this.suggestionRepo.count({ where: { userId } });

        // Generate if none exist
        if (count === 0) {
            await this.generateSuggestions(userId);
        }

        const suggestions = await this.suggestionRepo.find({
            where: { userId },
            order: { score: 'DESC' },
            take: limit,
            skip: offset,
        });

        if (suggestions.length === 0) {
            return { suggestions: [], total: 0 };
        }

        const suggestedUserIds = suggestions.map(s => s.suggestedUserId);

        const users = await this.identityRepo.find({
            where: { id: In(suggestedUserIds) },
            select: ['id', 'username', 'email'],
        });

        const profiles = await this.profileRepo.find({
            where: { identityId: In(suggestedUserIds) },
        });

        const suggestionsWithDetails = suggestions.map(suggestion => {
            const user = users.find(u => u.id === suggestion.suggestedUserId);
            const profile = profiles.find(p => p.identityId === suggestion.suggestedUserId);
            return {
                ...suggestion,
                user: {
                    ...user,
                    profile,
                },
            };
        });

        const total = await this.suggestionRepo.count({ where: { userId } });

        return { suggestions: suggestionsWithDetails, total };
    }

    async refreshSuggestions(userId: string) {
        return this.generateSuggestions(userId);
    }
}
