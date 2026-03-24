/**
 * seed-all.ts
 *
 * Development skill seeder.
 * Current goal: unblock canonical_skills so user skills can be added.
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-all.ts
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

const SKILLS: { name: string; normalizedName: string; category: string }[] = [
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
  { name: 'React', normalizedName: 'react', category: 'frontend' },
  { name: 'Next.js', normalizedName: 'next.js', category: 'frontend' },
  { name: 'Vue.js', normalizedName: 'vue.js', category: 'frontend' },
  { name: 'Angular', normalizedName: 'angular', category: 'frontend' },
  { name: 'Svelte', normalizedName: 'svelte', category: 'frontend' },
  { name: 'Solid.js', normalizedName: 'solid.js', category: 'frontend' },
  { name: 'Node.js', normalizedName: 'node.js', category: 'backend' },
  { name: 'Express', normalizedName: 'express', category: 'backend' },
  { name: 'NestJS', normalizedName: 'nestjs', category: 'backend' },
  { name: 'Django', normalizedName: 'django', category: 'backend' },
  { name: 'Flask', normalizedName: 'flask', category: 'backend' },
  { name: 'FastAPI', normalizedName: 'fastapi', category: 'backend' },
  { name: 'Spring Boot', normalizedName: 'springboot', category: 'backend' },
  { name: 'Ruby on Rails', normalizedName: 'rubyonrails', category: 'backend' },
  { name: 'Laravel', normalizedName: 'laravel', category: 'backend' },
  { name: 'PostgreSQL', normalizedName: 'postgresql', category: 'database' },
  { name: 'MySQL', normalizedName: 'mysql', category: 'database' },
  { name: 'MongoDB', normalizedName: 'mongodb', category: 'database' },
  { name: 'Redis', normalizedName: 'redis', category: 'database' },
  { name: 'SQLite', normalizedName: 'sqlite', category: 'database' },
  { name: 'Cassandra', normalizedName: 'cassandra', category: 'database' },
  { name: 'DynamoDB', normalizedName: 'dynamodb', category: 'database' },
  { name: 'Firebase', normalizedName: 'firebase', category: 'database' },
  { name: 'Docker', normalizedName: 'docker', category: 'devops' },
  { name: 'Kubernetes', normalizedName: 'kubernetes', category: 'devops' },
  { name: 'Git', normalizedName: 'git', category: 'devops' },
  { name: 'GitHub', normalizedName: 'github', category: 'devops' },
  { name: 'GitHub Actions', normalizedName: 'githubactions', category: 'devops' },
  { name: 'GitLab CI', normalizedName: 'gitlabci', category: 'devops' },
  { name: 'Jenkins', normalizedName: 'jenkins', category: 'devops' },
  { name: 'Terraform', normalizedName: 'terraform', category: 'devops' },
  { name: 'Ansible', normalizedName: 'ansible', category: 'devops' },
  { name: 'AWS', normalizedName: 'aws', category: 'cloud' },
  { name: 'Google Cloud', normalizedName: 'googlecloud', category: 'cloud' },
  { name: 'Azure', normalizedName: 'azure', category: 'cloud' },
  { name: 'Vercel', normalizedName: 'vercel', category: 'cloud' },
  { name: 'Netlify', normalizedName: 'netlify', category: 'cloud' },
  { name: 'Heroku', normalizedName: 'heroku', category: 'cloud' },
  { name: 'React Native', normalizedName: 'reactnative', category: 'mobile' },
  { name: 'Flutter', normalizedName: 'flutter', category: 'mobile' },
  { name: 'iOS Development', normalizedName: 'iosdevelopment', category: 'mobile' },
  { name: 'Android Development', normalizedName: 'androiddevelopment', category: 'mobile' },
  { name: 'Ethereum', normalizedName: 'ethereum', category: 'blockchain' },
  { name: 'Smart Contracts', normalizedName: 'smartcontracts', category: 'blockchain' },
  { name: 'Web3', normalizedName: 'web3', category: 'blockchain' },
  { name: 'Hardhat', normalizedName: 'hardhat', category: 'blockchain' },
  { name: 'Truffle', normalizedName: 'truffle', category: 'blockchain' },
  { name: 'IPFS', normalizedName: 'ipfs', category: 'blockchain' },
  { name: 'Machine Learning', normalizedName: 'machinelearning', category: 'ai_ml' },
  { name: 'Deep Learning', normalizedName: 'deeplearning', category: 'ai_ml' },
  { name: 'TensorFlow', normalizedName: 'tensorflow', category: 'ai_ml' },
  { name: 'PyTorch', normalizedName: 'pytorch', category: 'ai_ml' },
  { name: 'scikit-learn', normalizedName: 'scikit-learn', category: 'ai_ml' },
  { name: 'Natural Language Processing', normalizedName: 'naturallanguageprocessing', category: 'ai_ml' },
  { name: 'Computer Vision', normalizedName: 'computervision', category: 'ai_ml' },
  { name: 'UI/UX Design', normalizedName: 'ui/uxdesign', category: 'design' },
  { name: 'Figma', normalizedName: 'figma', category: 'design' },
  { name: 'Adobe XD', normalizedName: 'adobexd', category: 'design' },
  { name: 'Sketch', normalizedName: 'sketch', category: 'design' },
  { name: 'Photoshop', normalizedName: 'photoshop', category: 'design' },
  { name: 'Leadership', normalizedName: 'leadership', category: 'soft_skill' },
  { name: 'Communication', normalizedName: 'communication', category: 'soft_skill' },
  { name: 'Collaboration', normalizedName: 'collaboration', category: 'soft_skill' },
  { name: 'Problem Solving', normalizedName: 'problemsolving', category: 'soft_skill' },
  { name: 'Project Management', normalizedName: 'projectmanagement', category: 'soft_skill' },
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

async function generateEmbedding(
  text: string,
  ollamaUrl: string,
  model: string
): Promise<number[] | null> {
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

    const data = (await res.json()) as { embedding?: number[] };
    return data.embedding ?? null;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown embedding error';
    console.error(`  Embedding fetch failed: ${message}`);
    return null;
  }
}

async function main() {
  const ollamaUrl =
    process.env.OLLAMA_BASE_URL ||
    process.env.OLLAMA_URL ||
    'http://localhost:11434';

  const ollamaModel =
    process.env.OLLAMA_EMBEDDING_MODEL ||
    process.env.OLLAMA_MODEL ||
    'nomic-embed-text';

  console.log(`\n🚀  seed-all  (Ollama: ${ollamaUrl}, model: ${ollamaModel})\n`);

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
    username:
      process.env.DATABASE_USER ||
      process.env.DB_USERNAME ||
      process.env.DB_USER ||
      'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database:
      process.env.DATABASE_NAME ||
      process.env.DB_NAME ||
      process.env.DB_DATABASE ||
      'spherenet',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  console.log('✅  Database connected\n');

  console.log('🗑️  Clearing only skill-related tables...');
  await ds.query(`
    TRUNCATE TABLE
      project_required_skills,
      project_optional_skills,
      user_skills,
      skill_review_queue,
      skill_aliases,
      canonical_skills
    CASCADE
  `);
  console.log('   ✅  Skill tables cleared\n');

  console.log(`📦  Seeding ${SKILLS.length} canonical skills...`);
  let skillEmbedded = 0;

  for (const s of SKILLS) {
    const embText = `${s.name} ${s.category}`;
    const embedding = await generateEmbedding(embText, ollamaUrl, ollamaModel);
    const embeddingLiteral = embedding ? `'[${embedding.join(',')}]'::vector` : 'NULL';

    await ds.query(
      `
      INSERT INTO canonical_skills
        (id, name, normalized_name, primary_domain_id, description, embedding, usage_count, is_verified, created_by_user_id, created_at, updated_at)
      VALUES
        (gen_random_uuid(), $1, $2, NULL, NULL, ${embeddingLiteral}, 0, true, NULL, NOW(), NOW())
      ON CONFLICT (normalized_name) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            is_verified = true,
            updated_at = NOW()
      `,
      [s.name, s.normalizedName]
    );

    if (embedding) {
      skillEmbedded++;
      process.stdout.write(`   ✅  ${s.name}\n`);
    } else {
      process.stdout.write(`   ⚠️   ${s.name} (no embedding)\n`);
    }
  }

  console.log(`\n✨  DONE\n`);
  console.log(`   Skills: ${skillEmbedded}/${SKILLS.length} embedded\n`);

  try {
    await ds.query(`
      CREATE INDEX IF NOT EXISTS idx_canonical_skills_embedding_hnsw
      ON canonical_skills USING hnsw (embedding vector_cosine_ops)
    `);
    console.log('   ✅  idx_canonical_skills_embedding_hnsw');
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown index error';
    console.log(`   ⚠️   idx_canonical_skills_embedding_hnsw: ${message}`);
  }

  await ds.destroy();
}

main().catch((e) => {
  console.error('💥  Fatal error:', e);
  process.exit(1);
});