
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
        
        console.log('--- Matching Test ---');
        // Creator ID: 68948637-312f-4b91-afa9-5973411f2c62 (user1)
        // Project ID: ca389fcd-468f-401c-957b-18b3733bbf56
        const query = `
            SELECT upv.user_profile_id 
            FROM user_profile_vectors upv
            INNER JOIN user_profiles up ON up.id = upv.user_profile_id
            WHERE upv.user_profile_id != '68948637-312f-4b91-afa9-5973411f2c62'
            AND up."isProfilePublic" = true
            AND up."onboardingCompleted" = true
            AND (
                upv.metadata->'domains' ?| ARRAY['Web Development'] 
            )
            AND (
                upv.metadata->'skills' ?| ARRAY['Rust', 'Next.js']
            );
        `;
        
        const result = await client.query(query);
        console.log('Eligible Candidates:', result.rows);

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await client.end();
    }
}

run();
