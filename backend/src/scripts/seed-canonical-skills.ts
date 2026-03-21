import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CanonicalSkillService } from '../matching/services/canonical-skill.service';

interface SkillSeed {
    name: string;
    primaryDomainId: string;
    description?: string;
    aliases?: string[];
}

const CANONICAL_SKILLS: SkillSeed[] = [
    // Programming Languages
    { name: 'JavaScript', primaryDomainId: '', aliases: ['JS', 'javascript', 'js'] },
    { name: 'TypeScript', primaryDomainId: '', aliases: ['TS', 'typescript', 'ts'] },
    { name: 'Python', primaryDomainId: '', aliases: ['python', 'py'] },
    { name: 'Java', primaryDomainId: '', aliases: ['java'] },
    { name: 'C++', primaryDomainId: '', aliases: ['cpp', 'c++', 'cplusplus'] },
    { name: 'C', primaryDomainId: '', aliases: ['c'] },
    { name: 'C#', primaryDomainId: '', aliases: ['csharp', 'c#', 'cs'] },
    { name: 'Go', primaryDomainId: '', aliases: ['golang', 'go'] },
    { name: 'Rust', primaryDomainId: '', aliases: ['rust'] },
    { name: 'Ruby', primaryDomainId: '', aliases: ['ruby', 'rb'] },
    { name: 'PHP', primaryDomainId: '', aliases: ['php'] },
    { name: 'Swift', primaryDomainId: '', aliases: ['swift'] },
    { name: 'Kotlin', primaryDomainId: '', aliases: ['kotlin', 'kt'] },
    { name: 'Dart', primaryDomainId: '', aliases: ['dart'] },
    { name: 'Solidity', primaryDomainId: '', aliases: ['solidity', 'sol'] },

    // Frontend Frameworks
    { name: 'React', primaryDomainId: '', aliases: ['react', 'reactjs', 'react.js'] },
    { name: 'Next.js', primaryDomainId: '', aliases: ['nextjs', 'next', 'next.js'] },
    { name: 'Vue.js', primaryDomainId: '', aliases: ['vue', 'vuejs', 'vue.js'] },
    { name: 'Angular', primaryDomainId: '', aliases: ['angular', 'angularjs'] },
    { name: 'Svelte', primaryDomainId: '', aliases: ['svelte', 'sveltejs'] },
    { name: 'Solid.js', primaryDomainId: '', aliases: ['solid', 'solidjs'] },

    // Backend Frameworks
    { name: 'Node.js', primaryDomainId: '', aliases: ['node', 'nodejs', 'node.js'] },
    { name: 'Express', primaryDomainId: '', aliases: ['express', 'expressjs', 'express.js'] },
    { name: 'NestJS', primaryDomainId: '', aliases: ['nest', 'nestjs', 'nest.js'] },
    { name: 'Django', primaryDomainId: '', aliases: ['django'] },
    { name: 'Flask', primaryDomainId: '', aliases: ['flask'] },
    { name: 'FastAPI', primaryDomainId: '', aliases: ['fastapi', 'fast-api'] },
    { name: 'Spring Boot', primaryDomainId: '', aliases: ['spring', 'springboot', 'spring-boot'] },
    { name: 'Ruby on Rails', primaryDomainId: '', aliases: ['rails', 'ror', 'ruby-on-rails'] },
    { name: 'Laravel', primaryDomainId: '', aliases: ['laravel'] },

    // Databases
    { name: 'PostgreSQL', primaryDomainId: '', aliases: ['postgres', 'postgresql', 'psql'] },
    { name: 'MySQL', primaryDomainId: '', aliases: ['mysql'] },
    { name: 'MongoDB', primaryDomainId: '', aliases: ['mongo', 'mongodb'] },
    { name: 'Redis', primaryDomainId: '', aliases: ['redis'] },
    { name: 'SQLite', primaryDomainId: '', aliases: ['sqlite'] },
    { name: 'Cassandra', primaryDomainId: '', aliases: ['cassandra'] },
    { name: 'DynamoDB', primaryDomainId: '', aliases: ['dynamodb', 'dynamo'] },
    { name: 'Firebase', primaryDomainId: '', aliases: ['firebase'] },

    // DevOps & Tools
    { name: 'Docker', primaryDomainId: '', aliases: ['docker'] },
    { name: 'Kubernetes', primaryDomainId: '', aliases: ['k8s', 'kubernetes', 'kube'] },
    { name: 'Git', primaryDomainId: '', aliases: ['git'] },
    { name: 'GitHub', primaryDomainId: '', aliases: ['github'] },
    { name: 'GitHub Actions', primaryDomainId: '', aliases: ['github-actions', 'githubactions'] },
    { name: 'GitLab CI', primaryDomainId: '', aliases: ['gitlab', 'gitlab-ci'] },
    { name: 'Jenkins', primaryDomainId: '', aliases: ['jenkins'] },
    { name: 'Terraform', primaryDomainId: '', aliases: ['terraform'] },
    { name: 'Ansible', primaryDomainId: '', aliases: ['ansible'] },

    // Cloud Platforms
    { name: 'AWS', primaryDomainId: '', aliases: ['aws', 'amazon-web-services'] },
    { name: 'Google Cloud', primaryDomainId: '', aliases: ['gcp', 'google-cloud', 'googlecloud'] },
    { name: 'Azure', primaryDomainId: '', aliases: ['azure', 'microsoft-azure'] },
    { name: 'Vercel', primaryDomainId: '', aliases: ['vercel'] },
    { name: 'Netlify', primaryDomainId: '', aliases: ['netlify'] },
    { name: 'Heroku', primaryDomainId: '', aliases: ['heroku'] },

    // Mobile Development
    { name: 'React Native', primaryDomainId: '', aliases: ['react-native', 'reactnative', 'rn'] },
    { name: 'Flutter', primaryDomainId: '', aliases: ['flutter'] },
    { name: 'iOS Development', primaryDomainId: '', aliases: ['ios', 'swift', 'objective-c'] },
    { name: 'Android Development', primaryDomainId: '', aliases: ['android'] },

    // Blockchain
    { name: 'Ethereum', primaryDomainId: '', aliases: ['ethereum', 'eth'] },
    { name: 'Smart Contracts', primaryDomainId: '', aliases: ['smart-contracts', 'smartcontracts'] },
    { name: 'Web3', primaryDomainId: '', aliases: ['web3', 'web3.js'] },
    { name: 'Hardhat', primaryDomainId: '', aliases: ['hardhat'] },
    { name: 'Truffle', primaryDomainId: '', aliases: ['truffle'] },
    { name: 'IPFS', primaryDomainId: '', aliases: ['ipfs'] },

    // AI/ML
    { name: 'Machine Learning', primaryDomainId: '', aliases: ['ml', 'machine-learning', 'machinelearning'] },
    { name: 'Deep Learning', primaryDomainId: '', aliases: ['dl', 'deep-learning', 'deeplearning'] },
    { name: 'TensorFlow', primaryDomainId: '', aliases: ['tensorflow', 'tf'] },
    { name: 'PyTorch', primaryDomainId: '', aliases: ['pytorch', 'torch'] },
    { name: 'scikit-learn', primaryDomainId: '', aliases: ['sklearn', 'scikit-learn', 'scikitlearn'] },
    { name: 'Natural Language Processing', primaryDomainId: '', aliases: ['nlp', 'natural-language-processing'] },
    { name: 'Computer Vision', primaryDomainId: '', aliases: ['cv', 'computer-vision', 'computervision'] },

    // Design
    { name: 'UI/UX Design', primaryDomainId: '', aliases: ['ui', 'ux', 'uiux', 'ui-ux', 'design'] },
    { name: 'Figma', primaryDomainId: '', aliases: ['figma'] },
    { name: 'Adobe XD', primaryDomainId: '', aliases: ['xd', 'adobe-xd', 'adobexd'] },
    { name: 'Sketch', primaryDomainId: '', aliases: ['sketch'] },
    { name: 'Photoshop', primaryDomainId: '', aliases: ['photoshop', 'ps'] },

    // Soft Skills
    { name: 'Leadership', primaryDomainId: '', aliases: ['leadership', 'leader'] },
    { name: 'Communication', primaryDomainId: '', aliases: ['communication'] },
    { name: 'Collaboration', primaryDomainId: '', aliases: ['collaboration', 'teamwork'] },
    { name: 'Problem Solving', primaryDomainId: '', aliases: ['problem-solving', 'problemsolving'] },
    { name: 'Project Management', primaryDomainId: '', aliases: ['pm', 'project-management', 'projectmanagement'] },

    // Other
    { name: 'REST API', primaryDomainId: '', aliases: ['rest', 'restapi', 'rest-api'] },
    { name: 'GraphQL', primaryDomainId: '', aliases: ['graphql', 'gql'] },
    { name: 'WebSockets', primaryDomainId: '', aliases: ['websockets', 'websocket', 'ws'] },
    { name: 'Microservices', primaryDomainId: '', aliases: ['microservices', 'micro-services'] },
    { name: 'SEO', primaryDomainId: '', aliases: ['seo', 'search-engine-optimization'] },
    { name: 'Testing', primaryDomainId: '', aliases: ['testing', 'qa'] },
    { name: 'Jest', primaryDomainId: '', aliases: ['jest'] },
    { name: 'Cypress', primaryDomainId: '', aliases: ['cypress'] },
    { name: 'Linux', primaryDomainId: '', aliases: ['linux', 'unix'] },
    { name: 'TCP/IP', primaryDomainId: '', aliases: ['tcp', 'tcpip', 'tcp-ip', 'networking'] },
    { name: 'JWT', primaryDomainId: '', aliases: ['jwt', 'json-web-token'] },
];

async function seedCanonicalSkills() {
    console.log('🌱 Starting canonical skills seeding...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const canonicalSkillService = app.get(CanonicalSkillService);

    let created = 0;
    let skipped = 0;

    for (const skillSeed of CANONICAL_SKILLS) {
        try {
            const existing = await canonicalSkillService.findOrCreateCanonicalSkill(
                skillSeed.name,
                skillSeed.primaryDomainId || undefined,
            );

            if (existing) {
                console.log(`✅ ${skillSeed.name} (${skillSeed.primaryDomainId})`);
                created++;

                // Create aliases if provided
                if (skillSeed.aliases && skillSeed.aliases.length > 0) {
                    // Aliases are automatically created by the service
                }
            }
        } catch (error) {
            console.log(`❌ Failed to create ${skillSeed.name}: ${error.message}`);
            skipped++;
        }
    }

    console.log(`\n📊 Seeding Results:`);
    console.log(`   ✅ Created/Updated: ${created}`);
    console.log(`   ❌ Skipped: ${skipped}`);
    console.log(`\n✨ Seeding complete!\n`);

    await app.close();
}

seedCanonicalSkills()
    .then(() => {
        console.log('👋 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
