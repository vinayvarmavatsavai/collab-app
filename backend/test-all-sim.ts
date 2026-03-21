import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CanonicalSkill } from './src/matching/entities/canonical-skill.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo: Repository<CanonicalSkill> = app.get(getRepositoryToken(CanonicalSkill));

    const records = await repo.find({ take: 5 });

    records.forEach(r => {
        let emb = r.embedding;
        if (typeof emb === 'string') emb = JSON.parse(emb);
        console.log(`Skill: ${r.name}`);
        console.log(`First 5 dimensions: ${emb?.slice(0, 5)}`);
    });

    await app.close();
}
bootstrap();
