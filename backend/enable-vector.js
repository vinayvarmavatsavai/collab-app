const { Client } = require('pg');

const databases = ['startup101_db', 'test_db', 'postgres'];

async function tryConnect(dbName) {
  console.log(`Trying to connect to database: ${dbName}`);
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: dbName,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`Connected to ${dbName} successfully!`);
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log(`Successfully enabled vector extension on ${dbName}`);
    await client.end();
    return true;
  } catch (err) {
    console.error(`Failed to connect/enable on ${dbName}:`, err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  for (const db of databases) {
    if (await tryConnect(db)) {
      console.log('Success!');
      process.exit(0);
    }
  }
  console.error('Failed to enable vector extension on any database.');
  process.exit(1);
}

run();
