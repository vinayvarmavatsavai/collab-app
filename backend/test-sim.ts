import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CanonicalSkill } from './src/matching/entities/canonical-skill.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo: Repository<CanonicalSkill> = app.get(getRepositoryToken(CanonicalSkill));

    const skills = ['Python', 'Go'];
    const records = await repo.createQueryBuilder('cs')
        .where('cs.name IN (:...skills)', { skills })
        .getMany();

    const getEmbedding = (name: string) => {
        const record = records.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (!record || !record.embedding) return null;
        return typeof record.embedding === 'string' ? JSON.parse(record.embedding) : record.embedding;
    };

    const python = getEmbedding('Python');
    const go = getEmbedding('Go');

    const cosSim = (a: number[], b: number[]) => {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    if (python && go) {
        console.log('Python <-> Go similarity:', cosSim(python, go));
    } else {
        console.log('Could not find embeddings for one or both skills.');
        console.log('Python present?', !!python);
        console.log('Go present?', !!go);
    }

    await app.close();
}
bootstrap();
