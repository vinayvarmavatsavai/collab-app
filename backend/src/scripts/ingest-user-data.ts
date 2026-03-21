/**
 * ingest-user-data.ts
 *
 * Canonical Data Ingestion Pipeline
 *
 * Reads ALL existing user profile data and safely expands canonical_skills,
 * professional_roles, and domains tables using a 7-step pipeline:
 *
 *   1. Collect raw candidate strings from user profiles
 *   2. Normalize each candidate
 *   3. Match against canonical tables (exact → alias → vector)
 *   4. Create new canonical entries for unmatched candidates
 *   5. Recalculate usageCount and promote confidence levels
 *   6. Flag near-duplicate USER_GENERATED canonicals for review
 *   7. Update user bridge tables (user_skills / user_roles / user_domains)
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register src/scripts/ingest-user-data.ts
 *
 * Idempotent — safe to run multiple times.
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityType = 'skill' | 'role' | 'domain';

interface Candidate {
    raw: string;        // original form from user data
    normalized: string; // after normalization pipeline
    userId: string;     // which user it came from
    type: EntityType;
}

interface ResolvedCanonical {
    canonicalId: string;
    userId: string;
    type: EntityType;
}

interface IngestionStats {
    usersProcessed: number;
    rawCandidatesFound: { skill: number; role: number; domain: number };
    exactMatches: { skill: number; role: number; domain: number };
    aliasMatches: { skill: number; role: number; domain: number };
    autoMerged: { skill: number; role: number; domain: number };      // sim >= 0.90
    reviewQueued: { skill: number; role: number; domain: number };     // 0.75 <= sim < 0.90
    newCreated: { skill: number; role: number; domain: number };       // sim < 0.75
    bridgeRowsInserted: number;
    duplicatesFlagged: number;
    errors: number;
}

// ---------------------------------------------------------------------------
// DB config from env
// ---------------------------------------------------------------------------

const DB_CONFIG = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'startup101',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : (false as false),
};

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

// Matching thresholds
const AUTO_MERGE_THRESHOLD = 0.90;
const REVIEW_QUEUE_THRESHOLD = 0.75;
const DUPLICATE_DETECTION_THRESHOLD = 0.92;

// Promotion thresholds
const MEDIUM_CONFIDENCE_THRESHOLD = 50;
const HIGH_CONFIDENCE_THRESHOLD = 200;

// Batch sizes
const EMBEDDING_BATCH_SIZE = 10;
const USER_BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// Normalization pipeline
// ---------------------------------------------------------------------------

const SKILL_NOISE_WORDS = [
    'developer', 'development', 'engineer', 'engineering',
    'expert', 'specialist', 'programmer', 'programming',
    'junior', 'senior', 'lead', 'staff', 'principal',
    'intern', 'associate', 'architect',
];

// Suffixes to strip in skill context
const SKILL_SUFFIXES = ['.js', '.ts', '.py', '.rb', '.go', '.rs'];

// Common role noise that is meaningful to KEEP in role context — only strip in skill context
const SKILL_ROLE_NOISE = ['developer', 'engineer', 'programmer'];

function normalizeSkill(input: string): string {
    if (!input) return '';

    let s = input.toLowerCase().trim();

    // Strip emojis and non-printable chars
    s = s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();

    // Strip .js / .ts etc suffixes
    for (const suffix of SKILL_SUFFIXES) {
        if (s.endsWith(suffix)) {
            s = s.slice(0, -suffix.length).trim();
        }
    }

    // Strip skill noise words (only when result is still meaningful)
    for (const noise of SKILL_NOISE_WORDS) {
        const cleaned = s.replace(new RegExp(`\\b${noise}\\b`, 'g'), '').trim();
        if (cleaned.length >= 2) s = cleaned;
    }

    // Remove leftover punctuation (keep alphanumeric, space, dash, dot, slash, #, +)
    s = s.replace(/[^\w\s.\-/#+ ]/g, '').trim();

    // Collapse multiple spaces
    s = s.replace(/\s+/g, ' ').trim();

    return s;
}

function normalizeRole(input: string): string {
    if (!input) return '';

    let s = input.toLowerCase().trim();
    s = s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    // Roles keep "developer", "engineer" etc. - just strip punctuation/emojis
    s = s.replace(/[^\w\s.\-/ ]/g, '').trim();
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

function normalizeDomain(input: string): string {
    if (!input) return '';
    let s = input.toLowerCase().trim();
    s = s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    s = s.replace(/[^\w\s.\-/& ]/g, '').trim();
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

function normalize(raw: string, type: EntityType): string {
    switch (type) {
        case 'skill': return normalizeSkill(raw);
        case 'role': return normalizeRole(raw);
        case 'domain': return normalizeDomain(raw);
    }
}

// Split description text into meaningful candidate tokens
function extractTokens(text: string | null | undefined): string[] {
    if (!text) return [];
    return text
        .split(/[,;|()\[\]{}\n\/\\•·\-–—]+/)
        .map(t => t.trim())
        .filter(t => t.length >= 2 && t.length <= 80);
}

// ---------------------------------------------------------------------------
// Ollama embedding
// ---------------------------------------------------------------------------

async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
        });
        if (!res.ok) {
            console.error(`  Ollama ${res.status} for "${text}":`, await res.text());
            return null;
        }
        const data = await res.json() as any;
        return data.embedding ?? null;
    } catch (e: any) {
        console.error(`  Embedding error for "${text}": ${e.message}`);
        return null;
    }
}

async function batchGenerateEmbeddings(texts: string[]): Promise<Map<string, number[] | null>> {
    const results = new Map<string, number[] | null>();
    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
        await Promise.all(batch.map(async (text) => {
            results.set(text, await generateEmbedding(text));
        }));
    }
    return results;
}

// ---------------------------------------------------------------------------
// Table names per entity type
// ---------------------------------------------------------------------------

function tableNames(type: EntityType): {
    canonical: string;
    aliases: string;
    aliasesCanonicalCol: string;
    aliasesCanonicalIdCol: string;
    reviewQueue: string;
    reviewSuggestedCol: string;
} {
    switch (type) {
        case 'skill':
            return {
                canonical: 'canonical_skills',
                aliases: 'skill_aliases',
                aliasesCanonicalCol: 'canonical_skill_id',
                aliasesCanonicalIdCol: 'canonical_skill_id',
                reviewQueue: 'skill_review_queue',
                reviewSuggestedCol: 'suggested_skill_id',
            };
        case 'role':
            return {
                canonical: 'professional_roles',
                aliases: 'role_aliases',
                aliasesCanonicalCol: 'professional_role_id',
                aliasesCanonicalIdCol: 'professional_role_id',
                reviewQueue: 'role_review_queue',
                reviewSuggestedCol: 'suggested_role_id',
            };
        case 'domain':
            return {
                canonical: 'domains',
                aliases: 'domain_aliases',
                aliasesCanonicalCol: 'domain_id',
                aliasesCanonicalIdCol: 'domain_id',
                reviewQueue: 'domain_review_queue',
                reviewSuggestedCol: 'suggested_domain_id',
            };
    }
}

function userBridgeTable(type: EntityType): { table: string; canonicalIdCol: string } {
    switch (type) {
        case 'skill': return { table: 'user_skills', canonicalIdCol: 'canonical_skill_id' };
        case 'role': return { table: 'user_roles', canonicalIdCol: 'role_id' };
        case 'domain': return { table: 'user_domains', canonicalIdCol: 'domain_id' };
    }
}

// ---------------------------------------------------------------------------
// Core: match one candidate against a canonical table
// Returns the canonical ID that should be linked to this user.
// ---------------------------------------------------------------------------

async function matchCandidate(
    ds: DataSource,
    candidate: { normalized: string; raw: string },
    type: EntityType,
    embedding: number[] | null,
    stats: IngestionStats,
): Promise<string | null> {
    const t = tableNames(type);
    const statKey = type as keyof typeof stats.exactMatches;

    // ---- 3.1 Exact match ------------------------------------------------
    const exact = await ds.query(
        `SELECT id FROM ${t.canonical} WHERE normalized_name = $1 LIMIT 1`,
        [candidate.normalized]
    );
    if (exact.length > 0) {
        await ds.query(
            `UPDATE ${t.canonical} SET usage_count = usage_count + 1 WHERE id = $1`,
            [exact[0].id]
        );
        stats.exactMatches[statKey]++;
        return exact[0].id;
    }

    // ---- 3.2 Alias match ------------------------------------------------
    const alias = await ds.query(
        `SELECT ${t.aliasesCanonicalIdCol} AS canonical_id FROM ${t.aliases} WHERE normalized_alias = $1 LIMIT 1`,
        [candidate.normalized]
    );
    if (alias.length > 0) {
        await ds.query(
            `UPDATE ${t.canonical} SET usage_count = usage_count + 1 WHERE id = $1`,
            [alias[0].canonical_id]
        );
        stats.aliasMatches[statKey]++;
        return alias[0].canonical_id;
    }

    // ---- 3.3 Vector similarity match ------------------------------------
    if (!embedding) {
        // Can't do vector match — create new entry without similarity check
        return await insertNewCanonical(ds, candidate, type, null, null, stats);
    }

    const embStr = `[${embedding.join(',')}]`;

    const nearest = await ds.query(`
        SELECT id, name, 1 - (embedding <=> '${embStr}'::vector) AS similarity
        FROM ${t.canonical}
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> '${embStr}'::vector
        LIMIT 1
    `);

    if (nearest.length > 0) {
        const sim: number = parseFloat(nearest[0].similarity);
        const nearestId: string = nearest[0].id;

        if (sim >= AUTO_MERGE_THRESHOLD) {
            // Auto-merge: increment usage + create alias
            await ds.query(
                `UPDATE ${t.canonical} SET usage_count = usage_count + 1 WHERE id = $1`,
                [nearestId]
            );
            // Create alias guard
            await ds.query(`
                INSERT INTO ${t.aliases} (${t.aliasesCanonicalCol}, alias, normalized_alias)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
            `, [nearestId, candidate.raw, candidate.normalized]);

            stats.autoMerged[statKey]++;
            return nearestId;
        }

        if (sim >= REVIEW_QUEUE_THRESHOLD) {
            // New canonical + review queue with suggestion
            const newId = await insertNewCanonical(ds, candidate, type, embedding, nearestId, stats);
            stats.reviewQueued[statKey]++;
            return newId;
        }
    }

    // sim < threshold or no canonical exists yet
    const newId = await insertNewCanonical(ds, candidate, type, embedding, null, stats);
    return newId;
}

// ---------------------------------------------------------------------------
// Insert a new canonical entry + ReviewQueue row
// ---------------------------------------------------------------------------

async function insertNewCanonical(
    ds: DataSource,
    candidate: { normalized: string; raw: string },
    type: EntityType,
    embedding: number[] | null,
    suggestedCanonicalId: string | null,
    stats: IngestionStats,
): Promise<string | null> {
    const t = tableNames(type);
    const statKey = type as keyof typeof stats.newCreated;

    let embClause = 'NULL';
    if (embedding) {
        embClause = `'[${embedding.join(',')}]'::vector`;
    }

    // Determine category default
    const categoryDefault = type === 'skill' ? 'other'
        : type === 'role' ? 'other'
            : 'sector';

    try {
        const inserted = await ds.query(`
            INSERT INTO ${t.canonical}
                (name, normalized_name, category, confidence_level, is_verified, source, usage_count, embedding)
            VALUES
                ($1, $2, $3::${t.canonical === 'canonical_skills' ? 'skill_category' : t.canonical === 'professional_roles' ? 'role_category' : 'domain_category'}, 'user_generated', false, 'user', 1, ${embClause})
            ON CONFLICT (normalized_name) DO NOTHING
            RETURNING id
        `, [candidate.raw, candidate.normalized, categoryDefault]);

        if (inserted.length === 0) {
            // ON CONFLICT hit — someone else inserted it; fetch its id
            const existing = await ds.query(
                `SELECT id FROM ${t.canonical} WHERE normalized_name = $1`, [candidate.normalized]
            );
            return existing.length > 0 ? existing[0].id : null;
        }

        const newId: string = inserted[0].id;
        stats.newCreated[statKey]++;

        // Insert into ReviewQueue
        await insertReviewQueue(ds, type, candidate.raw, candidate.normalized, newId, suggestedCanonicalId);

        return newId;
    } catch (e: any) {
        console.error(`  Failed to insert ${type} "${candidate.normalized}": ${e.message}`);
        stats.errors++;
        return null;
    }
}

// ---------------------------------------------------------------------------
// Insert into ReviewQueue
// ---------------------------------------------------------------------------

async function insertReviewQueue(
    ds: DataSource,
    type: EntityType,
    rawInput: string,
    normalizedInput: string,
    newEntityId: string,
    suggestedCanonicalId: string | null,
): Promise<void> {
    const t = tableNames(type);

    // Different review queues have different schemas — handle each
    try {
        if (type === 'skill') {
            await ds.query(`
                INSERT INTO skill_review_queue
                    (raw_input, normalized_input, suggested_skill_id, fuzzy_similarity, status)
                VALUES ($1, $2, $3, 0, 'pending')
                ON CONFLICT DO NOTHING
            `, [rawInput, normalizedInput, suggestedCanonicalId ?? newEntityId]);
        } else if (type === 'role') {
            await ds.query(`
                INSERT INTO role_review_queue
                    (raw_input, normalized_input, suggested_role_id, fuzzy_similarity, status)
                VALUES ($1, $2, $3, 0, 'pending')
                ON CONFLICT DO NOTHING
            `, [rawInput, normalizedInput, suggestedCanonicalId ?? newEntityId]);
        } else {
            await ds.query(`
                INSERT INTO domain_review_queue
                    (raw_input, normalized_input, suggested_domain_id, fuzzy_similarity, status)
                VALUES ($1, $2, $3, 0, 'pending')
                ON CONFLICT DO NOTHING
            `, [rawInput, normalizedInput, suggestedCanonicalId ?? newEntityId]);
        }
    } catch (e: any) {
        // Review queue insert failure is non-fatal
        console.warn(`  ReviewQueue insert failed for "${rawInput}": ${e.message}`);
    }
}

// ---------------------------------------------------------------------------
// Step 5 — Recalculate usage counts and promote confidence levels
// ---------------------------------------------------------------------------

async function recalculateUsageCounts(ds: DataSource): Promise<void> {
    console.log('\n📊  Step 5: Recalculating usage counts...');

    // Skills
    await ds.query(`
        UPDATE canonical_skills cs
        SET usage_count = sub.cnt
        FROM (
            SELECT canonical_skill_id AS id, COUNT(*) AS cnt
            FROM user_skills
            GROUP BY canonical_skill_id
        ) sub
        WHERE cs.id = sub.id
    `);

    // Roles
    await ds.query(`
        UPDATE professional_roles pr
        SET usage_count = sub.cnt
        FROM (
            SELECT role_id AS id, COUNT(*) AS cnt
            FROM user_roles
            GROUP BY role_id
        ) sub
        WHERE pr.id = sub.id
    `);

    // Domains
    await ds.query(`
        UPDATE domains d
        SET usage_count = sub.cnt
        FROM (
            SELECT domain_id AS id, COUNT(*) AS cnt
            FROM user_domains
            GROUP BY domain_id
        ) sub
        WHERE d.id = sub.id
    `);

    // Promotion: MEDIUM
    for (const table of ['canonical_skills', 'professional_roles', 'domains']) {
        await ds.query(`
            UPDATE ${table}
            SET confidence_level = 'medium'
            WHERE usage_count > $1
              AND confidence_level = 'user_generated'
        `, [MEDIUM_CONFIDENCE_THRESHOLD]);
    }

    // Promotion: HIGH + verified
    for (const table of ['canonical_skills', 'professional_roles', 'domains']) {
        await ds.query(`
            UPDATE ${table}
            SET confidence_level = 'high', is_verified = true
            WHERE usage_count > $1
              AND confidence_level != 'high'
        `, [HIGH_CONFIDENCE_THRESHOLD]);
    }

    console.log('   ✅  Usage counts updated and confidence levels promoted');
}

// ---------------------------------------------------------------------------
// Step 6 — Near-duplicate detection for USER_GENERATED canonicals
// ---------------------------------------------------------------------------

async function detectNearDuplicates(ds: DataSource, stats: IngestionStats): Promise<void> {
    console.log('\n🔍  Step 6: Detecting near-duplicate USER_GENERATED canonicals...');

    const tables: { table: string; type: EntityType; reviewFn: (id1: string, id2: string) => Promise<void> }[] = [
        {
            table: 'canonical_skills',
            type: 'skill',
            reviewFn: async (id1, id2) => {
                await ds.query(`
                    INSERT INTO skill_review_queue
                        (raw_input, normalized_input, suggested_skill_id, fuzzy_similarity, status)
                    SELECT
                        a.name || ' ≈ ' || b.name,
                        'merge_suggestion',
                        $1,
                        1 - (a.embedding <=> b.embedding),
                        'pending'
                    FROM canonical_skills a, canonical_skills b
                    WHERE a.id = $1 AND b.id = $2
                    ON CONFLICT DO NOTHING
                `, [id1, id2]);
            },
        },
        {
            table: 'professional_roles',
            type: 'role',
            reviewFn: async (id1, id2) => {
                await ds.query(`
                    INSERT INTO role_review_queue
                        (raw_input, normalized_input, suggested_role_id, fuzzy_similarity, status)
                    SELECT
                        a.name || ' ≈ ' || b.name,
                        'merge_suggestion',
                        $1,
                        1 - (a.embedding <=> b.embedding),
                        'pending'
                    FROM professional_roles a, professional_roles b
                    WHERE a.id = $1 AND b.id = $2
                    ON CONFLICT DO NOTHING
                `, [id1, id2]);
            },
        },
        {
            table: 'domains',
            type: 'domain',
            reviewFn: async (id1, id2) => {
                await ds.query(`
                    INSERT INTO domain_review_queue
                        (raw_input, normalized_input, suggested_domain_id, fuzzy_similarity, status)
                    SELECT
                        a.name || ' ≈ ' || b.name,
                        'merge_suggestion',
                        $1,
                        1 - (a.embedding <=> b.embedding),
                        'pending'
                    FROM domains a, domains b
                    WHERE a.id = $1 AND b.id = $2
                    ON CONFLICT DO NOTHING
                `, [id1, id2]);
            },
        },
    ];

    for (const t of tables) {
        const pairs = await ds.query(`
            SELECT a.id AS id1, b.id AS id2,
                   1 - (a.embedding <=> b.embedding) AS similarity
            FROM ${t.table} a
            JOIN ${t.table} b ON a.id < b.id
            WHERE a.source = 'user'
              AND b.source = 'user'
              AND a.embedding IS NOT NULL
              AND b.embedding IS NOT NULL
              AND 1 - (a.embedding <=> b.embedding) > $1
            LIMIT 200
        `, [DUPLICATE_DETECTION_THRESHOLD]);

        for (const pair of pairs) {
            await t.reviewFn(pair.id1, pair.id2);
            stats.duplicatesFlagged++;
        }

        if (pairs.length > 0) {
            console.log(`   ⚠️   ${t.table}: ${pairs.length} near-duplicate pairs flagged for review`);
        }
    }
}

// ---------------------------------------------------------------------------
// Main ingestion loop
// ---------------------------------------------------------------------------

async function main() {
    console.log(`\n🚀  Canonical Ingestion Pipeline`);
    console.log(`    Ollama: ${OLLAMA_URL} | model: ${OLLAMA_MODEL}\n`);

    const ds = new DataSource(DB_CONFIG);
    await ds.initialize();
    console.log('✅  Database connected\n');

    const stats: IngestionStats = {
        usersProcessed: 0,
        rawCandidatesFound: { skill: 0, role: 0, domain: 0 },
        exactMatches: { skill: 0, role: 0, domain: 0 },
        aliasMatches: { skill: 0, role: 0, domain: 0 },
        autoMerged: { skill: 0, role: 0, domain: 0 },
        reviewQueued: { skill: 0, role: 0, domain: 0 },
        newCreated: { skill: 0, role: 0, domain: 0 },
        bridgeRowsInserted: 0,
        duplicatesFlagged: 0,
        errors: 0,
    };

    // Resolved canonical links per user: { userId → { type → Set<canonicalId> } }
    const userLinks = new Map<string, {
        skill: Set<string>;
        role: Set<string>;
        domain: Set<string>;
    }>();

    // ----------------------------------------------------------------
    // Step 1: Load all users
    // ----------------------------------------------------------------
    console.log('📋  Step 1: Collecting user data...');

    const users = await ds.query(`
        SELECT id, profile_summary_text, experience, projects,
               current_position, headline
        FROM user_profiles
        WHERE onboarding_completed = true
        ORDER BY id
    `);

    console.log(`   Found ${users.length} onboarded users\n`);

    // ----------------------------------------------------------------
    // Collect all unique candidates across all users (for batch embedding)
    // ----------------------------------------------------------------

    // Map: normalized → { raw, type, userIds[] }
    const candidateMap = new Map<string, { raw: string; type: EntityType; userIds: string[] }>();

    function addCandidate(raw: string, type: EntityType, userId: string) {
        const norm = normalize(raw, type);
        if (!norm || norm.length < 2) return;

        const key = `${type}:${norm}`;
        if (candidateMap.has(key)) {
            candidateMap.get(key)!.userIds.push(userId);
        } else {
            candidateMap.set(key, { raw, type, userIds: [userId] });
        }

        // Ensure user entry exists
        if (!userLinks.has(userId)) {
            userLinks.set(userId, { skill: new Set(), role: new Set(), domain: new Set() });
        }

        stats.rawCandidatesFound[type]++;
    }

    for (const user of users) {
        const userId: string = user.id;

        if (!userLinks.has(userId)) {
            userLinks.set(userId, { skill: new Set(), role: new Set(), domain: new Set() });
        }

        const experience: Array<{
            position?: string;
            description?: string;
        }> = user.experience ?? [];

        const projects: Array<{
            role?: string;
            technologies?: string[];
            description?: string;
        }> = user.projects ?? [];

        // --- Roles from experience positions ---
        for (const exp of experience) {
            if (exp.position) addCandidate(exp.position, 'role', userId);
        }

        // --- Skills from experience descriptions ---
        for (const exp of experience) {
            const tokens = extractTokens(exp.description);
            for (const t of tokens) {
                addCandidate(t, 'skill', userId);
            }
        }

        // --- Skills and roles from projects ---
        for (const proj of projects) {
            if (proj.role) addCandidate(proj.role, 'role', userId);
            if (proj.technologies) {
                for (const tech of proj.technologies) {
                    if (tech) addCandidate(tech, 'skill', userId);
                }
            }
            const descTokens = extractTokens(proj.description);
            for (const t of descTokens) addCandidate(t, 'skill', userId);
        }

        // --- Current position as role ---
        if (user.current_position) addCandidate(user.current_position, 'role', userId);

        // --- Headline as skill/role hints ---
        if (user.headline) {
            for (const t of extractTokens(user.headline)) {
                addCandidate(t, 'skill', userId);
                addCandidate(t, 'role', userId);
            }
        }

        // --- Profile summary text ---
        if (user.profile_summary_text) {
            for (const t of extractTokens(user.profile_summary_text)) {
                addCandidate(t, 'skill', userId);
            }
        }

        stats.usersProcessed++;
    }

    const uniqueCandidates = candidateMap.size;
    const skillCandidates = [...candidateMap.values()].filter(c => c.type === 'skill').length;
    const roleCandidates = [...candidateMap.values()].filter(c => c.type === 'role').length;
    const domainCandidates = [...candidateMap.values()].filter(c => c.type === 'domain').length;

    console.log(`   ✅  ${uniqueCandidates} unique candidates (${skillCandidates} skills, ${roleCandidates} roles, ${domainCandidates} domains)\n`);

    // ----------------------------------------------------------------
    // Steps 2-4: Normalize + Match + Resolve — with batched embeddings
    // ----------------------------------------------------------------
    console.log('🔍  Steps 2-4: Normalizing, matching, and resolving candidates...\n');

    const entries = [...candidateMap.entries()];
    const normalizedTexts = entries.map(([_, c]) => c.raw);

    // Batch-generate all embeddings upfront
    console.log(`   Generating embeddings for ${entries.length} candidates (batch size ${EMBEDDING_BATCH_SIZE})...`);
    const embeddings = await batchGenerateEmbeddings(normalizedTexts);
    console.log(`   ✅  Embeddings generated\n`);

    // Process each unique candidate
    let processed = 0;
    for (const [key, candidateData] of candidateMap.entries()) {
        const { raw, type, userIds } = candidateData;
        const normalized = normalize(raw, type);
        const embedding = embeddings.get(raw) ?? null;

        const canonicalId = await matchCandidate(
            ds,
            { raw, normalized },
            type,
            embedding,
            stats,
        );

        if (canonicalId) {
            // Track the resolved canonical for each user
            for (const uid of userIds) {
                const links = userLinks.get(uid);
                if (links) {
                    links[type].add(canonicalId);
                }
            }
        }

        processed++;
        if (processed % 100 === 0) {
            process.stdout.write(`   ${processed}/${entries.length} candidates processed...\n`);
        }
    }

    console.log(`\n   ✅  All ${entries.length} candidates processed\n`);

    // ----------------------------------------------------------------
    // Step 5 — Recalculate usage counts
    // ----------------------------------------------------------------
    await recalculateUsageCounts(ds);

    // ----------------------------------------------------------------
    // Step 6 — Duplicate detection
    // ----------------------------------------------------------------
    await detectNearDuplicates(ds, stats);

    // ----------------------------------------------------------------
    // Step 7 — Update user bridge tables
    // ----------------------------------------------------------------
    console.log('\n🔗  Step 7: Updating user bridge tables...');

    for (const [userId, links] of userLinks.entries()) {
        // Skills
        for (const canonicalId of links.skill) {
            try {
                await ds.query(`
                    INSERT INTO user_skills (user_profile_id, canonical_skill_id)
                    VALUES ($1, $2)
                    ON CONFLICT (user_profile_id, canonical_skill_id) DO NOTHING
                `, [userId, canonicalId]);
                stats.bridgeRowsInserted++;
            } catch (e: any) {
                stats.errors++;
            }
        }

        // Roles
        for (const canonicalId of links.role) {
            try {
                await ds.query(`
                    INSERT INTO user_roles (user_profile_id, role_id)
                    VALUES ($1, $2)
                    ON CONFLICT (user_profile_id, role_id) DO NOTHING
                `, [userId, canonicalId]);
                stats.bridgeRowsInserted++;
            } catch (e: any) {
                stats.errors++;
            }
        }

        // Domains
        for (const canonicalId of links.domain) {
            try {
                await ds.query(`
                    INSERT INTO user_domains (user_profile_id, domain_id)
                    VALUES ($1, $2)
                    ON CONFLICT (user_profile_id, domain_id) DO NOTHING
                `, [userId, canonicalId]);
                stats.bridgeRowsInserted++;
            } catch (e: any) {
                stats.errors++;
            }
        }
    }

    console.log(`   ✅  ${stats.bridgeRowsInserted} bridge rows inserted\n`);

    // ----------------------------------------------------------------
    // Summary
    // ----------------------------------------------------------------
    console.log('\n' + '='.repeat(60));
    console.log('📊  INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Users processed:              ${stats.usersProcessed}`);
    console.log('');
    console.log('  SKILLS:');
    console.log(`    Raw candidates found:        ${stats.rawCandidatesFound.skill}`);
    console.log(`    Exact matches:               ${stats.exactMatches.skill}`);
    console.log(`    Alias matches:               ${stats.aliasMatches.skill}`);
    console.log(`    Auto-merged (>= ${(AUTO_MERGE_THRESHOLD * 100).toFixed(0)}%):      ${stats.autoMerged.skill}`);
    console.log(`    Review queued (${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}-${(AUTO_MERGE_THRESHOLD * 100).toFixed(0)}%):  ${stats.reviewQueued.skill}`);
    console.log(`    New created (< ${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}%):       ${stats.newCreated.skill}`);
    console.log('  ROLES:');
    console.log(`    Raw candidates found:        ${stats.rawCandidatesFound.role}`);
    console.log(`    Exact matches:               ${stats.exactMatches.role}`);
    console.log(`    Alias matches:               ${stats.aliasMatches.role}`);
    console.log(`    Auto-merged (>= ${(AUTO_MERGE_THRESHOLD * 100).toFixed(0)}%):      ${stats.autoMerged.role}`);
    console.log(`    Review queued (${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}-${(AUTO_MERGE_THRESHOLD * 100).toFixed(0)}%):  ${stats.reviewQueued.role}`);
    console.log(`    New created (< ${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}%):       ${stats.newCreated.role}`);
    console.log('  DOMAINS:');
    console.log(`    Raw candidates found:        ${stats.rawCandidatesFound.domain}`);
    console.log(`    Exact matches:               ${stats.exactMatches.domain}`);
    console.log(`    Alias matches:               ${stats.aliasMatches.domain}`);
    console.log(`    Auto-merged (>= ${(AUTO_MERGE_THRESHOLD * 100).toFixed(0)}%):      ${stats.autoMerged.domain}`);
    console.log(`    Review queued (${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}-${(AUTO_MERGE_THRESHOLD * 100).toFixed(0)}%):  ${stats.reviewQueued.domain}`);
    console.log(`    New created (< ${(REVIEW_QUEUE_THRESHOLD * 100).toFixed(0)}%):       ${stats.newCreated.domain}`);
    console.log('');
    console.log(`  Bridge rows inserted:         ${stats.bridgeRowsInserted}`);
    console.log(`  Duplicates flagged for review: ${stats.duplicatesFlagged}`);
    console.log(`  Errors:                       ${stats.errors}`);
    console.log('='.repeat(60));
    console.log();

    await ds.destroy();
    console.log('✅  Done!');
}

main().catch((e) => {
    console.error('\n💥  Fatal error:', e);
    process.exit(1);
});
