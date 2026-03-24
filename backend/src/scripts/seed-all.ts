/**
 * seed-all.ts
 *
 * Full reset + reseed + embed script for CURRENT schema.
 *
 * Run:
 * npx ts-node -r tsconfig-paths/register src/scripts/seed-all.ts
 *
 * What it does:
 *  1. TRUNCATES matching-related tables
 *  2. Seeds domains first
 *  3. Seeds canonical_skills
 *  4. Seeds professional_roles (with valid primary_domain_id)
 *  5. Generates Ollama embeddings for every row when available
 *
 * IMPORTANT:
 * - This version matches your CURRENT schema
 * - It does NOT use old columns like category / confidence_level / source
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

type SeedSkill = {
  name: string;
  normalizedName: string;
  primaryDomainName?: string;
  description?: string;
};

type SeedRole = {
  name: string;
  normalizedName: string;
  primaryDomainName: string;
  description?: string;
};

type SeedDomain = {
  name: string;
  normalizedName: string;
  parentDomainName?: string;
  description?: string;
};

const SKILLS: SeedSkill[] = [
  { name: "JavaScript", normalizedName: "javascript", primaryDomainName: "Web Development" },
  { name: "TypeScript", normalizedName: "typescript", primaryDomainName: "Web Development" },
  { name: "Python", normalizedName: "python", primaryDomainName: "Artificial Intelligence" },
  { name: "Java", normalizedName: "java", primaryDomainName: "Web Development" },
  { name: "C++", normalizedName: "c++", primaryDomainName: "Embedded Systems" },
  { name: "C", normalizedName: "c", primaryDomainName: "Embedded Systems" },
  { name: "C#", normalizedName: "c#", primaryDomainName: "Web Development" },
  { name: "Go", normalizedName: "go", primaryDomainName: "Cloud Computing" },
  { name: "Rust", normalizedName: "rust", primaryDomainName: "Embedded Systems" },
  { name: "Ruby", normalizedName: "ruby", primaryDomainName: "Web Development" },
  { name: "PHP", normalizedName: "php", primaryDomainName: "Web Development" },
  { name: "Swift", normalizedName: "swift", primaryDomainName: "Mobile App Development" },
  { name: "Kotlin", normalizedName: "kotlin", primaryDomainName: "Mobile App Development" },
  { name: "Dart", normalizedName: "dart", primaryDomainName: "Mobile App Development" },
  { name: "Solidity", normalizedName: "solidity", primaryDomainName: "Blockchain & Web3" },

  { name: "React", normalizedName: "react", primaryDomainName: "Web Development" },
  { name: "Next.js", normalizedName: "next.js", primaryDomainName: "Web Development" },
  { name: "Vue.js", normalizedName: "vue.js", primaryDomainName: "Web Development" },
  { name: "Angular", normalizedName: "angular", primaryDomainName: "Web Development" },
  { name: "Svelte", normalizedName: "svelte", primaryDomainName: "Web Development" },
  { name: "Solid.js", normalizedName: "solid.js", primaryDomainName: "Web Development" },

  { name: "Node.js", normalizedName: "node.js", primaryDomainName: "Web Development" },
  { name: "Express", normalizedName: "express", primaryDomainName: "Web Development" },
  { name: "NestJS", normalizedName: "nestjs", primaryDomainName: "Web Development" },
  { name: "Django", normalizedName: "django", primaryDomainName: "Web Development" },
  { name: "Flask", normalizedName: "flask", primaryDomainName: "Web Development" },
  { name: "FastAPI", normalizedName: "fastapi", primaryDomainName: "Artificial Intelligence" },
  { name: "Spring Boot", normalizedName: "springboot", primaryDomainName: "Web Development" },
  { name: "Ruby on Rails", normalizedName: "rubyonrails", primaryDomainName: "Web Development" },
  { name: "Laravel", normalizedName: "laravel", primaryDomainName: "Web Development" },

  { name: "PostgreSQL", normalizedName: "postgresql", primaryDomainName: "Data Analysis" },
  { name: "MySQL", normalizedName: "mysql", primaryDomainName: "Data Analysis" },
  { name: "MongoDB", normalizedName: "mongodb", primaryDomainName: "Web Development" },
  { name: "Redis", normalizedName: "redis", primaryDomainName: "Cloud Computing" },
  { name: "SQLite", normalizedName: "sqlite", primaryDomainName: "Data Analysis" },
  { name: "Cassandra", normalizedName: "cassandra", primaryDomainName: "Data Analysis" },
  { name: "DynamoDB", normalizedName: "dynamodb", primaryDomainName: "Cloud Computing" },
  { name: "Firebase", normalizedName: "firebase", primaryDomainName: "Mobile App Development" },

  { name: "Docker", normalizedName: "docker", primaryDomainName: "Cloud Computing" },
  { name: "Kubernetes", normalizedName: "kubernetes", primaryDomainName: "Cloud Computing" },
  { name: "Git", normalizedName: "git", primaryDomainName: "Web Development" },
  { name: "GitHub", normalizedName: "github", primaryDomainName: "Web Development" },
  { name: "GitHub Actions", normalizedName: "githubactions", primaryDomainName: "Cloud Computing" },
  { name: "GitLab CI", normalizedName: "gitlabci", primaryDomainName: "Cloud Computing" },
  { name: "Jenkins", normalizedName: "jenkins", primaryDomainName: "Cloud Computing" },
  { name: "Terraform", normalizedName: "terraform", primaryDomainName: "Cloud Computing" },
  { name: "Ansible", normalizedName: "ansible", primaryDomainName: "Cloud Computing" },

  { name: "AWS", normalizedName: "aws", primaryDomainName: "Cloud Computing" },
  { name: "Google Cloud", normalizedName: "googlecloud", primaryDomainName: "Cloud Computing" },
  { name: "Azure", normalizedName: "azure", primaryDomainName: "Cloud Computing" },
  { name: "Vercel", normalizedName: "vercel", primaryDomainName: "Cloud Computing" },
  { name: "Netlify", normalizedName: "netlify", primaryDomainName: "Cloud Computing" },
  { name: "Heroku", normalizedName: "heroku", primaryDomainName: "Cloud Computing" },

  { name: "React Native", normalizedName: "reactnative", primaryDomainName: "Mobile App Development" },
  { name: "Flutter", normalizedName: "flutter", primaryDomainName: "Mobile App Development" },
  { name: "iOS Development", normalizedName: "iosdevelopment", primaryDomainName: "Mobile App Development" },
  { name: "Android Development", normalizedName: "androiddevelopment", primaryDomainName: "Mobile App Development" },

  { name: "Ethereum", normalizedName: "ethereum", primaryDomainName: "Blockchain & Web3" },
  { name: "Smart Contracts", normalizedName: "smartcontracts", primaryDomainName: "Blockchain & Web3" },
  { name: "Web3", normalizedName: "web3", primaryDomainName: "Blockchain & Web3" },
  { name: "Hardhat", normalizedName: "hardhat", primaryDomainName: "Blockchain & Web3" },
  { name: "Truffle", normalizedName: "truffle", primaryDomainName: "Blockchain & Web3" },
  { name: "IPFS", normalizedName: "ipfs", primaryDomainName: "Blockchain & Web3" },

  { name: "Machine Learning", normalizedName: "machinelearning", primaryDomainName: "Artificial Intelligence" },
  { name: "Deep Learning", normalizedName: "deeplearning", primaryDomainName: "Artificial Intelligence" },
  { name: "TensorFlow", normalizedName: "tensorflow", primaryDomainName: "Artificial Intelligence" },
  { name: "PyTorch", normalizedName: "pytorch", primaryDomainName: "Artificial Intelligence" },
  { name: "scikit-learn", normalizedName: "scikit-learn", primaryDomainName: "Artificial Intelligence" },
  { name: "Natural Language Processing", normalizedName: "naturallanguageprocessing", primaryDomainName: "Artificial Intelligence" },
  { name: "Computer Vision", normalizedName: "computervision", primaryDomainName: "Artificial Intelligence" },

  { name: "UI/UX Design", normalizedName: "ui/uxdesign", primaryDomainName: "Design" },
  { name: "Figma", normalizedName: "figma", primaryDomainName: "Design" },
  { name: "Adobe XD", normalizedName: "adobexd", primaryDomainName: "Design" },
  { name: "Sketch", normalizedName: "sketch", primaryDomainName: "Design" },
  { name: "Photoshop", normalizedName: "photoshop", primaryDomainName: "Design" },

  { name: "Leadership", normalizedName: "leadership" },
  { name: "Communication", normalizedName: "communication" },
  { name: "Collaboration", normalizedName: "collaboration" },
  { name: "Problem Solving", normalizedName: "problemsolving" },
  { name: "Project Management", normalizedName: "projectmanagement", primaryDomainName: "Product Management" },

  { name: "REST API", normalizedName: "restapi", primaryDomainName: "Web Development" },
  { name: "GraphQL", normalizedName: "graphql", primaryDomainName: "Web Development" },
  { name: "WebSockets", normalizedName: "websockets", primaryDomainName: "Web Development" },
  { name: "Microservices", normalizedName: "microservices", primaryDomainName: "Cloud Computing" },
  { name: "SEO", normalizedName: "seo", primaryDomainName: "Digital Marketing" },
  { name: "Testing", normalizedName: "testing" },
  { name: "Jest", normalizedName: "jest", primaryDomainName: "Web Development" },
  { name: "Cypress", normalizedName: "cypress", primaryDomainName: "Web Development" },
  { name: "Linux", normalizedName: "linux", primaryDomainName: "Cloud Computing" },
  { name: "TCP/IP", normalizedName: "tcp/ip", primaryDomainName: "Cloud Computing" },
  { name: "JWT", normalizedName: "jwt", primaryDomainName: "Web Development" },
];

const DOMAINS: SeedDomain[] = [
  { name: "FinTech", normalizedName: "fintech" },
  { name: "HealthTech", normalizedName: "healthtech" },
  { name: "EdTech", normalizedName: "edtech" },
  { name: "E-commerce", normalizedName: "e-commerce" },
  { name: "SaaS", normalizedName: "saas" },
  { name: "Cybersecurity", normalizedName: "cybersecurity" },
  { name: "Blockchain & Web3", normalizedName: "blockchain&web3" },
  { name: "Artificial Intelligence", normalizedName: "artificialintelligence" },
  { name: "Internet of Things (IoT)", normalizedName: "internetofthings(iot)" },
  { name: "Robotics", normalizedName: "robotics" },
  { name: "Biotech", normalizedName: "biotech" },
  { name: "CleanTech", normalizedName: "cleantech" },
  { name: "AgriTech", normalizedName: "agritech" },
  { name: "AdTech", normalizedName: "adtech" },
  { name: "Gaming", normalizedName: "gaming" },
  { name: "Media & Entertainment", normalizedName: "media&entertainment" },
  { name: "Real Estate", normalizedName: "realestate" },
  { name: "Logistics & Supply Chain", normalizedName: "logistics&supplychain" },
  { name: "Automotive", normalizedName: "automotive" },
  { name: "Aerospace", normalizedName: "aerospace" },
  { name: "Energy", normalizedName: "energy" },
  { name: "Oil & Gas", normalizedName: "oil&gas" },
  { name: "Telecommunications", normalizedName: "telecommunications" },
  { name: "Travel & Hospitality", normalizedName: "travel&hospitality" },
  { name: "LegalTech", normalizedName: "legaltech" },
  { name: "InsurTech", normalizedName: "insurtech" },
  { name: "PropTech", normalizedName: "proptech" },
  { name: "GovTech", normalizedName: "govtech" },
  { name: "Non-profit", normalizedName: "non-profit" },
  { name: "Consulting", normalizedName: "consulting" },
  { name: "Web Development", normalizedName: "webdevelopment" },
  { name: "Mobile App Development", normalizedName: "mobileappdevelopment" },
  { name: "Data Analysis", normalizedName: "dataanalysis" },
  { name: "Cloud Computing", normalizedName: "cloudcomputing" },
  { name: "Digital Marketing", normalizedName: "digitalmarketing" },
  { name: "Design", normalizedName: "design" },
  { name: "Product Management", normalizedName: "productmanagement" },
  { name: "Business", normalizedName: "business" },
  { name: "Finance", normalizedName: "finance" },
  { name: "Operations", normalizedName: "operations" },
  { name: "Human Resources", normalizedName: "humanresources" },
  { name: "Legal", normalizedName: "legal" },
  { name: "Embedded Systems", normalizedName: "embeddedsystems" },
];

const ROLES: SeedRole[] = [
  { name: "Frontend Developer", normalizedName: "frontenddeveloper", primaryDomainName: "Web Development" },
  { name: "Backend Developer", normalizedName: "backenddeveloper", primaryDomainName: "Web Development" },
  { name: "Full Stack Developer", normalizedName: "fullstackdeveloper", primaryDomainName: "Web Development" },
  { name: "DevOps Engineer", normalizedName: "devopsengineer", primaryDomainName: "Cloud Computing" },
  { name: "Mobile Developer", normalizedName: "mobiledeveloper", primaryDomainName: "Mobile App Development" },
  { name: "Data Scientist", normalizedName: "datascientist", primaryDomainName: "Artificial Intelligence" },
  { name: "Machine Learning Engineer", normalizedName: "machinelearningengineer", primaryDomainName: "Artificial Intelligence" },
  { name: "Software Architect", normalizedName: "softwarearchitect", primaryDomainName: "Web Development" },
  { name: "QA Engineer", normalizedName: "qaengineer", primaryDomainName: "Web Development" },
  { name: "Security Engineer", normalizedName: "securityengineer", primaryDomainName: "Cybersecurity" },
  { name: "Blockchain Developer", normalizedName: "blockchaindeveloper", primaryDomainName: "Blockchain & Web3" },
  { name: "Game Developer", normalizedName: "gamedeveloper", primaryDomainName: "Gaming" },
  { name: "Embedded Systems Engineer", normalizedName: "embeddedsystemsengineer", primaryDomainName: "Embedded Systems" },
  { name: "Site Reliability Engineer", normalizedName: "sitereliabilityengineer", primaryDomainName: "Cloud Computing" },

  { name: "UI/UX Designer", normalizedName: "ui/uxdesigner", primaryDomainName: "Design" },
  { name: "Product Designer", normalizedName: "productdesigner", primaryDomainName: "Design" },
  { name: "Graphic Designer", normalizedName: "graphicdesigner", primaryDomainName: "Design" },
  { name: "Visual Designer", normalizedName: "visualdesigner", primaryDomainName: "Design" },
  { name: "Interaction Designer", normalizedName: "interactiondesigner", primaryDomainName: "Design" },

  { name: "Product Manager", normalizedName: "productmanager", primaryDomainName: "Product Management" },
  { name: "Project Manager", normalizedName: "projectmanager", primaryDomainName: "Product Management" },
  { name: "Scrum Master", normalizedName: "scrummaster", primaryDomainName: "Product Management" },
  { name: "Product Owner", normalizedName: "productowner", primaryDomainName: "Product Management" },

  { name: "Digital Marketer", normalizedName: "digitalmarketer", primaryDomainName: "Digital Marketing" },
  { name: "Content Strategist", normalizedName: "contentstrategist", primaryDomainName: "Digital Marketing" },
  { name: "SEO Specialist", normalizedName: "seospecialist", primaryDomainName: "Digital Marketing" },
  { name: "Social Media Manager", normalizedName: "socialmediamanager", primaryDomainName: "Digital Marketing" },
  { name: "Growth Hacker", normalizedName: "growthhacker", primaryDomainName: "Digital Marketing" },

  { name: "Sales Representative", normalizedName: "salesrepresentative", primaryDomainName: "Business" },
  { name: "Account Executive", normalizedName: "accountexecutive", primaryDomainName: "Business" },
  { name: "Sales Manager", normalizedName: "salesmanager", primaryDomainName: "Business" },
  { name: "Business Development Manager", normalizedName: "businessdevelopmentmanager", primaryDomainName: "Business" },

  { name: "Financial Analyst", normalizedName: "financialanalyst", primaryDomainName: "Finance" },
  { name: "Accountant", normalizedName: "accountant", primaryDomainName: "Finance" },
  { name: "Investment Banker", normalizedName: "investmentbanker", primaryDomainName: "Finance" },
  { name: "Chief Financial Officer", normalizedName: "chieffinancialofficer", primaryDomainName: "Finance" },

  { name: "Operations Manager", normalizedName: "operationsmanager", primaryDomainName: "Operations" },
  { name: "Supply Chain Manager", normalizedName: "supplychainmanager", primaryDomainName: "Operations" },
  { name: "Logistics Coordinator", normalizedName: "logisticscoordinator", primaryDomainName: "Operations" },

  { name: "HR Manager", normalizedName: "hrmanager", primaryDomainName: "Human Resources" },
  { name: "Recruiter", normalizedName: "recruiter", primaryDomainName: "Human Resources" },
  { name: "Talent Acquisition Specialist", normalizedName: "talentacquisitionspecialist", primaryDomainName: "Human Resources" },

  { name: "Legal Counsel", normalizedName: "legalcounsel", primaryDomainName: "Legal" },
  { name: "Corporate Lawyer", normalizedName: "corporatelawyer", primaryDomainName: "Legal" },

  { name: "Chief Executive Officer", normalizedName: "chiefexecutiveofficer", primaryDomainName: "Business" },
  { name: "Chief Technology Officer", normalizedName: "chieftechnologyofficer", primaryDomainName: "Cloud Computing" },
  { name: "Chief Operating Officer", normalizedName: "chiefoperatingofficer", primaryDomainName: "Operations" },
  { name: "Founder", normalizedName: "founder", primaryDomainName: "Business" },
];

async function generateEmbedding(
  text: string,
  ollamaBaseUrl: string,
  model: string
): Promise<number[] | null> {
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
    });

    if (!res.ok) {
      console.error(`  Ollama error ${res.status}:`, await res.text());
      return null;
    }

    const data = (await res.json()) as { embedding?: number[] };
    return data.embedding ?? null;
  } catch (e: any) {
    console.error(`  Embedding fetch failed: ${e.message}`);
    return null;
  }
}

function vectorLiteral(embedding: number[] | null): string {
  return embedding ? `'[${embedding.join(",")}]'::vector` : "NULL";
}

async function main() {
  const ollamaBaseUrl =
    process.env.OLLAMA_BASE_URL ||
    process.env.OLLAMA_URL ||
    "http://localhost:11434";

  const ollamaModel =
    process.env.OLLAMA_EMBEDDING_MODEL ||
    process.env.OLLAMA_MODEL ||
    "nomic-embed-text";

  console.log(`\n🚀  seed-all  (Ollama: ${ollamaBaseUrl}, model: ${ollamaModel})\n`);

  const ds = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || process.env.DB_DATABASE || "spherenet",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  console.log("✅  Database connected\n");

  console.log("🗑️  Clearing tables (TRUNCATE ... CASCADE)...");
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
  console.log("   ✅  All tables cleared\n");

  console.log(`📦  Seeding ${DOMAINS.length} domains...`);
  let domainEmbedded = 0;
  const domainIdByNormalized = new Map<string, string>();

  for (const d of DOMAINS) {
    const embText = `${d.name} domain`;
    const embedding = await generateEmbedding(embText, ollamaBaseUrl, ollamaModel);

    const rows = await ds.query(
      `
      INSERT INTO domains
        (name, normalized_name, parent_domain_id, description, embedding, usage_count, is_verified, created_by_user_id)
      VALUES
        ($1, $2, NULL, $3, ${vectorLiteral(embedding)}, $4, true, NULL)
      RETURNING id
      `,
      [d.name, d.normalizedName, d.description ?? null, 10]
    );

    domainIdByNormalized.set(d.normalizedName, rows[0].id);

    if (embedding) {
      domainEmbedded++;
      process.stdout.write(`   ✅  ${d.name}\n`);
    } else {
      process.stdout.write(`   ⚠️   ${d.name} (no embedding)\n`);
    }
  }
  console.log(`\n   📊  Domains embedded: ${domainEmbedded}/${DOMAINS.length}\n`);

  console.log(`📦  Seeding ${SKILLS.length} canonical skills...`);
  let skillEmbedded = 0;

  for (const s of SKILLS) {
    const embText = `${s.name} skill`;
    const embedding = await generateEmbedding(embText, ollamaBaseUrl, ollamaModel);
    const primaryDomainId = s.primaryDomainName
      ? domainIdByNormalized.get(
          DOMAINS.find((d) => d.name === s.primaryDomainName)?.normalizedName || ""
        ) || null
      : null;

    await ds.query(
      `
      INSERT INTO canonical_skills
        (name, normalized_name, primary_domain_id, description, embedding, usage_count, is_verified, created_by_user_id)
      VALUES
        ($1, $2, $3, $4, ${vectorLiteral(embedding)}, $5, true, NULL)
      `,
      [s.name, s.normalizedName, primaryDomainId, s.description ?? null, 10]
    );

    if (embedding) {
      skillEmbedded++;
      process.stdout.write(`   ✅  ${s.name}\n`);
    } else {
      process.stdout.write(`   ⚠️   ${s.name} (no embedding)\n`);
    }
  }
  console.log(`\n   📊  Skills embedded: ${skillEmbedded}/${SKILLS.length}\n`);

  console.log(`📦  Seeding ${ROLES.length} professional roles...`);
  let roleEmbedded = 0;

  for (const r of ROLES) {
    const embText = `${r.name} role`;
    const embedding = await generateEmbedding(embText, ollamaBaseUrl, ollamaModel);

    const primaryDomain = DOMAINS.find((d) => d.name === r.primaryDomainName);
    if (!primaryDomain) {
      throw new Error(`Primary domain not found for role ${r.name}: ${r.primaryDomainName}`);
    }

    const primaryDomainId = domainIdByNormalized.get(primaryDomain.normalizedName);
    if (!primaryDomainId) {
      throw new Error(`Primary domain id missing for role ${r.name}: ${r.primaryDomainName}`);
    }

    await ds.query(
      `
      INSERT INTO professional_roles
        (name, normalized_name, primary_domain_id, description, embedding, usage_count, is_verified, created_by_user_id)
      VALUES
        ($1, $2, $3, $4, ${vectorLiteral(embedding)}, $5, true, NULL)
      `,
      [r.name, r.normalizedName, primaryDomainId, r.description ?? null, 10]
    );

    if (embedding) {
      roleEmbedded++;
      process.stdout.write(`   ✅  ${r.name}\n`);
    } else {
      process.stdout.write(`   ⚠️   ${r.name} (no embedding)\n`);
    }
  }
  console.log(`\n   📊  Roles embedded: ${roleEmbedded}/${ROLES.length}\n`);

  console.log("🔧  Ensuring HNSW indexes exist...");
  const indexes = [
    { name: "idx_canonical_skills_embedding_hnsw", table: "canonical_skills" },
    { name: "idx_domains_embedding_hnsw", table: "domains" },
    { name: "idx_professional_roles_embedding_hnsw", table: "professional_roles" },
    { name: "idx_user_profile_vectors_embedding_hnsw", table: "user_profile_vectors" },
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

  console.log("\n✨  DONE\n");
  console.log(`   Domains: ${domainEmbedded}/${DOMAINS.length} embedded`);
  console.log(`   Skills:  ${skillEmbedded}/${SKILLS.length} embedded`);
  console.log(`   Roles:   ${roleEmbedded}/${ROLES.length} embedded`);
  console.log();

  await ds.destroy();
}

main().catch((e) => {
  console.error("💥  Fatal error:", e);
  process.exit(1);
});