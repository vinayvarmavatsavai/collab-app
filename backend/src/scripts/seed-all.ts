/**
 * seed-all.ts
 *
 * Full reset + reseed + embed script for development.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed-all.ts
 *
 * What it does:
 *  1. TRUNCATES all matching-related tables (cascade)
 *  2. Seeds canonical_skills, professional_roles, domains
 *  3. Generates Ollama nomic-embed-text embeddings for every row
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Seed data (mirrored from the existing seed scripts)
// ---------------------------------------------------------------------------

const SKILLS: { name: string; normalizedName: string; category: string }[] = [
    // Programming Languages
    { name: 'JavaScript', normalizedName: 'javascript', category: 'programming_language' },
    { name: 'TypeScript', normalizedName: 'typescript', category: 'programming_language' },
    { name: 'Python', normalizedName: 'python', category: 'programming_language' },
    { name: 'Java', normalizedName: 'java', category: 'programming_language' },
    { name: 'C++', normalizedName: 'c++', category: 'programming_language' },
    { name: 'C', normalizedName: 'c', category: 'programming_language' },
    { name: 'C#', normalizedName: 'c#', category: 'programming_language' },
    { name: 'Go', normalizedName: 'go', category: 'programming_language' },
    { name: 'Rust', normalizedName: 'rust', category: 'programming_language' },
    { name: 'Ruby', normalizedName: 'ruby', category: 'programming_language' },
    { name: 'PHP', normalizedName: 'php', category: 'programming_language' },
    { name: 'Swift', normalizedName: 'swift', category: 'programming_language' },
    { name: 'Kotlin', normalizedName: 'kotlin', category: 'programming_language' },
    { name: 'Dart', normalizedName: 'dart', category: 'programming_language' },
    { name: 'Solidity', normalizedName: 'solidity', category: 'blockchain' },
    // Frontend
    { name: 'React', normalizedName: 'react', category: 'frontend' },
    { name: 'Next.js', normalizedName: 'next.js', category: 'frontend' },
    { name: 'Vue.js', normalizedName: 'vue.js', category: 'frontend' },
    { name: 'Angular', normalizedName: 'angular', category: 'frontend' },
    { name: 'Svelte', normalizedName: 'svelte', category: 'frontend' },
    { name: 'Solid.js', normalizedName: 'solid.js', category: 'frontend' },
    // Backend
    { name: 'Node.js', normalizedName: 'node.js', category: 'backend' },
    { name: 'Express', normalizedName: 'express', category: 'backend' },
    { name: 'NestJS', normalizedName: 'nestjs', category: 'backend' },
    { name: 'Django', normalizedName: 'django', category: 'backend' },
    { name: 'Flask', normalizedName: 'flask', category: 'backend' },
    { name: 'FastAPI', normalizedName: 'fastapi', category: 'backend' },
    { name: 'Spring Boot', normalizedName: 'springboot', category: 'backend' },
    { name: 'Ruby on Rails', normalizedName: 'rubyonrails', category: 'backend' },
    { name: 'Laravel', normalizedName: 'laravel', category: 'backend' },
    // Databases
    { name: 'PostgreSQL', normalizedName: 'postgresql', category: 'database' },
    { name: 'MySQL', normalizedName: 'mysql', category: 'database' },
    { name: 'MongoDB', normalizedName: 'mongodb', category: 'database' },
    { name: 'Redis', normalizedName: 'redis', category: 'database' },
    { name: 'SQLite', normalizedName: 'sqlite', category: 'database' },
    { name: 'Cassandra', normalizedName: 'cassandra', category: 'database' },
    { name: 'DynamoDB', normalizedName: 'dynamodb', category: 'database' },
    { name: 'Firebase', normalizedName: 'firebase', category: 'database' },
    // DevOps
    { name: 'Docker', normalizedName: 'docker', category: 'devops' },
    { name: 'Kubernetes', normalizedName: 'kubernetes', category: 'devops' },
    { name: 'Git', normalizedName: 'git', category: 'devops' },
    { name: 'GitHub', normalizedName: 'github', category: 'devops' },
    { name: 'GitHub Actions', normalizedName: 'githubactions', category: 'devops' },
    { name: 'GitLab CI', normalizedName: 'gitlabci', category: 'devops' },
    { name: 'Jenkins', normalizedName: 'jenkins', category: 'devops' },
    { name: 'Terraform', normalizedName: 'terraform', category: 'devops' },
    { name: 'Ansible', normalizedName: 'ansible', category: 'devops' },
    // Cloud
    { name: 'AWS', normalizedName: 'aws', category: 'cloud' },
    { name: 'Google Cloud', normalizedName: 'googlecloud', category: 'cloud' },
    { name: 'Azure', normalizedName: 'azure', category: 'cloud' },
    { name: 'Vercel', normalizedName: 'vercel', category: 'cloud' },
    { name: 'Netlify', normalizedName: 'netlify', category: 'cloud' },
    { name: 'Heroku', normalizedName: 'heroku', category: 'cloud' },
    // Mobile
    { name: 'React Native', normalizedName: 'reactnative', category: 'mobile' },
    { name: 'Flutter', normalizedName: 'flutter', category: 'mobile' },
    { name: 'iOS Development', normalizedName: 'iosdevelopment', category: 'mobile' },
    { name: 'Android Development', normalizedName: 'androiddevelopment', category: 'mobile' },
    // Blockchain
    { name: 'Ethereum', normalizedName: 'ethereum', category: 'blockchain' },
    { name: 'Smart Contracts', normalizedName: 'smartcontracts', category: 'blockchain' },
    { name: 'Web3', normalizedName: 'web3', category: 'blockchain' },
    { name: 'Hardhat', normalizedName: 'hardhat', category: 'blockchain' },
    { name: 'Truffle', normalizedName: 'truffle', category: 'blockchain' },
    { name: 'IPFS', normalizedName: 'ipfs', category: 'blockchain' },
    // AI/ML
    { name: 'Machine Learning', normalizedName: 'machinelearning', category: 'ai_ml' },
    { name: 'Deep Learning', normalizedName: 'deeplearning', category: 'ai_ml' },
    { name: 'TensorFlow', normalizedName: 'tensorflow', category: 'ai_ml' },
    { name: 'PyTorch', normalizedName: 'pytorch', category: 'ai_ml' },
    { name: 'scikit-learn', normalizedName: 'scikit-learn', category: 'ai_ml' },
    { name: 'Natural Language Processing', normalizedName: 'naturallanguageprocessing', category: 'ai_ml' },
    { name: 'Computer Vision', normalizedName: 'computervision', category: 'ai_ml' },
    // Design
    { name: 'UI/UX Design', normalizedName: 'ui/uxdesign', category: 'design' },
    { name: 'Figma', normalizedName: 'figma', category: 'design' },
    { name: 'Adobe XD', normalizedName: 'adobexd', category: 'design' },
    { name: 'Sketch', normalizedName: 'sketch', category: 'design' },
    { name: 'Photoshop', normalizedName: 'photoshop', category: 'design' },
    // Soft Skills
    { name: 'Leadership', normalizedName: 'leadership', category: 'soft_skill' },
    { name: 'Communication', normalizedName: 'communication', category: 'soft_skill' },
    { name: 'Collaboration', normalizedName: 'collaboration', category: 'soft_skill' },
    { name: 'Problem Solving', normalizedName: 'problemsolving', category: 'soft_skill' },
    { name: 'Project Management', normalizedName: 'projectmanagement', category: 'soft_skill' },
    // Other
    { name: 'REST API', normalizedName: 'restapi', category: 'other' },
    { name: 'GraphQL', normalizedName: 'graphql', category: 'other' },
    { name: 'WebSockets', normalizedName: 'websockets', category: 'other' },
    { name: 'Microservices', normalizedName: 'microservices', category: 'other' },
    { name: 'SEO', normalizedName: 'seo', category: 'other' },
    { name: 'Testing', normalizedName: 'testing', category: 'other' },
    { name: 'Jest', normalizedName: 'jest', category: 'other' },
    { name: 'Cypress', normalizedName: 'cypress', category: 'other' },
    { name: 'Linux', normalizedName: 'linux', category: 'other' },
    { name: 'TCP/IP', normalizedName: 'tcp/ip', category: 'other' },
    { name: 'JWT', normalizedName: 'jwt', category: 'other' },
];

const ROLES: { name: string; normalizedName: string; category: string }[] = [
    { name: 'Frontend Developer', normalizedName: 'frontenddeveloper', category: 'engineering' },
    { name: 'Backend Developer', normalizedName: 'backenddeveloper', category: 'engineering' },
    { name: 'Full Stack Developer', normalizedName: 'fullstackdeveloper', category: 'engineering' },
    { name: 'DevOps Engineer', normalizedName: 'devopsengineer', category: 'engineering' },
    { name: 'Mobile Developer', normalizedName: 'mobiledeveloper', category: 'engineering' },
    { name: 'Data Scientist', normalizedName: 'datascientist', category: 'engineering' },
    { name: 'Machine Learning Engineer', normalizedName: 'machinelearningengineer', category: 'engineering' },
    { name: 'Software Architect', normalizedName: 'softwarearchitect', category: 'engineering' },
    { name: 'QA Engineer', normalizedName: 'qaengineer', category: 'engineering' },
    { name: 'Security Engineer', normalizedName: 'securityengineer', category: 'engineering' },
    { name: 'Blockchain Developer', normalizedName: 'blockchaindeveloper', category: 'engineering' },
    { name: 'Game Developer', normalizedName: 'gamedeveloper', category: 'engineering' },
    { name: 'Embedded Systems Engineer', normalizedName: 'embeddedsystemsengineer', category: 'engineering' },
    { name: 'Site Reliability Engineer', normalizedName: 'sitereliabilityengineer', category: 'engineering' },
    { name: 'UI/UX Designer', normalizedName: 'ui/uxdesigner', category: 'design' },
    { name: 'Product Designer', normalizedName: 'productdesigner', category: 'design' },
    { name: 'Graphic Designer', normalizedName: 'graphicdesigner', category: 'design' },
    { name: 'Visual Designer', normalizedName: 'visualdesigner', category: 'design' },
    { name: 'Interaction Designer', normalizedName: 'interactiondesigner', category: 'design' },
    { name: 'Product Manager', normalizedName: 'productmanager', category: 'product' },
    { name: 'Project Manager', normalizedName: 'projectmanager', category: 'product' },
    { name: 'Scrum Master', normalizedName: 'scrummaster', category: 'product' },
    { name: 'Product Owner', normalizedName: 'productowner', category: 'product' },
    { name: 'Digital Marketer', normalizedName: 'digitalmarketer', category: 'marketing' },
    { name: 'Content Strategist', normalizedName: 'contentstrategist', category: 'marketing' },
    { name: 'SEO Specialist', normalizedName: 'seospecialist', category: 'marketing' },
    { name: 'Social Media Manager', normalizedName: 'socialmediamanager', category: 'marketing' },
    { name: 'Growth Hacker', normalizedName: 'growthhacker', category: 'marketing' },
    { name: 'Sales Representative', normalizedName: 'salesrepresentative', category: 'sales' },
    { name: 'Account Executive', normalizedName: 'accountexecutive', category: 'sales' },
    { name: 'Sales Manager', normalizedName: 'salesmanager', category: 'sales' },
    { name: 'Business Development Manager', normalizedName: 'businessdevelopmentmanager', category: 'sales' },
    { name: 'Financial Analyst', normalizedName: 'financialanalyst', category: 'finance' },
    { name: 'Accountant', normalizedName: 'accountant', category: 'finance' },
    { name: 'Investment Banker', normalizedName: 'investmentbanker', category: 'finance' },
    { name: 'Chief Financial Officer', normalizedName: 'chieffinancialofficer', category: 'finance' },
    { name: 'Operations Manager', normalizedName: 'operationsmanager', category: 'operations' },
    { name: 'Supply Chain Manager', normalizedName: 'supplychainmanager', category: 'operations' },
    { name: 'Logistics Coordinator', normalizedName: 'logisticscoordinator', category: 'operations' },
    { name: 'HR Manager', normalizedName: 'hrmanager', category: 'hr' },
    { name: 'Recruiter', normalizedName: 'recruiter', category: 'hr' },
    { name: 'Talent Acquisition Specialist', normalizedName: 'talentacquisitionspecialist', category: 'hr' },
    { name: 'Legal Counsel', normalizedName: 'legalcounsel', category: 'legal' },
    { name: 'Corporate Lawyer', normalizedName: 'corporatelawyer', category: 'legal' },
    { name: 'Chief Executive Officer', normalizedName: 'chiefexecutiveofficer', category: 'executive' },
    { name: 'Chief Technology Officer', normalizedName: 'chieftechnologyofficer', category: 'executive' },
    { name: 'Chief Operating Officer', normalizedName: 'chiefoperatingofficer', category: 'executive' },
    { name: 'Founder', normalizedName: 'founder', category: 'executive' },
];

const DOMAINS: { name: string; normalizedName: string; category: string }[] = [
    { name: 'FinTech', normalizedName: 'fintech', category: 'sector' },
    { name: 'HealthTech', normalizedName: 'healthtech', category: 'sector' },
    { name: 'EdTech', normalizedName: 'edtech', category: 'sector' },
    { name: 'E-commerce', normalizedName: 'e-commerce', category: 'sector' },
    { name: 'SaaS', normalizedName: 'saas', category: 'sector' },
    { name: 'Cybersecurity', normalizedName: 'cybersecurity', category: 'sector' },
    { name: 'Blockchain & Web3', normalizedName: 'blockchain&web3', category: 'sector' },
    { name: 'Artificial Intelligence', normalizedName: 'artificialintelligence', category: 'sector' },
    { name: 'Internet of Things (IoT)', normalizedName: 'internetofthings(iot)', category: 'sector' },
    { name: 'Robotics', normalizedName: 'robotics', category: 'sector' },
    { name: 'Biotech', normalizedName: 'biotech', category: 'sector' },
    { name: 'CleanTech', normalizedName: 'cleantech', category: 'sector' },
    { name: 'AgriTech', normalizedName: 'agritech', category: 'sector' },
    { name: 'AdTech', normalizedName: 'adtech', category: 'sector' },
    { name: 'Gaming', normalizedName: 'gaming', category: 'sector' },
    { name: 'Media & Entertainment', normalizedName: 'media&entertainment', category: 'sector' },
    { name: 'Real Estate', normalizedName: 'realestate', category: 'sector' },
    { name: 'Logistics & Supply Chain', normalizedName: 'logistics&supplychain', category: 'sector' },
    { name: 'Automotive', normalizedName: 'automotive', category: 'sector' },
    { name: 'Aerospace', normalizedName: 'aerospace', category: 'sector' },
    { name: 'Energy', normalizedName: 'energy', category: 'sector' },
    { name: 'Oil & Gas', normalizedName: 'oil&gas', category: 'sector' },
    { name: 'Telecommunications', normalizedName: 'telecommunications', category: 'sector' },
    { name: 'Travel & Hospitality', normalizedName: 'travel&hospitality', category: 'sector' },
    { name: 'LegalTech', normalizedName: 'legaltech', category: 'sector' },
    { name: 'InsurTech', normalizedName: 'insurtech', category: 'sector' },
    { name: 'PropTech', normalizedName: 'proptech', category: 'sector' },
    { name: 'GovTech', normalizedName: 'govtech', category: 'sector' },
    { name: 'Non-profit', normalizedName: 'non-profit', category: 'sector' },
    { name: 'Consulting', normalizedName: 'consulting', category: 'sector' },
    { name: 'Web Development', normalizedName: 'webdevelopment', category: 'topic' },
    { name: 'Mobile App Development', normalizedName: 'mobileappdevelopment', category: 'topic' },
    { name: 'Data Analysis', normalizedName: 'dataanalysis', category: 'topic' },
    { name: 'Cloud Computing', normalizedName: 'cloudcomputing', category: 'topic' },
    { name: 'Digital Marketing', normalizedName: 'digitalmarketing', category: 'topic' },
];

// ---------------------------------------------------------------------------
// Ollama helper
// ---------------------------------------------------------------------------

async function generateEmbedding(text: string, ollamaUrl: string, model: string): Promise<number[] | null> {
    try {
        const res = await fetch(`${ollamaUrl}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt: text }),
        });
        if (!res.ok) {
            console.error(`  Ollama error ${res.status}:`, await res.text());
            return null;
        }
        const data = await res.json() as any;
        return data.embedding ?? null;
    } catch (e: any) {
        console.error(`  Embedding fetch failed: ${e.message}`);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

    console.log(`\n🚀  seed-all  (Ollama: ${ollamaUrl}, model: ${ollamaModel})\n`);

    // Build TypeORM DataSource from env
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || process.env.DB_DATABASE || 'startup101',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    await ds.initialize();
    console.log('✅  Database connected\n');

    // ----------------------------------------------------------------
    // 1. TRUNCATE (order matters for FKs — reverse dependency)
    // ----------------------------------------------------------------
    console.log('🗑️  Clearing tables (TRUNCATE ... CASCADE)...');
    await ds.query(`
        TRUNCATE TABLE
            project_interests,
            project_notifications,
            project_required_skills,
            project_optional_skills,
            project_required_roles,
            project_required_domains,
            project_requests,
            user_skills,
            user_roles,
            user_domains,
            user_profile_vectors,
            milestone_vectors,
            skill_review_queue,
            role_review_queue,
            domain_review_queue,
            skill_aliases,
            role_aliases,
            domain_aliases,
            canonical_skills,
            professional_roles,
            domains
        CASCADE
    `);
    console.log('   ✅  All tables cleared\n');

    // ----------------------------------------------------------------
    // 2. SEED + EMBED canonical_skills
    // ----------------------------------------------------------------
    console.log(`📦  Seeding ${SKILLS.length} canonical skills...`);
    let skillEmbedded = 0;

    for (const s of SKILLS) {
        const embText = `${s.name} ${s.category}`;
        const embedding = await generateEmbedding(embText, ollamaUrl, ollamaModel);
        const embeddingLiteral = embedding ? `'[${embedding.join(',')}]'::vector` : 'NULL';

        await ds.query(`
            INSERT INTO canonical_skills
                (name, normalized_name, category, confidence_level, is_verified, source, usage_count, embedding)
            VALUES
                ($1, $2, $3, 'high', true, 'seed', 0, ${embeddingLiteral})
            ON CONFLICT (normalized_name) DO UPDATE
                SET embedding = EXCLUDED.embedding,
                    is_verified = true,
                    confidence_level = 'high',
                    source = 'seed'
        `, [s.name, s.normalizedName, s.category]);

        if (embedding) {
            skillEmbedded++;
            process.stdout.write(`   ✅  ${s.name}\n`);
        } else {
            process.stdout.write(`   ⚠️   ${s.name} (no embedding)\n`);
        }
    }
    console.log(`\n   📊  Skills embedded: ${skillEmbedded}/${SKILLS.length}\n`);

    // ----------------------------------------------------------------
    // 3. SEED + EMBED professional_roles
    // ----------------------------------------------------------------
    console.log(`📦  Seeding ${ROLES.length} professional roles...`);
    let roleEmbedded = 0;

    for (const r of ROLES) {
        const embText = `${r.name} ${r.category}`;
        const embedding = await generateEmbedding(embText, ollamaUrl, ollamaModel);
        const embeddingLiteral = embedding ? `'[${embedding.join(',')}]'::vector` : 'NULL';

        await ds.query(`
            INSERT INTO professional_roles
                (name, normalized_name, category, confidence_level, is_verified, source, usage_count, embedding)
            VALUES
                ($1, $2, $3, 'high', true, 'seed', 0, ${embeddingLiteral})
            ON CONFLICT (normalized_name) DO UPDATE
                SET embedding = EXCLUDED.embedding,
                    is_verified = true,
                    confidence_level = 'high',
                    source = 'seed'
        `, [r.name, r.normalizedName, r.category]);

        if (embedding) {
            roleEmbedded++;
            process.stdout.write(`   ✅  ${r.name}\n`);
        } else {
            process.stdout.write(`   ⚠️   ${r.name} (no embedding)\n`);
        }
    }
    console.log(`\n   📊  Roles embedded: ${roleEmbedded}/${ROLES.length}\n`);

    // ----------------------------------------------------------------
    // 4. SEED + EMBED domains
    // ----------------------------------------------------------------
    console.log(`📦  Seeding ${DOMAINS.length} domains...`);
    let domainEmbedded = 0;

    for (const d of DOMAINS) {
        const embText = `${d.name} ${d.category}`;
        const embedding = await generateEmbedding(embText, ollamaUrl, ollamaModel);
        const embeddingLiteral = embedding ? `'[${embedding.join(',')}]'::vector` : 'NULL';

        await ds.query(`
            INSERT INTO domains
                (name, normalized_name, category, confidence_level, is_verified, source, usage_count, embedding)
            VALUES
                ($1, $2, $3, 'high', true, 'seed', 0, ${embeddingLiteral})
            ON CONFLICT (normalized_name) DO UPDATE
                SET embedding = EXCLUDED.embedding,
                    is_verified = true,
                    confidence_level = 'high',
                    source = 'seed'
        `, [d.name, d.normalizedName, d.category]);

        if (embedding) {
            domainEmbedded++;
            process.stdout.write(`   ✅  ${d.name}\n`);
        } else {
            process.stdout.write(`   ⚠️   ${d.name} (no embedding)\n`);
        }
    }
    console.log(`\n   📊  Domains embedded: ${domainEmbedded}/${DOMAINS.length}\n`);

    // ----------------------------------------------------------------
    // 5. HNSW indexes (idempotent)
    // ----------------------------------------------------------------
    console.log('🔧  Ensuring HNSW indexes exist...');
    const indexes = [
        {
            name: 'idx_canonical_skills_embedding_hnsw',
            table: 'canonical_skills',
        },
        {
            name: 'idx_domains_embedding_hnsw',
            table: 'domains',
        },
        {
            name: 'idx_professional_roles_embedding_hnsw',
            table: 'professional_roles',
        },
        {
            name: 'idx_user_profile_vectors_embedding_hnsw',
            table: 'user_profile_vectors',
        },
    ];

    for (const idx of indexes) {
        try {
            await ds.query(`
                CREATE INDEX IF NOT EXISTS ${idx.name}
                ON ${idx.table} USING hnsw (embedding vector_cosine_ops)
            `);
            console.log(`   ✅  ${idx.name}`);
        } catch (e: any) {
            console.log(`   ⚠️   ${idx.name}: ${e.message}`);
        }
    }

    // ----------------------------------------------------------------
    // Summary
    // ----------------------------------------------------------------
    console.log('\n✨  DONE\n');
    console.log(`   Skills:  ${skillEmbedded}/${SKILLS.length} embedded`);
    console.log(`   Roles:   ${roleEmbedded}/${ROLES.length} embedded`);
    console.log(`   Domains: ${domainEmbedded}/${DOMAINS.length} embedded`);
    console.log();

    await ds.destroy();
}

main().catch((e) => {
    console.error('💥  Fatal error:', e);
    process.exit(1);
});
