
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from './src/matching/entities/domain.entity';
import { CanonicalSkill } from './src/matching/entities/canonical-skill.entity';
import { UserProfile } from './src/users/entities/user-profile.entity';
import { UserSkill } from './src/matching/entities/user-skill.entity';
import { ProjectRequest, ProjectStatus } from './src/matching/entities/project-request.entity';
import { ProjectRequiredSkill } from './src/matching/entities/project-required-skill.entity';
import { VectorMatchingService } from './src/matching/services/vector-matching.service';

async function verify() {
    process.env.NODE_ENV = 'test';
    const app = await NestFactory.createApplicationContext(AppModule);

    const skillRepo: Repository<CanonicalSkill> = app.get(getRepositoryToken(CanonicalSkill));
    const userRepo: Repository<UserProfile> = app.get(getRepositoryToken(UserProfile));
    const projectRepo: Repository<ProjectRequest> = app.get(getRepositoryToken(ProjectRequest));
    const userSkillRepo: Repository<UserSkill> = app.get(getRepositoryToken(UserSkill));
    const projectSkillRepo: Repository<ProjectRequiredSkill> = app.get(getRepositoryToken(ProjectRequiredSkill));
    const matchingService: VectorMatchingService = app.get(VectorMatchingService);

    // 0. Cleanup (using DELETE to avoid TRUNCATE FK issues)
    await projectSkillRepo.query('DELETE FROM project_required_skills');
    await userSkillRepo.query('DELETE FROM user_skills');
    await projectRepo.query('DELETE FROM project_requests');
    await userRepo.query('DELETE FROM user_profiles');

    // 1. Get skills
    const python = await skillRepo.findOneBy({ name: 'Python' });
    const go = await skillRepo.findOneBy({ name: 'Go' });

    if (!python || !go) {
        console.error('Skills not found. Seed might have failed.');
        await app.close();
        return;
    }

    // 2. Create User with Python
    const userId = '11111111-1111-1111-1111-111111111111';
    await userRepo.save({
        id: userId,
        identityId: userId, // Added
        bio: 'I am a Python developer',
        headline: 'Python expert',
        onboardingCompleted: true
    } as any);

    await userSkillRepo.save({
        userProfileId: userId,
        canonicalSkillId: python.id,
        proficiency: 5,
        yearsExperience: 3
    } as any);

    // 3. Create Project with Go
    const projectId = '22222222-2222-2222-2222-222222222222';
    const ownerId = '33333333-3333-3333-3333-333333333333';

    // Create another user for owner
    await userRepo.save({
        id: ownerId,
        identityId: ownerId, // Added
        onboardingCompleted: true
    } as any);

    await projectRepo.save({
        id: projectId,
        title: 'Go Project',
        description: 'Need a Go specialist',
        status: ProjectStatus.OPEN,
        visibilityMode: 'hybrid',
        matchingScope: 'GLOBAL',
        creatorId: ownerId,
        embedding: go.embedding // Mocking project embedding as skill embedding for test
    } as any);

    await projectSkillRepo.save({
        projectId: projectId,
        canonicalSkillId: go.id,
        importance: 5
    } as any);

    console.log('\n--- Running Matching for Project: Go ---');
    console.log(`User Skill: Python (ID: ${python.id})`);
    console.log(`Project Requirement: Go (ID: ${go.id})`);

    const project = await projectRepo.findOneBy({ id: projectId });
    if (!project) {
        console.error('Project not found');
        await app.close();
        return;
    }

    const results = await matchingService.matchCandidates(project);

    console.log('\n--- Results ---');
    if (results.length === 0) {
        console.log('No matches found (Safe - Correct behavior)');
    } else {
        results.forEach(r => {
            console.log(`User ID: ${r.userId} | Overall: ${r.score} | Skill Score: ${r.requiredSkillVectorScore}`);
        });
    }

    await app.close();
}

verify().catch(console.error);
