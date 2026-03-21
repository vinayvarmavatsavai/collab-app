import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from './matching/entities/domain.entity';
import { CanonicalSkill } from './matching/entities/canonical-skill.entity';
import { ProfessionalRole } from './matching/entities/professional-role.entity';
import { EmbeddingService } from './matching/services/embedding.service';

const PRIMARY_DOMAINS = [
    { name: 'Frontend', normalized: 'frontend', desc: 'Client-side web development.' },
    { name: 'Backend', normalized: 'backend', desc: 'Server-side API and business logic.' },
    { name: 'DevOps & Cloud', normalized: 'devopscloud', desc: 'Infrastructure, deployment, networking.' },
    { name: 'Data & Analytics', normalized: 'dataanalytics', desc: 'Databases, data warehousing, BI.' },
    { name: 'AI & Machine Learning', normalized: 'aimachinelearning', desc: 'Artificial intelligence modeling.' },
    { name: 'Mobile', normalized: 'mobile', desc: 'iOS and Android application development.' },
    { name: 'Security', normalized: 'security', desc: 'Cybersecurity and penetration testing.' },
    { name: 'Design (UI/UX)', normalized: 'designuiux', desc: 'User interface and experience design.' },
    { name: 'Product & Business', normalized: 'productbusiness', desc: 'Product management and marketing.' },
    { name: 'Hardware & Systems', normalized: 'hardwaresystems', desc: 'Low level embedded systems.' }
];

const SKILLS_BY_DOMAIN = {
    'frontend': ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap'],
    'backend': ['Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Node.js', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'GraphQL', 'REST API'],
    'dataanalytics': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Data Analysis'],
    'devopscloud': ['Docker', 'Kubernetes', 'Git', 'GitHub Actions', 'Linux', 'AWS', 'Google Cloud'],
    'aimachinelearning': ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Natural Language Processing', 'Computer Vision'],
    'mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Dart'],
    'designuiux': ['Figma', 'Adobe Photoshop', 'UI Design', 'UX Design', 'Product Design', 'Interaction Design'],
    'productbusiness': ['Product Management', 'Agile Methodologies', 'Scrum', 'Business Analysis', 'Search Engine Optimization', 'Digital Marketing'],
    'security': ['Cybersecurity', 'Penetration Testing', 'Network Security']
};

const ROLES_BY_DOMAIN = {
    'frontend': ['Frontend Developer'],
    'backend': ['Backend Developer', 'Full Stack Developer'],
    'devopscloud': ['DevOps Engineer', 'Cloud Architect'],
    'dataanalytics': ['Data Scientist'],
    'aimachinelearning': ['Machine Learning Engineer'],
    'mobile': ['Mobile Developer'],
    'security': ['Security Engineer'],
    'designuiux': ['UI/UX Designer'],
    'productbusiness': ['Product Manager'],
    'hardwaresystems': ['Hardware Engineer']
};

async function bootstrapSeed() {
    console.log('🚀 Initializing NestJS Seeder Context...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const domainRepo: Repository<Domain> = app.get(getRepositoryToken(Domain));
    const skillRepo: Repository<CanonicalSkill> = app.get(getRepositoryToken(CanonicalSkill));
    const roleRepo: Repository<ProfessionalRole> = app.get(getRepositoryToken(ProfessionalRole));
    const embeddingService: EmbeddingService = app.get(EmbeddingService);

    console.log('\n--- 1. SEEDING DOMAINS ---');
    for (const d of PRIMARY_DOMAINS) {
        console.log(`Generating embedding for domain: ${d.name}...`);
        const textToEmbed = `Domain: ${d.name}. ${d.desc}`;
        const embedding = await embeddingService.generateEmbedding(textToEmbed) || [];

        const domainGroup = domainRepo.create({
            name: d.name,
            normalizedName: d.normalized,
            description: d.desc,
            embedding,
            isVerified: true,
            usageCount: 1000
        });

        await domainRepo.upsert(domainGroup, ['normalizedName']);
    }

    console.log('\n--- 2. SEEDING ROLES ---');
    for (const [domainNorm, roles] of Object.entries(ROLES_BY_DOMAIN)) {
        const domain = await domainRepo.findOne({ where: { normalizedName: domainNorm } });
        if (!domain) continue;

        for (const roleName of roles) {
            console.log(`Generating embedding for role: ${roleName}...`);
            const norm = roleName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const embedding = await embeddingService.generateEmbedding(`Professional Role: ${roleName}. Primary Domain: ${domain.name}`) || [];

            const r = roleRepo.create({
                name: roleName,
                normalizedName: norm,
                primaryDomainId: domain.id,
                embedding,
                isVerified: true,
                usageCount: 500
            });
            await roleRepo.upsert(r, ['normalizedName']);
        }
    }

    console.log('\n--- 3. SEEDING SKILLS ---');
    for (const [domainNorm, skills] of Object.entries(SKILLS_BY_DOMAIN)) {
        const domain = await domainRepo.findOne({ where: { normalizedName: domainNorm } });
        if (!domain) continue;

        for (const skillName of skills) {
            console.log(`Generating embedding for skill: ${skillName}...`);
            const norm = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const embedding = await embeddingService.generateEmbedding(`Technical Skill: ${skillName}. Primary Domain: ${domain.name}`) || [];

            const s = skillRepo.create({
                name: skillName,
                normalizedName: norm,
                primaryDomainId: domain.id,
                embedding,
                isVerified: true,
                usageCount: 500
            });
            await skillRepo.upsert(s, ['normalizedName']);
        }
    }

    console.log('\n✅ Seeding complete.');
    await app.close();
}

bootstrapSeed().catch(err => {
    console.error('Seeding failed', err);
    process.exit(1);
});
