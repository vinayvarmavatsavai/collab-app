import { Client } from 'pg';

async function runMigration() {
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        user: process.env.DATABASE_USER || 'test',
        password: process.env.DATABASE_PASSWORD || 'test123',
        database: process.env.DATABASE_NAME || 'startup101_db',
    });

    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Enabling pg_trgm extension...');
        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        console.log('Creating GIN index on canonical_skills(normalized_name)...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_canonical_skills_trgm 
            ON canonical_skills 
            USING gin (normalized_name gin_trgm_ops)
        `);

        console.log('Creating GIN index on skill_aliases(normalized_alias)...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_skill_aliases_trgm 
            ON skill_aliases 
            USING gin (normalized_alias gin_trgm_ops)
        `);

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
