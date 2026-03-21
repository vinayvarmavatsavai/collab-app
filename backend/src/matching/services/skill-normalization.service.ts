import { Injectable } from '@nestjs/common';

@Injectable()
export class SkillNormalizationService {
    /**
     * Normalize skill string for matching
     * Removes spaces, special characters, converts to lowercase
     */
    normalizeSkill(raw: string): string {
        if (!raw) return '';

        return raw
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '')        // remove all spaces
            .replace(/[^a-z0-9]/g, ''); // remove special characters
    }

    /**
     * Normalize multiple skills
     */
    normalizeSkills(skills: string[]): string[] {
        return skills.map(skill => this.normalizeSkill(skill)).filter(s => s.length > 0);
    }

    /**
     * Check if two skills are exact match after normalization
     */
    areSkillsEqual(skill1: string, skill2: string): boolean {
        return this.normalizeSkill(skill1) === this.normalizeSkill(skill2);
    }

    /**
     * Get display name from normalized skill
     * Capitalizes first letter of each word
     */
    getDisplayName(normalized: string): string {
        if (!normalized) return '';

        // Add space before capital letters and numbers
        const withSpaces = normalized
            .replace(/([A-Z])/g, ' $1')
            .replace(/([0-9]+)/g, ' $1')
            .trim();

        // Capitalize first letter of each word
        return withSpaces
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Extract skill variants that should be aliases
     * e.g., "Next.js" -> ["nextjs", "next", "next.js"]
     */
    generateAliases(skillName: string): string[] {
        const normalized = this.normalizeSkill(skillName);
        const aliases = new Set<string>([normalized]);

        // Add original lowercase
        aliases.add(skillName.toLowerCase().trim());

        // Add without dots
        aliases.add(skillName.toLowerCase().replace(/\./g, ''));

        // Add without spaces
        aliases.add(skillName.toLowerCase().replace(/\s+/g, ''));

        // Add without dashes
        aliases.add(skillName.toLowerCase().replace(/-/g, ''));

        // Remove empty strings
        return Array.from(aliases).filter(a => a.length > 0);
    }

}

