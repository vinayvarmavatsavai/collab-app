const { Client } = require('pg');

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: 'test',
    password: 'test123',
    database: 'startup101_db',
});

console.log('Connecting to DB...');
client.connect()
    .then(() => {
        console.log('Connected!');
        console.log('Enabling pg_trgm...');
        return client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    })
    .then(() => {
        console.log('Done pg_trgm. Creating indexes...');
        return client.query(`
            CREATE INDEX IF NOT EXISTS idx_canonical_skills_trgm 
            ON canonical_skills 
            USING gin (normalized_name gin_trgm_ops)
        `);
    })
    .then(() => {
        return client.query(`
            CREATE INDEX IF NOT EXISTS idx_skill_aliases_trgm 
            ON skill_aliases 
            USING gin (normalized_alias gin_trgm_ops)
        `);
    })
    .then(() => {
        console.log('Migration SUCCESS');
        process.exit(0);
    })
    .catch(err => {
        console.error('Migration FAILED:', err);
        process.exit(1);
    });
