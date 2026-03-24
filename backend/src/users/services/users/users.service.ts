import { Injectable, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserProfileDto } from 'src/users/dto/create-user-profile.dto';
import { UserProfile } from 'src/users/entities/user-profile.entity';
import { Identity } from 'src/auth/entities/identity.entity';
import { Repository, ILike, In } from 'typeorm';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { BackgroundJobsService } from 'src/matching/services/background-jobs.service';
import { CanonicalRoleService } from 'src/matching/services/canonical-role.service';
import { CanonicalDomainService } from 'src/matching/services/canonical-domain.service';
import { CanonicalSkillService } from 'src/matching/services/canonical-skill.service';
import { UserSkill } from 'src/matching/entities/user-skill.entity';
import { UserRole } from 'src/matching/entities/user-role.entity';
import { UserDomain } from 'src/matching/entities/user-domain.entity';
import { ProfessionalRole } from 'src/matching/entities/professional-role.entity';
import { Domain } from 'src/matching/entities/domain.entity';
import { CanonicalSkill } from 'src/matching/entities/canonical-skill.entity';
import { isUUID } from 'class-validator';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserProfile)
        private readonly repo: Repository<UserProfile>,
        @InjectRepository(Identity)
        private readonly identityRepo: Repository<Identity>,
        private readonly configService: ConfigService,
        @InjectRepository(UserSkill)
        private readonly userSkillRepo: Repository<UserSkill>,
        @InjectRepository(UserRole)
        private readonly userRoleRepo: Repository<UserRole>,
        @InjectRepository(UserDomain)
        private readonly userDomainRepo: Repository<UserDomain>,
        private readonly canonicalRoleService: CanonicalRoleService,
        private readonly canonicalDomainService: CanonicalDomainService,
        private readonly canonicalSkillService: CanonicalSkillService,
        @Inject(forwardRef(() => BackgroundJobsService))
        private readonly backgroundJobs?: BackgroundJobsService, // Optional to maintain backward compatibility
    ) { }

    async createUserProfile(
        identityId: string,
        dto: CreateUserProfileDto,
    ): Promise<UserProfile> {
        const profile = this.repo.create({
            identityId,
            firstname: dto.firstname,
            lastname: dto.lastname,
            phone: dto.phone,
            intent: dto.intent,
        });

        return this.repo.save(profile);
    }

    async getProfileByIdentity(identityId: string): Promise<UserProfile | null> {
        return this.repo.findOne({
            where: { identityId },
            relations: ['primaryRole', 'userRoles', 'userRoles.role', 'userDomains', 'userDomains.domain', 'userSkills', 'userSkills.canonicalSkill']
        });
    }

    async getUserProfileById(identityId: string): Promise<UserProfile> {
        const profile = await this.repo.findOne({
            where: { identityId },
            relations: ['primaryRole', 'userRoles', 'userRoles.role', 'userDomains', 'userDomains.domain', 'userSkills', 'userSkills.canonicalSkill']
        });
        if (!profile) {
            throw new NotFoundException('User profile not found');
        }
        return profile;
    }

    async updateUserProfile(
        identityId: string,
        updateData: Partial<UserProfile>,
    ): Promise<UserProfile> {
        const profile = await this.getUserProfileById(identityId);

        Object.assign(profile, updateData);

        // Recalculate profile completeness
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        // Auto-complete onboarding if profile is sufficiently filled
        if (profile.profileCompleteness >= 50 && !profile.onboardingCompleted) {
            profile.onboardingCompleted = true;
        }

        const savedProfile = await this.repo.save(profile);

        // NON-BLOCKING: Queue profile vector update if relevant fields changed
        if (this.backgroundJobs && typeof this.backgroundJobs.queueProfileVectorUpdate === 'function') {
            const relevantFields = ['skills', 'domains', 'bio', 'headline', 'intent', 'location', 'interests'];
            const shouldUpdate = relevantFields.some(field => Object.keys(updateData).includes(field));

            if (shouldUpdate) {
                try {
                    await this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id);
                } catch (error) {
                    console.error('Failed to queue profile vector update:', error);
                }
            }
        } else {
            console.warn('BackgroundJobsService not available. Skipping profile vector update.');
        }

        return savedProfile;
    }

    async getCloudinarySignature() {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = `timestamp=${timestamp}`;
        const apiSecret = this.configService.get<string>('cloudinary.apiSecret');
        const signature = crypto
            .createHash('sha1')
            .update(paramsToSign + apiSecret)
            .digest('hex');

        return {
            signature,
            timestamp,
            cloudName: this.configService.get<string>('cloudinary.cloudName'),
            apiKey: this.configService.get<string>('cloudinary.apiKey'),
        };
    }

    async searchUsers(query: string, limit = 20, offset = 0) {
        const identities = await this.identityRepo.find({
            where: [
                { username: ILike(`%${query}%`) },
                { email: ILike(`%${query}%`) },
            ],
            select: ['id', 'username', 'email'],
            take: limit,
            skip: offset,
        });

        const identityIds = identities.map(i => i.id);
        const profiles = await this.repo.find({
            where: identityIds.map(id => ({ identityId: id })),
        });

        const results = identities.map(identity => {
            const profile = profiles.find(p => p.identityId === identity.id);
            return {
                ...identity,
                profile,
            };
        });

        return results;
    }

    async getProfileByUsername(username: string) {
        const identity = await this.identityRepo.findOne({
            where: { username },
            select: ['id', 'username', 'email', 'createdAt'],
        });

        if (!identity) {
            throw new NotFoundException('User not found');
        }

        const profile = await this.repo.findOne({
            where: { identityId: identity.id },
            relations: ['primaryRole', 'userRoles', 'userRoles.role', 'userDomains', 'userDomains.domain', 'userSkills', 'userSkills.canonicalSkill']
        });

        return {
            ...identity,
            profile,
        };
    }

    async getProfileByUserId(userId: string) {
        const profile = await this.repo.findOne({
            where: { id: userId },
            relations: ['primaryRole', 'userRoles', 'userRoles.role', 'userDomains', 'userDomains.domain', 'userSkills', 'userSkills.canonicalSkill']
        });

        if (!profile) {
            throw new NotFoundException('User profile not found');
        }

        return profile;
    }

    async getFullProfile(identityId: string) {
        const identity = await this.identityRepo.findOne({
            where: { id: identityId },
            select: ['id', 'username', 'email', 'createdAt'],
        });

        if (!identity) {
            throw new NotFoundException('User not found');
        }

        const profile = await this.repo.findOne({
            where: { identityId },
            relations: ['primaryRole', 'userRoles', 'userRoles.role', 'userDomains', 'userDomains.domain', 'userSkills', 'userSkills.canonicalSkill']
        });

        return {
            ...identity,
            profile,
        };
    }

    // Experience management
    async addExperience(identityId: string, experienceData: any) {
        const profile = await this.getUserProfileById(identityId);
        const experience = profile.experience || [];

        experience.push({
            id: uuidv4(),
            ...experienceData,
        });

        profile.experience = experience;
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id).catch(e => console.error(e));
        }

        return savedProfile;
    }

    async updateExperience(identityId: string, experienceId: string, experienceData: any) {
        const profile = await this.getUserProfileById(identityId);
        const experience = profile.experience || [];

        const index = experience.findIndex(e => e.id === experienceId);
        if (index === -1) {
            throw new NotFoundException('Experience not found');
        }

        experience[index] = { ...experience[index], ...experienceData };
        profile.experience = experience;

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id).catch(e => console.error(e));
        }

        return savedProfile;
    }

    async deleteExperience(identityId: string, experienceId: string) {
        const profile = await this.getUserProfileById(identityId);
        const experience = profile.experience || [];

        profile.experience = experience.filter(e => e.id !== experienceId);
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id).catch(e => console.error(e));
        }

        return savedProfile;
    }

    // Education management
    async addEducation(identityId: string, educationData: any) {
        const profile = await this.getUserProfileById(identityId);
        const education = profile.education || [];

        education.push({
            id: uuidv4(),
            ...educationData,
        });

        profile.education = education;
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id).catch(e => console.error(e));
        }

        return savedProfile;
    }

    async updateEducation(identityId: string, educationId: string, educationData: any) {
        const profile = await this.getUserProfileById(identityId);
        const education = profile.education || [];

        const index = education.findIndex(e => e.id === educationId);
        if (index === -1) {
            throw new NotFoundException('Education not found');
        }

        education[index] = { ...education[index], ...educationData };
        profile.education = education;

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id).catch(e => console.error(e));
        }

        return savedProfile;
    }

    async deleteEducation(identityId: string, educationId: string) {
        const profile = await this.getUserProfileById(identityId);
        const education = profile.education || [];

        profile.education = education.filter(e => e.id !== educationId);
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id).catch(e => console.error(e));
        }

        return savedProfile;
    }

    // Certification management
    async addCertification(identityId: string, certificationData: any) {
        const profile = await this.getUserProfileById(identityId);
        const certifications = profile.certifications || [];

        certifications.push({
            id: uuidv4(),
            ...certificationData,
        });

        profile.certifications = certifications;
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        return this.repo.save(profile);
    }

    async deleteCertification(identityId: string, certificationId: string) {
        const profile = await this.getUserProfileById(identityId);
        const certifications = profile.certifications || [];

        profile.certifications = certifications.filter(c => c.id !== certificationId);
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        return this.repo.save(profile);
    }

    // Profile completeness calculation
    calculateProfileCompleteness(profile: UserProfile): number {
        let score = 20; // Basic info (name, email) - auto-filled

        if (profile.headline) score += 10;
        if (profile.bio) score += 10;
        if (profile.location) score += 5;
        if (profile.profilePicture) score += 15;
        if (profile.coverPhoto) score += 5;
        if (profile.experience && profile.experience.length > 0) score += 15;
        if (profile.education && profile.education.length > 0) score += 10;
        if (profile.userSkills && profile.userSkills.length >= 3) score += 10;

        return Math.min(score, 100);
    }

    async getProfileCompleteness(identityId: string) {
        const profile = await this.getUserProfileById(identityId);
        return {
            completeness: profile.profileCompleteness,
            suggestions: this.getCompletionSuggestions(profile),
        };
    }

    private getCompletionSuggestions(profile: UserProfile): string[] {
        const suggestions: string[] = [];

        if (!profile.headline) suggestions.push('Add a headline');
        if (!profile.bio) suggestions.push('Write an about section');
        if (!profile.location) suggestions.push('Add your location');
        if (!profile.profilePicture) suggestions.push('Upload a profile picture');
        if (!profile.coverPhoto) suggestions.push('Add a cover photo');
        if (!profile.experience || profile.experience.length === 0) suggestions.push('Add work experience');
        if (!profile.education || profile.education.length === 0) suggestions.push('Add education');
        if (!profile.userSkills || profile.userSkills.length < 3) suggestions.push('Add at least 3 skills');

        return suggestions;
    }

    // Domain Management
    async addUserDomain(identityId: string, domainName: string) {
        const profile = await this.getUserProfileById(identityId);

        // Resolve canonical domain
        let domain = await this.canonicalDomainService.findOrCreateCanonicalDomain(
            domainName,
            undefined,
            identityId
        );

        if (!domain) {
            throw new Error('Could not resolve domain');
        }

        // Check if exists
        const existing = await this.userDomainRepo.findOne({
            where: {
                userProfileId: profile.id,
                domainId: domain.id
            }
        });

        if (existing) {
            return existing;
        }

        const userDomain = this.userDomainRepo.create({
            userProfileId: profile.id,
            domainId: domain.id,
            userProfile: profile,
            domain: domain
        });

        const saved = await this.userDomainRepo.save(userDomain);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(profile.id).catch(e => console.error(e));
        }

        return saved;
    }

    async removeUserDomain(identityId: string, domainId: string) {
        const profile = await this.getUserProfileById(identityId);

        // Try to find the user domain first to get the canonical domain ID
        let userDomain = await this.userDomainRepo.findOne({
            where: { id: domainId, userProfileId: profile.id },
            relations: ['domain']
        });

        let canonicalDomainId = userDomain?.domainId;

        if (!userDomain) {
            // Fallback: maybe domainId passed is the canonical domain ID?
            userDomain = await this.userDomainRepo.findOne({
                where: { domainId: domainId, userProfileId: profile.id },
                relations: ['domain']
            });
            canonicalDomainId = userDomain?.domainId;
        }

        if (!userDomain) {
            throw new NotFoundException('User domain not found');
        }

        // Capture ID before delete
        canonicalDomainId = userDomain.domainId;

        await this.userDomainRepo.remove(userDomain);

        // Decrement usage count
        if (canonicalDomainId) {
            this.canonicalDomainService.decrementUsageCount(canonicalDomainId).catch(e => console.error(e));
        }

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(profile.id).catch(e => console.error(e));
        }

        return { success: true };
    }

    // Role Management
    async addUserRole(identityId: string, roleName: string) {
        const profile = await this.getUserProfileById(identityId);

        // Resolve canonical role
        let role = await this.canonicalRoleService.findOrCreateCanonicalRole(
            roleName,
            undefined,
            identityId
        );

        if (!role) {
            throw new Error('Could not resolve role');
        }

        // Check if exists
        const existing = await this.userRoleRepo.findOne({
            where: {
                userProfileId: profile.id,
                roleId: role.id
            }
        });

        if (existing) {
            return existing;
        }

        const userRole = this.userRoleRepo.create({
            userProfileId: profile.id,
            roleId: role.id,
            userProfile: profile,
            role: role
        });

        const saved = await this.userRoleRepo.save(userRole);

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(profile.id).catch(e => console.error(e));
        }

        return saved;
    }

    async removeUserRole(identityId: string, roleId: string) {
        const profile = await this.getUserProfileById(identityId);

        // Try to find the user role first to get the canonical role ID
        let userRole = await this.userRoleRepo.findOne({
            where: { id: roleId, userProfileId: profile.id },
            relations: ['role']
        });

        let canonicalRoleId = userRole?.roleId;

        if (!userRole) {
            // Fallback
            userRole = await this.userRoleRepo.findOne({
                where: { roleId: roleId, userProfileId: profile.id },
                relations: ['role']
            });
            canonicalRoleId = userRole?.roleId;
        }

        if (!userRole) {
            throw new NotFoundException('User role not found');
        }

        canonicalRoleId = userRole.roleId;

        await this.userRoleRepo.remove(userRole);

        // Decrement usage count
        if (canonicalRoleId) {
            this.canonicalRoleService.decrementUsageCount(canonicalRoleId).catch(e => console.error(e));
        }

        // Queue vector update
        if (this.backgroundJobs) {
            this.backgroundJobs.queueProfileVectorUpdate(profile.id).catch(e => console.error(e));
        }

        return { success: true };
    }

    // ============================================
    // Service Functions for Cross-Module Access
    // ============================================

    async isAccountPrivate(userId: string): Promise<boolean> {
        const identity = await this.identityRepo.findOne({
            where: { id: userId },
            select: ['isPrivate'],
        });

        return identity?.isPrivate || false;
    }

    async getAccountPrivacy(userIds: string[]): Promise<Map<string, boolean>> {
        const identities = await this.identityRepo.find({
            where: { id: In(userIds) },
            select: ['id', 'isPrivate'],
        });

        const privacyMap = new Map<string, boolean>();
        identities.forEach(identity => {
            privacyMap.set(identity.id, identity.isPrivate || false);
        });

        return privacyMap;
    }

    /**
     * Update user profile with onboarding data
     * Resolves strings to Canonical Entities and saves properly
     */
    async updateFromOnboarding(identityId: string, onboardingData: any): Promise<UserProfile> {
        const profile = await this.getUserProfileById(identityId);

        // 1. Update Primary Role
        if (onboardingData.primaryRole && typeof onboardingData.primaryRole === 'string') {
            try {
                const roleName = onboardingData.primaryRole.trim();

                if (roleName) {
                    const role = await this.canonicalRoleService.findOrCreateCanonicalRole(
                        roleName,
                        undefined,
                        identityId,
                    );

                    if (role) {
                        profile.primaryRole = role;
                        profile.currentPosition = role.name;
                        profile.primaryRoleId = role.id;
                        console.log(`Saved primary role: ${roleName} -> ${role.name}`);
                    } else {
                        console.warn(`Primary role could not be resolved: ${roleName}`);
                    }
                }
            } catch (error: any) {
                console.error(`Failed to resolve primary role "${onboardingData.primaryRole}":`, error?.message || error);
            }
        }

        // 2. Update Secondary Roles
        if (onboardingData.roles && onboardingData.roles.length > 0) {
            if (!profile.userRoles) profile.userRoles = [];

            for (const roleNameRaw of onboardingData.roles) {
                try {
                    if (typeof roleNameRaw !== 'string') continue;

                    const roleName = roleNameRaw.trim();
                    if (!roleName) continue;

                    const role = await this.canonicalRoleService.findOrCreateCanonicalRole(
                        roleName,
                        undefined,
                        identityId,
                    );

                    if (!role) {
                        console.warn(`Secondary role could not be resolved: ${roleName}`);
                        continue;
                    }

                    const existing =
                        profile.userRoles.find(ur => ur.roleId === role.id) ||
                        await this.userRoleRepo.findOne({
                            where: {
                                userProfileId: profile.id,
                                roleId: role.id
                            }
                        });

                    if (!existing) {
                        const userRole = this.userRoleRepo.create({
                            userProfileId: profile.id,
                            roleId: role.id,
                            userProfile: profile,
                            role: role
                        });
                        profile.userRoles.push(userRole);
                    }

                    console.log(`Saved onboarding secondary role: ${roleName} -> ${role.name}`);
                } catch (error: any) {
                    console.error(`Failed to resolve/save secondary role "${roleNameRaw}":`, error?.message || error);
                }
            }
        }

        // 3. Update Domains
        if (onboardingData.domains && onboardingData.domains.length > 0) {
            if (!profile.userDomains) profile.userDomains = [];

            for (const domainInputRaw of onboardingData.domains) {
                try {
                    if (typeof domainInputRaw !== 'string') continue;

                    const domainInput = domainInputRaw.trim();
                    if (!domainInput) continue;

                    let domain: Domain | null = null;

                    if (isUUID(domainInput)) {
                        domain = await this.canonicalDomainService.getDomainById(domainInput);
                    }

                    if (!domain) {
                        domain = await this.canonicalDomainService.findOrCreateCanonicalDomain(
                            domainInput,
                            undefined,
                            identityId
                        );
                    }

                    if (!domain) {
                        console.warn(`Domain could not be resolved: ${domainInput}`);
                        continue;
                    }

                    const existing =
                        profile.userDomains.find(ud => ud.domainId === domain.id) ||
                        await this.userDomainRepo.findOne({
                            where: {
                                userProfileId: profile.id,
                                domainId: domain.id
                            }
                        });

                    if (!existing) {
                        const userDomain = this.userDomainRepo.create({
                            userProfileId: profile.id,
                            domainId: domain.id,
                            userProfile: profile,
                            domain: domain
                        });
                        profile.userDomains.push(userDomain);
                    }

                    console.log(`Saved onboarding domain: ${domainInput} -> ${domain.name}`);
                } catch (error: any) {
                    console.error(`Failed to resolve/save domain "${domainInputRaw}":`, error?.message || error);
                }
            }
        }

        // 4. Update Skills (Legacy + Structured)
        if (onboardingData.skills && onboardingData.skills.length > 0) {
            if (!profile.userSkills) profile.userSkills = [];

            const skillInputs: Array<{ name: string; proficiency?: number; yearsExperience?: number }> = [];

            if (typeof onboardingData.skills[0] === 'string') {
                for (const s of onboardingData.skills) {
                    if (typeof s === 'string' && s.trim()) {
                        skillInputs.push({
                            name: s.trim(),
                            proficiency: 3,
                            yearsExperience: 0,
                        });
                    }
                }
            } else {
                for (const s of onboardingData.skills) {
                    if (s?.name && typeof s.name === 'string' && s.name.trim()) {
                        skillInputs.push({
                            name: s.name.trim(),
                            proficiency: s.proficiency,
                            yearsExperience: s.yearsExperience,
                        });
                    }
                }
            }

            for (const input of skillInputs) {
                try {
                    let canonical: CanonicalSkill | null = null;
                    const inputName = input.name.trim();

                    if (!inputName) continue;

                    if (isUUID(inputName)) {
                        canonical = await this.canonicalSkillService.getSkillById(inputName);
                    }

                    if (!canonical) {
                        canonical = await this.canonicalSkillService.findOrCreateCanonicalSkill(
                            inputName,
                            undefined,
                            identityId
                        );
                    }

                    if (!canonical) {
                        console.warn(`Skill could not be resolved: ${inputName}`);
                        continue;
                    }

                    let userSkill =
                        profile.userSkills.find(us => us.canonicalSkillId === canonical!.id) ||
                        await this.userSkillRepo.findOne({
                            where: {
                                userProfileId: profile.id,
                                canonicalSkillId: canonical.id
                            }
                        });

                    if (!userSkill) {
                        userSkill = this.userSkillRepo.create({
                            userProfileId: profile.id,
                            canonicalSkillId: canonical.id,
                            userProfile: profile,
                            canonicalSkill: canonical,
                            proficiency: input.proficiency ?? 3,
                            yearsExperience: input.yearsExperience ?? 0,
                        });

                        profile.userSkills.push(userSkill);
                    } else {
                        userSkill.proficiency = input.proficiency ?? userSkill.proficiency ?? 3;
                        userSkill.yearsExperience = input.yearsExperience ?? userSkill.yearsExperience ?? 0;
                    }

                    console.log(`Saved onboarding skill: ${inputName} -> ${canonical.name}`);
                } catch (error: any) {
                    console.error(`Failed to resolve/save skill "${input?.name}":`, error?.message || error);
                }
            }
        }

        // 5. Update Projects (JSONB for now)
        if (onboardingData.projects && onboardingData.projects.length > 0) {
            profile.projects = onboardingData.projects.map((project: any) => ({
                title: project.title,
                description: project.description,
                role: project.role,
                technologies: project.technologies,
                duration: project.duration,
            }));
        }

        // 6. Update Availability/Intent
        if (onboardingData.availabilityHours || onboardingData.availability) {
            const availability = onboardingData.availabilityHours || onboardingData.availability;
            if (typeof availability === 'number') {
                profile.availabilityHours = availability;
            } else if (typeof availability === 'string') {
                const parsed = parseInt(availability, 10);
                if (!isNaN(parsed)) {
                    profile.availabilityHours = parsed;
                }
            }
        }

        if (onboardingData.collaborationGoals) {
            profile.collaborationGoals = onboardingData.collaborationGoals;
        }

        if (onboardingData.intent) {
            profile.intent = onboardingData.intent;
        }

        // 7. Generate Summary & Save
        profile.profileSummaryText = this.generateProfileSummary(profile);
        profile.onboardingCompleted = true;
        profile.profileCompleteness = this.calculateProfileCompleteness(profile);

        const savedProfile = await this.repo.save(profile);

        // Queue vector update
        if (this.backgroundJobs && typeof this.backgroundJobs.queueProfileVectorUpdate === 'function') {
            try {
                await this.backgroundJobs.queueProfileVectorUpdate(savedProfile.id);
            } catch (error) {
                console.error('Failed to queue profile vector update:', error);
            }
        }

        return savedProfile;
    }

    /**
     * Generate a human-readable profile summary for future embedding
     */
    private generateProfileSummary(profile: UserProfile): string {
        const parts: string[] = [];

        if (profile.headline) {
            parts.push(`${profile.firstname} ${profile.lastname} - ${profile.headline}`);
        } else {
            parts.push(`${profile.firstname} ${profile.lastname}`);
        }

        if (profile.userSkills && profile.userSkills.length > 0) {
            const skillsText = profile.userSkills
                .map(s => {
                    const name = s.canonicalSkill ? s.canonicalSkill.name : 'Unknown Skill';
                    return `${name} (${s.yearsExperience}y, proficiency ${s.proficiency}/5)`;
                })
                .join(', ');
            parts.push(`Skills: ${skillsText}`);
        }

        if (profile.userDomains && profile.userDomains.length > 0) {
            const domainNames = profile.userDomains.map(d => d.domain?.name || 'Unknown');
            parts.push(`Domains: ${domainNames.join(', ')}`);
        }

        if (profile.userRoles && profile.userRoles.length > 0) {
            const roleNames = profile.userRoles.map(r => r.role?.name || 'Unknown');
            parts.push(`Roles: ${roleNames.join(', ')}`);
        } else if (profile.primaryRole) {
            parts.push(`Role: ${profile.primaryRole.name}`);
        }

        if (profile.collaborationGoals) {
            parts.push(`Goals: ${profile.collaborationGoals}`);
        }

        if (profile.availabilityHours) {
            parts.push(`Available: ${profile.availabilityHours} hours/week`);
        }

        if (profile.experience && profile.experience.length > 0) {
            const expText = profile.experience.map(e => `${e.position} at ${e.company}`).join(', ');
            parts.push(`Experience: ${expText}`);
        }

        if (profile.education && profile.education.length > 0) {
            const eduText = profile.education.map(e => `${e.degree} from ${e.school}`).join(', ');
            parts.push(`Education: ${eduText}`);
        }

        return parts.join('. ');
    }
}