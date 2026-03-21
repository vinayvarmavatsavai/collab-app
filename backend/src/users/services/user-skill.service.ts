import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSkill } from '../../matching/entities/user-skill.entity';
import { CanonicalSkillService } from '../../matching/services/canonical-skill.service';

import { UserProfile } from '../../users/entities/user-profile.entity';

@Injectable()
export class UserSkillService {
    constructor(
        @InjectRepository(UserSkill)
        private userSkillRepo: Repository<UserSkill>,
        @InjectRepository(UserProfile)
        private userProfileRepo: Repository<UserProfile>,
        private canonicalSkillService: CanonicalSkillService,
    ) { }

    async getUserSkills(identityId: string): Promise<UserSkill[]> {
        const userProfile = await this.userProfileRepo.findOne({ where: { identityId } });
        if (!userProfile) {
            return [];
        }

        return await this.userSkillRepo.find({
            where: { userProfileId: userProfile.id },
            relations: ['canonicalSkill'],
            order: { createdAt: 'DESC' },
        });
    }

    async addUserSkill(
        identityId: string,
        skillId: string,
        proficiency: number = 1,
        yearsExperience: number = 0,
    ): Promise<UserSkill> {
        // Get user profile first
        const userProfile = await this.userProfileRepo.findOne({ where: { identityId } });
        if (!userProfile) {
            throw new NotFoundException('User profile not found');
        }

        // Check if skill exists
        const skill = await this.canonicalSkillService.getSkillById(skillId);
        if (!skill) {
            throw new NotFoundException('Skill not found');
        }

        // Check if user already has this skill
        const existing = await this.userSkillRepo.findOne({
            where: {
                userProfileId: userProfile.id,
                canonicalSkillId: skillId,
            },
        });

        if (existing) {
            // Update existing
            existing.proficiency = proficiency;
            existing.yearsExperience = yearsExperience;
            return await this.userSkillRepo.save(existing);
        }

        // Create new
        const userSkill = this.userSkillRepo.create({
            userProfileId: userProfile.id,
            canonicalSkillId: skillId,
            proficiency,
            yearsExperience,
        });

        const saved = await this.userSkillRepo.save(userSkill);

        // Increment usage count
        await this.canonicalSkillService.getSkillById(skillId); // This will increment

        const result = await this.userSkillRepo.findOne({
            where: { id: saved.id },
            relations: ['canonicalSkill'],
        });

        if (!result) {
            throw new NotFoundException('Failed to retrieve saved skill');
        }

        return result;
    }

    async updateUserSkill(
        identityId: string,
        userSkillId: string,
        updates: { proficiency?: number; yearsExperience?: number },
    ): Promise<UserSkill> {
        const userProfile = await this.userProfileRepo.findOne({ where: { identityId } });
        if (!userProfile) {
            throw new NotFoundException('User profile not found');
        }
        const userSkill = await this.userSkillRepo.findOne({
            where: { id: userSkillId },
            relations: ['canonicalSkill'],
        });

        if (!userSkill) {
            throw new NotFoundException('User skill not found');
        }

        if (userSkill.userProfileId !== userProfile.id) {
            throw new ForbiddenException('Cannot update another user\'s skill');
        }

        if (updates.proficiency !== undefined) {
            userSkill.proficiency = updates.proficiency;
        }

        if (updates.yearsExperience !== undefined) {
            userSkill.yearsExperience = updates.yearsExperience;
        }

        return await this.userSkillRepo.save(userSkill);
    }

    async removeUserSkill(identityId: string, userSkillId: string): Promise<void> {
        const userProfile = await this.userProfileRepo.findOne({ where: { identityId } });
        if (!userProfile) {
            throw new NotFoundException('User profile not found');
        }
        const userSkill = await this.userSkillRepo.findOne({
            where: { id: userSkillId },
        });

        if (!userSkill) {
            throw new NotFoundException('User skill not found');
        }

        if (userSkill.userProfileId !== userProfile.id) {
            throw new ForbiddenException('Cannot remove another user\'s skill');
        }

        await this.userSkillRepo.remove(userSkill);

        // Decrement usage count on canonical skill
        try {
            await this.canonicalSkillService.decrementUsageCount(userSkill.canonicalSkillId);
        } catch (error) {
            console.error('Failed to decrement skill usage count:', error);
        }
    }
    async bulkAddUserSkills(identityId: string, skillIds: string[]): Promise<UserSkill[]> {
        const results: UserSkill[] = [];
        for (const skillId of skillIds) {
            try {
                // Default proficiency=1, years=0
                const result = await this.addUserSkill(identityId, skillId);
                results.push(result);
            } catch (error) {
                console.error(`Failed to add skill ${skillId}:`, error);
            }
        }
        return results;
    }
}
