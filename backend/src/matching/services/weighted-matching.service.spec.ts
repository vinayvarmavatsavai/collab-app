import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WeightedMatchingService } from './weighted-matching.service';
import { VectorSimilarityService } from './vector-similarity.service';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { UserSkill } from '../entities/user-skill.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserDomain } from '../entities/user-domain.entity';
import { UserProfileVector } from '../entities/user-profile-vector.entity';
import { ProjectRequiredSkill } from '../entities/project-required-skill.entity';
import { ProjectOptionalSkill } from '../entities/project-optional-skill.entity';
import { ProjectRequest } from '../entities/project-request.entity';
import { CommunityMember } from '../../communities/entities/community-member.entity';
import { ClubMember } from '../../communities/entities/club-member.entity';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
};

const mockRepository = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
});

const mockConfigService = {
    get: jest.fn().mockReturnValue({
        weights: {
            requiredSkills: 0.40,
            domain: 0.20,
            role: 0.15,
            optionalSkills: 0.10,
            profileSimilarity: 0.10,
            profileCompleteness: 0.05,
        },
        skillSimilarityThreshold: 0.40,
        defaultFindBestLimit: 20,
        defaultMinScore: 20,
    }),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WeightedMatchingService', () => {
    let service: WeightedMatchingService;
    let projectRepo: any;
    let userRepo: any;
    let communityMemberRepo: any;
    let clubMemberRepo: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WeightedMatchingService,
                VectorSimilarityService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: getRepositoryToken(UserProfile), useFactory: mockRepository },
                { provide: getRepositoryToken(UserSkill), useFactory: mockRepository },
                { provide: getRepositoryToken(UserRole), useFactory: mockRepository },
                { provide: getRepositoryToken(UserDomain), useFactory: mockRepository },
                { provide: getRepositoryToken(UserProfileVector), useFactory: mockRepository },
                { provide: getRepositoryToken(ProjectRequiredSkill), useFactory: mockRepository },
                { provide: getRepositoryToken(ProjectOptionalSkill), useFactory: mockRepository },
                { provide: getRepositoryToken(ProjectRequest), useFactory: mockRepository },
                { provide: getRepositoryToken(CommunityMember), useFactory: mockRepository },
                { provide: getRepositoryToken(ClubMember), useFactory: mockRepository },
            ],
        }).compile();

        service = module.get<WeightedMatchingService>(WeightedMatchingService);
        projectRepo = module.get(getRepositoryToken(ProjectRequest));
        userRepo = module.get(getRepositoryToken(UserProfile));
        communityMemberRepo = module.get(getRepositoryToken(CommunityMember));
        clubMemberRepo = module.get(getRepositoryToken(ClubMember));
    });

    // -----------------------------------------------------------------------
    // VectorSimilarityService unit tests
    // -----------------------------------------------------------------------

    describe('VectorSimilarityService', () => {
        let vecSvc: VectorSimilarityService;

        beforeEach(() => {
            vecSvc = new VectorSimilarityService(mockConfigService as any);
        });

        it('should compute cosine similarity correctly between identical vectors', () => {
            const v = [1, 0, 0];
            expect(vecSvc.cosineSimilarity(v, v)).toBeCloseTo(1.0);
        });

        it('should return 0 for orthogonal vectors', () => {
            expect(vecSvc.cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
        });

        it('should return 0 for null/empty inputs', () => {
            expect(vecSvc.cosineSimilarity(null, [1, 2, 3])).toBe(0);
            expect(vecSvc.cosineSimilarity([1, 2, 3], null)).toBe(0);
            expect(vecSvc.cosineSimilarity([], [])).toBe(0);
        });

        it('should return partial similarity for related vectors', () => {
            const python = [0.9, 0.3, 0.1];
            const django = [0.8, 0.4, 0.2]; // similar to python
            const sim = vecSvc.cosineSimilarity(python, django);
            expect(sim).toBeGreaterThan(0.9); // very similar
        });

        it('maxSimilarityAgainstList returns best match', () => {
            const query = [1, 0, 0];
            const candidates = [[0, 1, 0], [1, 0, 0], [0.5, 0.5, 0]];
            expect(vecSvc.maxSimilarityAgainstList(query, candidates)).toBeCloseTo(1.0);
        });

        it('weightedAverageSimilarity returns 0 when no user skills', () => {
            const req = [{ embedding: [1, 0, 0], weight: 5 }];
            expect(vecSvc.weightedAverageSimilarity(req, [], 0.4)).toBe(0);
        });

        it('weightedAverageSimilarity returns 1 when no requirements', () => {
            expect(vecSvc.weightedAverageSimilarity([], [[1, 0, 0]], 0.4)).toBe(1.0);
        });

        it('weightedAverageSimilarity respects threshold (sim < threshold → 0)', () => {
            // orthogonal → similarity = 0 → below threshold → contribute 0
            const req = [{ embedding: [1, 0, 0], weight: 1 }];
            const user = [[0, 1, 0]]; // orthogonal → 0 similarity
            expect(vecSvc.weightedAverageSimilarity(req, user, 0.4)).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // findBestMatches — scope filtering
    // -----------------------------------------------------------------------

    describe('findBestMatches - Scope Filtering', () => {
        it('should filter by GLOBAL scope (default)', async () => {
            projectRepo.findOne.mockResolvedValue({ id: 'p1', matchingScope: 'GLOBAL' });
            userRepo.find.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

            jest.spyOn(service, 'calculateMatchScoresBatch').mockResolvedValue([
                {
                    userId: 'u1',
                    matchPercentage: 80,
                    totalScore: 0.8,
                    breakdown: {
                        requiredSkills: { score: 0.9, weight: 0.4, matchedCount: 2, totalCount: 2 },
                        roleMatch: { score: 0.8, weight: 0.15 },
                        domainMatch: { score: 0.7, weight: 0.20 },
                        optionalSkills: { score: 0.5, weight: 0.10 },
                        profileSimilarity: { score: 0.6, weight: 0.10 },
                        profileCompleteness: { score: 0.8, weight: 0.05, percentage: 80 },
                    },
                },
            ]);

            const result = await service.findBestMatches('p1');

            expect(userRepo.find).toHaveBeenCalled();
            expect(communityMemberRepo.createQueryBuilder).not.toHaveBeenCalled();
            expect(result).toHaveLength(1);
        });

        it('should filter by COMMUNITY scope', async () => {
            projectRepo.findOne.mockResolvedValue({
                id: 'p1',
                matchingScope: 'COMMUNITY',
                communityIds: ['c1'],
            });

            mockQueryBuilder.getMany.mockResolvedValue([{ userId: 'u3' }]);

            jest.spyOn(service, 'calculateMatchScoresBatch').mockResolvedValue([
                {
                    userId: 'u3',
                    matchPercentage: 90,
                    totalScore: 0.9,
                    breakdown: {
                        requiredSkills: { score: 1.0, weight: 0.4, matchedCount: 1, totalCount: 1 },
                        roleMatch: { score: 0.9, weight: 0.15 },
                        domainMatch: { score: 0.8, weight: 0.20 },
                        optionalSkills: { score: 0.7, weight: 0.10 },
                        profileSimilarity: { score: 0.85, weight: 0.10 },
                        profileCompleteness: { score: 1.0, weight: 0.05, percentage: 100 },
                    },
                },
            ]);

            const result = await service.findBestMatches('p1');

            expect(userRepo.find).not.toHaveBeenCalled();
            expect(communityMemberRepo.createQueryBuilder).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('u3');
        });

        it('should filter by CLUB scope', async () => {
            projectRepo.findOne.mockResolvedValue({
                id: 'p1',
                matchingScope: 'CLUB',
                clubIds: ['cl1'],
            });

            mockQueryBuilder.getMany.mockResolvedValue([{ userId: 'u4' }]);

            jest.spyOn(service, 'calculateMatchScoresBatch').mockResolvedValue([
                {
                    userId: 'u4',
                    matchPercentage: 95,
                    totalScore: 0.95,
                    breakdown: {
                        requiredSkills: { score: 1.0, weight: 0.4, matchedCount: 2, totalCount: 2 },
                        roleMatch: { score: 1.0, weight: 0.15 },
                        domainMatch: { score: 0.9, weight: 0.20 },
                        optionalSkills: { score: 0.8, weight: 0.10 },
                        profileSimilarity: { score: 0.9, weight: 0.10 },
                        profileCompleteness: { score: 1.0, weight: 0.05, percentage: 100 },
                    },
                },
            ]);

            const result = await service.findBestMatches('p1');

            expect(userRepo.find).not.toHaveBeenCalled();
            expect(clubMemberRepo.createQueryBuilder).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('u4');
        });
    });

    // -----------------------------------------------------------------------
    // MatchScore interface shape
    // -----------------------------------------------------------------------

    describe('MatchScore shape', () => {
        it('score breakdown has all 6 required dimensions', async () => {
            jest.spyOn(service, 'calculateMatchScoresBatch').mockResolvedValue([
                {
                    userId: 'u1',
                    matchPercentage: 72,
                    totalScore: 0.72,
                    breakdown: {
                        requiredSkills: { score: 0.75, weight: 0.40, matchedCount: 3, totalCount: 4 },
                        roleMatch: { score: 0.80, weight: 0.15 },
                        domainMatch: { score: 0.65, weight: 0.20 },
                        optionalSkills: { score: 0.50, weight: 0.10 },
                        profileSimilarity: { score: 0.60, weight: 0.10 },
                        profileCompleteness: { score: 0.80, weight: 0.05, percentage: 80 },
                    },
                },
            ]);

            projectRepo.findOne.mockResolvedValue({ id: 'p1', matchingScope: 'GLOBAL' });
            userRepo.find.mockResolvedValue([{ id: 'u1' }]);

            const result = await service.findBestMatches('p1');
            expect(result[0].breakdown).toHaveProperty('requiredSkills');
            expect(result[0].breakdown).toHaveProperty('roleMatch');
            expect(result[0].breakdown).toHaveProperty('domainMatch');
            expect(result[0].breakdown).toHaveProperty('optionalSkills');
            expect(result[0].breakdown).toHaveProperty('profileSimilarity');
            expect(result[0].breakdown).toHaveProperty('profileCompleteness');
            // Scores should be continuous (not exactly 0 or 1)
            expect(result[0].breakdown.requiredSkills.score).toBeGreaterThan(0);
            expect(result[0].breakdown.requiredSkills.score).toBeLessThan(1);
        });
    });
});
