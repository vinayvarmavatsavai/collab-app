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

        console.log('Enabling fuzzystrmatch extension...');
        await client.query('CREATE EXTENSION IF NOT EXISTS fuzzystrmatch');

        console.log('Extensions setup completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
