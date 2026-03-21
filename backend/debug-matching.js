
const { Client } = require('pg');

async function run() {
    const client = new Client({
        user: 'test',
        host: 'localhost',
        database: 'startup101_db',
        password: 'test123',
        port: 5432,
    });

    try {
        await client.connect();
        
        console.log('--- Matching Check ---');
        // Creator ID: 68948637... (user1)
        // Project ID: ca389fcd...
        // Target User: c172e6b8... (User32)

        const query = `
            SELECT upv.user_profile_id 
            FROM user_profile_vectors upv
            INNER JOIN user_profiles up ON up.id = upv.user_profile_id
            WHERE upv.user_profile_id = 'c172e6b8-ff17-4359-aad6-15dba81d11e5'
            AND upv.user_profile_id != '68948637-312f-4b91-afa9-5973411f2c62'
            AND up."isProfilePublic" = true
            AND (
                upv.metadata->'domains' ?| ARRAY['Web Development'] 
            )
            AND (
                upv.metadata->'skills' ?| ARRAY['Rust', 'Next.js']
            );
        `;
        
        const result = await client.query(query);
        console.log(`Found candidate: ${result.rowCount > 0}`);
        if (result.rowCount > 0) {
            console.log('User ID:', result.rows[0].user_profile_id);
        } else {
            console.log('No match found by query.');
        }

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await client.end();
    }
}

run();
