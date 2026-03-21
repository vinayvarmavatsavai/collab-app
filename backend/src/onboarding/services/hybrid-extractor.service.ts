import { Injectable } from '@nestjs/common';

export interface HybridInput {
    selectedTags: string[];
    textInput: string;
}

export interface ExtractedProfile {
    domains?: string[];
    skills?: string[];
    experience?: string[];
    interests?: string[];
    availability?: string;
}

/**
 * Hybrid Extractor Service
 * Combines tag selections + text input → structured profile data
 * Uses simple text-to-tag conversion (no AI needed)
 */
@Injectable()
export class HybridExtractorService {
    /**
     * Extract domains from hybrid input
     */
    extractDomains(input: HybridInput): string[] {
        const domains = [...input.selectedTags];

        // Convert text input into custom tags
        if (input.textInput && input.textInput.trim()) {
            const customTags = this.convertTextToTags(input.textInput);
            domains.push(...customTags);
        }

        return [...new Set(domains)]; // Deduplicate
    }

    /**
     * Extract skills from hybrid input
     */
    extractSkills(input: HybridInput): string[] {
        const skills = [...input.selectedTags];

        // Convert text input into custom tags
        if (input.textInput && input.textInput.trim()) {
            const customTags = this.convertTextToTags(input.textInput);
            skills.push(...customTags);
        }

        return [...new Set(skills)]; // Deduplicate
    }

    /**
     * Extract experience from hybrid input
     */
    extractExperience(input: HybridInput): string[] {
        const experience = [...input.selectedTags];

        // Add text input as experience entry
        if (input.textInput && input.textInput.trim().length > 0) {
            experience.push(input.textInput.trim());
        }

        return experience;
    }

    /**
     * Extract interests from hybrid input
     */
    extractInterests(input: HybridInput): string[] {
        const interests = [...input.selectedTags];

        // Convert text input into custom tags
        if (input.textInput && input.textInput.trim()) {
            const customTags = this.convertTextToTags(input.textInput);
            interests.push(...customTags);
        }

        return [...new Set(interests)]; // Deduplicate
    }

    /**
     * Extract availability from hybrid input
     */
    extractAvailability(input: HybridInput): string | null {
        // Prefer selected tag
        if (input.selectedTags.length > 0) {
            return input.selectedTags[0]; // Take first tag
        }

        // Use text input directly
        if (input.textInput && input.textInput.trim()) {
            return input.textInput.trim();
        }

        return null;
    }

    /**
     * Convert free-form text into tags
     * Splits by commas, semicolons, or "and"
     * Example: "React, Python and Docker" → ["React", "Python", "Docker"]
     */
    private convertTextToTags(text: string): string[] {
        // Split by common separators
        const separators = /[,;]|\sand\s|\sor\s/gi;
        const parts = text.split(separators);

        return parts
            .map(part => part.trim())
            .filter(part => part.length > 0 && part.length < 50) // Reasonable tag length
            .map(part => {
                // Capitalize first letter
                return part.charAt(0).toUpperCase() + part.slice(1);
            });
    }
}
