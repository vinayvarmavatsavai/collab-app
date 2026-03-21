import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';
import { CanonicalRoleService } from '../../matching/services/canonical-role.service';
import { CanonicalDomainService } from '../../matching/services/canonical-domain.service';
import { CanonicalSkillService } from '../../matching/services/canonical-skill.service';

export interface TagSuggestion {
    value: string;
    source: 'resume' | 'predefined';
    category: 'domain' | 'skill' | 'experience' | 'interest' | 'availability' | 'role';
}

@Injectable()
export class TagGeneratorService {
    private readonly AVAILABILITY_TAGS = [
        'Part-time',
        'Full-time',
        'Weekends',
        'Flexible',
    ];

    private readonly INTEREST_TAGS = [
        'Open Source',
        'Startups',
        'Side Projects',
        'Fintech',
        'Healthtech',
        'Edtech',
        'AI/ML',
        'Web3',
        'Social Impact',
        'Enterprise Software'
    ];

    constructor(
        private roleService: CanonicalRoleService,
        private domainService: CanonicalDomainService,
        private skillService: CanonicalSkillService,
    ) { }

    /**
     * Generate all tag suggestions for a given step
     */
    /**
     * Generate all tag suggestions for a given step
     */
    async generateTagsForStep(field: string): Promise<TagSuggestion[]> {
        switch (field) {
            case 'primary_role':
            case 'roles':
                return await this.getRoleTags();
            case 'domains':
                return await this.getDomainTags();
            case 'skills':
                return this.getSkillTags();
            case 'interests':
                return this.getInterestTags();
            case 'availability':
                return this.getAvailabilityTags();
            default:
                return [];
        }
    }

    /**
     * Generate domain tag suggestions
     * Returns top 20 domains initially (can show all 50 with "Show More")
     */
    /**
     * Generate domain tag suggestions
     * Returns top 20 domains initially (can show all 50 with "Show More")
     */
    async getDomainTags(showAll: boolean = false): Promise<TagSuggestion[]> {
        const tags: TagSuggestion[] = [];
        const added = new Set<string>();

        // 2. From DB
        // 2. Fetch popular domains from DB
        try {
            const popular = await this.domainService.getPopularDomains(showAll ? 50 : 20);
            popular.forEach(d => {
                if (!added.has(d.domain.name)) {
                    tags.push({
                        value: d.domain.name,
                        source: 'predefined',
                        category: 'domain',
                    });
                    added.add(d.domain.name);
                }
            });
        } catch (e) {
            console.error('Failed to fetch popular domains', e);
        }

        return tags;
    }

    /**
     * Generate role tag suggestions
     */
    /**
     * Generate role tag suggestions
     */
    async getRoleTags(): Promise<TagSuggestion[]> {
        const tags: TagSuggestion[] = [];
        const added = new Set<string>();

        // 2. Popular Roles from DB
        try {
            const popular = await this.roleService.getPopularRoles(20);
            popular.forEach(p => {
                if (!added.has(p.role.name)) {
                    tags.push({
                        value: p.role.name,
                        source: 'predefined',
                        category: 'role',
                    });
                    added.add(p.role.name);
                }
            });
        } catch (e) {
            console.error('Failed to fetch popular roles', e);
        }

        return tags;
    }

    /**
     * Generate skill tag suggestions
     * Returns popular skills - domain-relevant skills logic to be added later
     * @param selectedDomains - Domains user has already selected (for filtering)
     */
    async getSkillTags(selectedDomains?: string[]): Promise<TagSuggestion[]> {
        const tags: TagSuggestion[] = [];
        const addedSkills = new Set<string>();

        // 2. From DB (Popular & Domain-relevant)
        // Note: Ideally we would have a method to get skills by domain, but for now we'll fetch popular skills
        // and if we had a domain-skill mapping in DB we would use it.
        // Since we don't have explicit domain-skill mapping in DB yet (unless we query UserSkills joined with UserDomains via users, which is expensive),
        // we will fetch general popular skills from CanonicalSkillService.

        try {
            // Get more skills to fill the gaps
            const limit = 20;
            const popularSkills = await this.skillService.getVerifiedPopularSkills(limit);

            popularSkills.forEach(s => {
                const name = s.skill.name;
                if (!addedSkills.has(name.toLowerCase()) && tags.length < 20) {
                    tags.push({
                        value: name,
                        source: 'predefined',
                        category: 'skill',
                    });
                    addedSkills.add(name.toLowerCase());
                }
            });
        } catch (error) {
            console.error('Failed to fetch popular skills:', error);
            // Fallback to empty or minimal defaults if DB fails, but try to avoid hardcoded long lists
        }

        return tags;
    }

    /**
     * Generate interest tag suggestions
     * Returns top 12 interests
     */
    getInterestTags(): TagSuggestion[] {
        return this.INTEREST_TAGS.slice(0, 12).map(interest => ({
            value: interest,
            source: 'predefined',
            category: 'interest',
        }));
    }

    /**
     * Generate availability tag suggestions
     */
    getAvailabilityTags(): TagSuggestion[] {
        return this.AVAILABILITY_TAGS.map(availability => ({
            value: availability,
            source: 'predefined',
            category: 'availability',
        }));
    }
}
