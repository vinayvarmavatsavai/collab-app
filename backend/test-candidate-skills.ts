import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSkill } from './src/matching/entities/user-skill.entity';
import { CanonicalSkill } from './src/matching/entities/canonical-skill.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userSkillRepo: Repository<UserSkill> = app.get(getRepositoryToken(UserSkill));
    const skillRepo: Repository<CanonicalSkill> = app.get(getRepositoryToken(CanonicalSkill));

    // The user that was early rejected
    const candidateId = '676dbaba-acbe-4246-8a9a-653dc6640018';

    const userSkills = await userSkillRepo.find({
        where: { userProfileId: candidateId },
        relations: ['canonicalSkill', 'canonicalSkill.primaryDomain'],
    });

    console.log(`\nCandidate: ${candidateId}`);
    console.log(`Skills:`);
    userSkills.forEach(us => {
        if (us.canonicalSkill) {
            console.log(`- ${us.canonicalSkill.name} (Domain ID: ${us.canonicalSkill.primaryDomainId})`);
        } else {
            console.log(`- Unknown skill`);
        }
    });

    // Check NestJS domain
    const nestjs = await skillRepo.findOne({
        where: { name: 'NestJS' },
        relations: ['primaryDomain']
    });

    console.log(`\nNestJS Domain ID: ${nestjs?.primaryDomainId}`);

    await app.close();
}
bootstrap();
