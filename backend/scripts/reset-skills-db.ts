import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'test',
    password: process.env.DATABASE_PASSWORD || 'test123',
    database: process.env.DATABASE_NAME || 'startup101_db',
});

async function resetSkills() {
    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Clear tables
        console.log('Clearing skill tables...');
        await client.query('TRUNCATE TABLE skill_review_queue, skill_aliases, user_skills, canonical_skills CASCADE');

        // 2. Read seed file
        const seedFilePath = path.join(__dirname, '../migrations/seed-skills.sql');
        console.log(`Reading seed file from ${seedFilePath}...`);
        const seedSql = fs.readFileSync(seedFilePath, 'utf-8');

        // 3. Execute seed SQL
        console.log('Seeding skills from SQL file...');
        await client.query(seedSql);

        console.log('Successfully seeded skills from SQL file.');

    } catch (err) {
        console.error('Reset failed:', err);
    } finally {
        await client.end();
    }
}

resetSkills();
