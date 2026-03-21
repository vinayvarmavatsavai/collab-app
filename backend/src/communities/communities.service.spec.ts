
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { CommunitiesService } from './communities.service';
import { Community } from './entities/community.entity';
import { CommunityMember, CommunityRole } from './entities/community-member.entity';
import { Club } from './entities/club.entity';
import { ClubMember } from './entities/club-member.entity';
import { InstitutionClaim, ClaimStatus } from './entities/institution-claim.entity';
import { CommunityType } from './enums/community-type.enum';
import { GovernanceMode } from './enums/governance-mode.enum';

const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    manager: {
        connection: {
            createQueryRunner: jest.fn().mockReturnValue({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: {
                    save: jest.fn(),
                    update: jest.fn(),
                }
            })
        }
    }
});

const mockQueue = () => ({
    add: jest.fn(),
});

describe('CommunitiesService', () => {
    let service: CommunitiesService;
    let communityRepo: any;
    let memberRepo: any;
    let claimRepo: any;
    let queue: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommunitiesService,
                { provide: getRepositoryToken(Community), useFactory: mockRepository },
                { provide: getRepositoryToken(CommunityMember), useFactory: mockRepository },
                { provide: getRepositoryToken(Club), useFactory: mockRepository },
                { provide: getRepositoryToken(ClubMember), useFactory: mockRepository },
                { provide: getRepositoryToken(InstitutionClaim), useFactory: mockRepository },
                { provide: getQueueToken('institution-claims-review'), useFactory: mockQueue },
            ],
        }).compile();

        service = module.get<CommunitiesService>(CommunitiesService);
        communityRepo = module.get(getRepositoryToken(Community));
        memberRepo = module.get(getRepositoryToken(CommunityMember));
        claimRepo = module.get(getRepositoryToken(InstitutionClaim));
        queue = module.get(getQueueToken('institution-claims-review'));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('handleNewUser', () => {
        it('should ignore generic domains', async () => {
            await service.handleNewUser('test@gmail.com', 'user1');
            expect(communityRepo.findOne).not.toHaveBeenCalled();
        });

        it('should create new institution for new domain', async () => {
            communityRepo.findOne.mockResolvedValue(null);
            communityRepo.create.mockReturnValue({ id: 'comm1', name: 'stanford.edu' });
            communityRepo.save.mockResolvedValue({ id: 'comm1', name: 'stanford.edu' });
            memberRepo.findOne.mockResolvedValue(null);

            await service.handleNewUser('test@stanford.edu', 'user1');

            expect(communityRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                institutionDomain: 'stanford.edu',
                type: CommunityType.INSTITUTION,
                governanceMode: GovernanceMode.SYSTEM_MANAGED
            }));
            expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                communityId: 'comm1',
                userId: 'user1',
                role: CommunityRole.MEMBER
            }));
        });

        it('should join existing institution', async () => {
            communityRepo.findOne.mockResolvedValue({ id: 'comm1', name: 'stanford.edu' });
            memberRepo.findOne.mockResolvedValue(null);

            await service.handleNewUser('test@stanford.edu', 'user1');

            expect(communityRepo.create).not.toHaveBeenCalled();
            expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                communityId: 'comm1',
                userId: 'user1'
            }));
        });
    });

    describe('claimInstitution', () => {
        it('should create claim', async () => {
            const community = { id: 'comm1', type: CommunityType.INSTITUTION, isInstitutionVerified: false };
            const member = { communityId: 'comm1', userId: 'user1' };

            communityRepo.findOne.mockResolvedValue(community);
            memberRepo.findOne.mockResolvedValue(member);
            claimRepo.findOne.mockResolvedValue(null);
            claimRepo.create.mockReturnValue({ id: 'claim1' });
            claimRepo.save.mockResolvedValue({ id: 'claim1' });

            await service.claimInstitution('comm1', 'user1', { doc: 'proof' });

            expect(claimRepo.save).toHaveBeenCalled();
            expect(queue.add).toHaveBeenCalledWith('review-claim', { claimId: 'claim1' });
        });
    });
});
