
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EmbeddingService } from './src/matching/services/embedding.service';

async function test() {
    console.log('--- Starting Embedding Test ---');
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(EmbeddingService);

    const inputs = [
        'Technical Skill: Python. Primary Domain: Backend',
        'Technical Skill: Go. Primary Domain: Backend',
        'Technical Skill: JavaScript. Primary Domain: Frontend',
    ];

    for (const input of inputs) {
        const emb = await service.generateEmbedding(input);
        console.log(`\nInput: "${input}"`);
        if (emb) {
            console.log(`Embedding Length: ${emb.length}`);
            console.log(`Embedding (first 5): ${emb.slice(0, 5)}`);
        } else {
            console.log('Embedding: NULL');
        }
    }

    await app.close();
    console.log('\n--- Test Finished ---');
}

test().catch(console.error);
