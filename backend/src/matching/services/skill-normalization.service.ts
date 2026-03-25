import { Injectable } from '@nestjs/common';

@Injectable()
export class SkillNormalizationService {
    /**
     * Normalize skill string for matching.
     * Preserve important tech characters like ., +, #, /, -
     * so skills like Next.js, C++, C#, Node.js, Vue.js still match canonical rows.
     */
    normalizeSkill(raw: string): string {
        if (!raw) return '';

        let value = raw.toLowerCase().trim();

        // Normalize repeated whitespace
        value = value.replace(/\s+/g, ' ');

        // First-pass explicit mappings for common variants
        const exactMap: Record<string, string> = {
            'nextjs': 'next.js',
            'next js': 'next.js',
            'next.js': 'next.js',

            'vuejs': 'vue.js',
            'vue js': 'vue.js',
            'vue.js': 'vue.js',

            'nodejs': 'node.js',
            'node js': 'node.js',
            'node.js': 'node.js',

            'solidjs': 'solid.js',
            'solid js': 'solid.js',
            'solid.js': 'solid.js',

            'expressjs': 'express',
            'express js': 'express',
            'nestjs': 'nestjs',
            'nest js': 'nestjs',

            'c plus plus': 'c++',
            'cplusplus': 'c++',
            'c++': 'c++',

            'c sharp': 'c#',
            'csharp': 'c#',
            'c#': 'c#',
        };

        if (exactMap[value]) {
            return exactMap[value];
        }

        // Preserve letters, numbers, dot, plus, hash, slash, hyphen, and spaces
        value = value.replace(/[^a-z0-9.+#/\-\s]/g, '');

        // Normalize spaces again
        value = value.replace(/\s+/g, ' ').trim();

        // Second-pass mapping after cleanup
        if (exactMap[value]) {
            return exactMap[value];
        }

        return value;
    }

    /**
     * Normalize multiple skills
     */
    normalizeSkills(skills: string[]): string[] {
        return skills
            .map(skill => this.normalizeSkill(skill))
            .filter(s => s.length > 0);
    }

    /**
     * Check if two skills are exact match after normalization
     */
    areSkillsEqual(skill1: string, skill2: string): boolean {
        return this.normalizeSkill(skill1) === this.normalizeSkill(skill2);
    }

    /**
     * Return a readable display name from a normalized skill string.
     * Prefer preserving known tech spellings.
     */
    getDisplayName(normalized: string): string {
        if (!normalized) return '';

        const displayMap: Record<string, string> = {
            'next.js': 'Next.js',
            'vue.js': 'Vue.js',
            'node.js': 'Node.js',
            'solid.js': 'Solid.js',
            'c++': 'C++',
            'c#': 'C#',
            'nestjs': 'NestJS',
            'restapi': 'REST API',
            'graphql': 'GraphQL',
            'github': 'GitHub',
            'githubactions': 'GitHub Actions',
            'gitlabci': 'GitLab CI',
            'ui/uxdesign': 'UI/UX Design',
        };

        if (displayMap[normalized]) {
            return displayMap[normalized];
        }

        return normalized
            .split(/[\s/-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Extract skill variants that should be aliases.
     */
    generateAliases(skillName: string): string[] {
        if (!skillName) return [];

        const raw = skillName.toLowerCase().trim();
        const normalized = this.normalizeSkill(skillName);
        const aliases = new Set<string>();

        aliases.add(normalized);
        aliases.add(raw);
        aliases.add(raw.replace(/\s+/g, ''));
        aliases.add(raw.replace(/\./g, ''));
        aliases.add(raw.replace(/-/g, ''));
        aliases.add(raw.replace(/\s+/g, ' '));

        // Add curated common aliases for special cases
        const aliasMap: Record<string, string[]> = {
            'next.js': ['nextjs', 'next js'],
            'vue.js': ['vuejs', 'vue js'],
            'node.js': ['nodejs', 'node js'],
            'solid.js': ['solidjs', 'solid js'],
            'c++': ['cplusplus', 'c plus plus'],
            'c#': ['csharp', 'c sharp'],
            'nestjs': ['nest js'],
        };

        if (aliasMap[normalized]) {
            for (const alias of aliasMap[normalized]) {
                aliases.add(alias);
            }
        }

        return Array.from(aliases).filter(a => a.length > 0);
    }
}