/**
 * Canonical skill name mappings
 * Maps common variations to standardized names
 */
export const SKILL_MAPPINGS: Record<string, string> = {
    // JavaScript ecosystem
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'react': 'React',
    'reactjs': 'React',
    'react.js': 'React',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'angular': 'Angular',
    'next': 'Next.js',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',

    // Backend
    'express': 'Express.js',
    'expressjs': 'Express.js',
    'nest': 'NestJS',
    'nestjs': 'NestJS',
    'django': 'Django',
    'flask': 'Flask',
    'spring': 'Spring Boot',
    'springboot': 'Spring Boot',

    // Databases
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'mongo': 'MongoDB',
    'mongodb': 'MongoDB',
    'redis': 'Redis',

    // Cloud & DevOps
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'azure': 'Azure',
    'gcp': 'Google Cloud',
    'google cloud': 'Google Cloud',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'k8s': 'Kubernetes',

    // Blockchain
    'solidity': 'Solidity',
    'ethereum': 'Ethereum',
    'eth': 'Ethereum',
    'web3': 'Web3',
    'hardhat': 'Hardhat',
    'ethers': 'Ethers.js',
    'ethers.js': 'Ethers.js',

    // Design
    'figma': 'Figma',
    'sketch': 'Sketch',
    'photoshop': 'Photoshop',
    'illustrator': 'Illustrator',
};

/**
 * Industry/domain mappings
 */
export const DOMAIN_MAPPINGS: Record<string, string> = {
    'fintech': 'FinTech',
    'finance': 'Finance',
    'banking': 'Banking',
    'healthcare': 'Healthcare',
    'health': 'Healthcare',
    'medical': 'Healthcare',
    'education': 'EdTech',
    'edtech': 'EdTech',
    'ecommerce': 'E-commerce',
    'e-commerce': 'E-commerce',
    'saas': 'SaaS',
    'b2b': 'B2B',
    'enterprise': 'Enterprise',
    'startup': 'Startups',
    'gaming': 'Gaming',
    'blockchain': 'Blockchain',
    'crypto': 'Cryptocurrency',
};

/**
 * Role/title mappings
 */
export const ROLE_MAPPINGS: Record<string, string> = {
    'frontend developer': 'Frontend Developer',
    'front-end developer': 'Frontend Developer',
    'backend developer': 'Backend Developer',
    'back-end developer': 'Backend Developer',
    'fullstack developer': 'Full-Stack Developer',
    'full-stack developer': 'Full-Stack Developer',
    'full stack developer': 'Full-Stack Developer',
    'software engineer': 'Software Engineer',
    'software developer': 'Software Developer',
    'web developer': 'Web Developer',
    'blockchain developer': 'Blockchain Developer',
    'ui designer': 'UI Designer',
    'ux designer': 'UX Designer',
    'product designer': 'Product Designer',
    'graphic designer': 'Graphic Designer',
    'product manager': 'Product Manager',
    'project manager': 'Project Manager',
    'data scientist': 'Data Scientist',
    'data analyst': 'Data Analyst',
    'devops engineer': 'DevOps Engineer',
    'qa engineer': 'QA Engineer',
};

export class SignalNormalizer {
    /**
     * Normalize skill name to canonical form
     */
    static normalizeSkill(skill: string): string {
        const lower = skill.toLowerCase().trim();
        return SKILL_MAPPINGS[lower] || this.capitalize(skill);
    }

    /**
     * Normalize domain/industry name
     */
    static normalizeDomain(domain: string): string {
        const lower = domain.toLowerCase().trim();
        return DOMAIN_MAPPINGS[lower] || this.capitalize(domain);
    }

    /**
     * Normalize role/title
     */
    static normalizeRole(role: string): string {
        const lower = role.toLowerCase().trim();
        return ROLE_MAPPINGS[lower] || this.capitalize(role);
    }

    /**
     * Capitalize first letter
     */
    private static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Deduplicate array of normalized values
     */
    static deduplicate(values: string[]): string[] {
        return [...new Set(values)];
    }
}
