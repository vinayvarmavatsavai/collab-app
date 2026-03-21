import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
        });
        if (!res.ok) return null;
        const data = await res.json() as any;
        return data.embedding ?? null;
    } catch (e: any) {
        return null;
    }
}

async function embedTable(ds: DataSource, table: string) {
    console.log(`Processing table: ${table}...`);
    const rows = await ds.query(`SELECT id, name, category FROM ${table} WHERE embedding IS NULL`);
    console.log(`Found ${rows.length} rows missing embeddings.`);

    let embedded = 0;
    for (const row of rows) {
        const text = `${row.name} ${row.category}`;
        const emb = await generateEmbedding(text);
        if (emb) {
            const embLiteral = `'[${emb.join(',')}]'::vector`;
            await ds.query(`UPDATE ${table} SET embedding = ${embLiteral} WHERE id = $1`, [row.id]);
            embedded++;
        }
    }
    console.log(`✅ ${table}: Embedded ${embedded}/${rows.length} rows.`);
}

async function main() {
    console.log(`\n🚀 Generating Embeddings for Existing SQL Data (Ollama: ${OLLAMA_URL})\n`);

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

    await embedTable(ds, 'canonical_skills');
    await embedTable(ds, 'professional_roles');
    await embedTable(ds, 'domains');

    console.log('\n✨ DONE\n');
    await ds.destroy();
}

main().catch(console.error);
