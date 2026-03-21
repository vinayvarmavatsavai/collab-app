
import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { UsersService } from '../users/services/users/users.service';
import { Community } from './entities/community.entity';
import { CommunityMember, CommunityRole } from './entities/community-member.entity';
import { Club } from './entities/club.entity';
import { ClubMember, ClubRole, ClubMemberStatus } from './entities/club-member.entity';
import { InstitutionClaim, ClaimStatus } from './entities/institution-claim.entity';
import { CommunityType } from './enums/community-type.enum';
import { GovernanceMode } from './enums/governance-mode.enum';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateClubDto } from './dto/create-club.dto';

@Injectable()
export class CommunitiesService {
    private readonly logger = new Logger(CommunitiesService.name);
    private readonly GENERIC_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

    constructor(
        @InjectRepository(Community)
        private readonly communityRepo: Repository<Community>,
        @InjectRepository(CommunityMember)
        private readonly communityMemberRepo: Repository<CommunityMember>,
        @InjectRepository(Club)
        private readonly clubRepo: Repository<Club>,
        @InjectRepository(ClubMember)
        private readonly clubMemberRepo: Repository<ClubMember>,
        @InjectRepository(InstitutionClaim)
        private readonly claimRepo: Repository<InstitutionClaim>,
        @InjectQueue('institution-claims-review')
        private readonly claimsQueue: Queue,
        private readonly usersService: UsersService,
    ) { }

    private async getProfileId(identityId: string): Promise<string> {
        const profile = await this.usersService.getProfileByIdentity(identityId);
        if (!profile) throw new NotFoundException('User profile not found');
        return profile.id;
    }

    async create(createCommunityDto: CreateCommunityDto, identityId: string) {
        const profileId = await this.getProfileId(identityId);

        const existing = await this.communityRepo.findOne({
            where: { slug: createCommunityDto.slug },
        });
        if (existing) {
            throw new ConflictException('Community slug already taken');
        }

        const community = this.communityRepo.create({
            ...createCommunityDto,
            ownerId: profileId,
            type: createCommunityDto.type || CommunityType.PUBLIC,
            governanceMode: createCommunityDto.governanceMode || GovernanceMode.USER_MANAGED,
        });

        const savedCommunity = await this.communityRepo.save(community);

        await this.communityMemberRepo.save({
            communityId: savedCommunity.id,
            userId: profileId,
            role: CommunityRole.OWNER,
        });

        return savedCommunity;
    }

    async findAll() {
        return this.communityRepo.find();
    }

    async findOne(id: string) {
        const community = await this.communityRepo.findOne({
            where: { id },
            relations: ['clubs'],
        });
        if (!community) throw new NotFoundException('Community not found');
        return community;
    }

    async handleNewUser(email: string, userId: string) {
        const domain = email.split('@')[1];
        if (!domain || this.GENERIC_DOMAINS.includes(domain)) {
            return;
        }

        let community = await this.communityRepo.findOne({
            where: { institutionDomain: domain },
        });

        if (!community) {
            // Create new institution community
            // Slug: try domain first, then domain-random
            const slug = await this.generateUniqueSlug(domain);

            community = this.communityRepo.create({
                name: domain,
                slug,
                institutionDomain: domain,
                type: CommunityType.INSTITUTION,
                governanceMode: GovernanceMode.SYSTEM_MANAGED,
            });

            try {
                community = await this.communityRepo.save(community);
                this.logger.log(`Created new institution community for ${domain}`);
            } catch (e) {
                // Handle race condition if created in parallel
                if (e.code === '23505') { // Unique constraint violation
                    community = await this.communityRepo.findOne({ where: { institutionDomain: domain } });
                } else {
                    throw e;
                }
            }
        }

        if (community) {
            // idempotency check performed by ON CONFLICT in parallel safe insert, or explicit check
            const existingMember = await this.communityMemberRepo.findOne({
                where: { communityId: community.id, userId }
            });

            if (!existingMember) {
                await this.communityMemberRepo.save({
                    communityId: community.id,
                    userId,
                    role: CommunityRole.MEMBER,
                });
                this.logger.log(`Added user ${userId} to community ${community.name}`);
            }
        }
    }

    async join(communityId: string, identityId: string) {
        const profileId = await this.getProfileId(identityId);
        const community = await this.findOne(communityId);

        const existingMember = await this.communityMemberRepo.findOne({
            where: { communityId, userId: profileId }
        });

        if (existingMember) {
            throw new ConflictException('Already a member of this community');
        }

        // Check if community is private/invite-only?
        if (community.type === CommunityType.PRIVATE) {
            throw new ForbiddenException('Cannot join private community directly');
        }

        const member = this.communityMemberRepo.create({
            communityId,
            userId: profileId,
            role: CommunityRole.MEMBER,
        });

        return this.communityMemberRepo.save(member);
    }

    private async generateUniqueSlug(base: string): Promise<string> {
        let slug = base.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let exists = await this.communityRepo.findOne({ where: { slug } });
        if (!exists) return slug;

        let counter = 1;
        while (exists) {
            const newSlug = `${slug}-${counter}`;
            exists = await this.communityRepo.findOne({ where: { slug: newSlug } });
            if (!exists) return newSlug;
            counter++;
        }
        return slug;
    }

    async claimInstitution(communityId: string, identityId: string, evidence: any) {
        const profileId = await this.getProfileId(identityId);
        const community = await this.findOne(communityId);

        if (community.type !== CommunityType.INSTITUTION) {
            throw new BadRequestException('Can only claim institution communities');
        }

        if (community.isInstitutionVerified) {
            throw new ConflictException('Institution already verified');
        }

        const member = await this.communityMemberRepo.findOne({
            where: { communityId, userId: profileId },
        });

        if (!member) {
            throw new ForbiddenException('Must be a member to claim institution');
        }

        const existingClaim = await this.claimRepo.findOne({
            where: { communityId, status: ClaimStatus.PENDING },
        });

        if (existingClaim) {
            // Optionally allow multiple claims or block.
            if (existingClaim.requestedBy === profileId) {
                throw new ConflictException('You already have a pending claim');
            }
        }

        const claim = this.claimRepo.create({
            communityId,
            requestedBy: profileId,
            status: ClaimStatus.PENDING,
            evidence,
        });

        await this.claimRepo.save(claim);

        // Add to Bull queue
        await this.claimsQueue.add('review-claim', { claimId: claim.id });

        return claim;
    }


    async findPendingClaims(limit = 50, offset = 0) {
        return this.claimRepo.find({
            where: { status: ClaimStatus.PENDING },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async approveClaim(claimId: string, adminId: string) {
        const claim = await this.claimRepo.findOne({ where: { id: claimId } });
        if (!claim) throw new NotFoundException('Claim not found');

        if (claim.status !== ClaimStatus.PENDING) {
            throw new BadRequestException('Claim is not pending');
        }

        const community = await this.findOne(claim.communityId);

        // DB Transaction
        const queryRunner = this.communityRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update Claim
            claim.status = ClaimStatus.APPROVED;
            claim.reviewedBy = adminId;
            claim.reviewedAt = new Date();
            await queryRunner.manager.save(claim);

            // Update Community
            community.governanceMode = GovernanceMode.INSTITUTION_MANAGED;
            community.isInstitutionVerified = true;
            community.verifiedAt = new Date();
            community.ownerId = claim.requestedBy;
            await queryRunner.manager.save(community);

            // Update Member Role to OWNER
            await queryRunner.manager.update(CommunityMember,
                { communityId: community.id, userId: claim.requestedBy },
                { role: CommunityRole.OWNER }
            );

            // Reject other pending claims for this community
            await queryRunner.manager.update(InstitutionClaim,
                { communityId: community.id, status: ClaimStatus.PENDING },
                { status: ClaimStatus.REJECTED, reviewedBy: adminId, reviewedAt: new Date() }
            );

            await queryRunner.commitTransaction();
            this.logger.log(`Claim ${claimId} approved by ${adminId}`);
            return claim;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async rejectClaim(claimId: string, adminId: string) {
        const claim = await this.claimRepo.findOne({ where: { id: claimId } });
        if (!claim) throw new NotFoundException('Claim not found');

        claim.status = ClaimStatus.REJECTED;
        claim.reviewedBy = adminId;
        claim.reviewedAt = new Date();

        return this.claimRepo.save(claim);
    }

    async createClub(communityId: string, identityId: string, dto: CreateClubDto) {
        const profileId = await this.getProfileId(identityId);
        const community = await this.findOne(communityId);

        const member = await this.communityMemberRepo.findOne({ where: { communityId, userId: profileId } });
        if (!member) throw new ForbiddenException('Not a member of this community');

        // Permission check...
        const isAdmin = member.role === CommunityRole.ADMIN || member.role === CommunityRole.OWNER;

        if (community.governanceMode === GovernanceMode.SYSTEM_MANAGED && !isAdmin) {
            throw new ForbiddenException('Only admins can create clubs in this community.');
        }

        if (community.governanceMode === GovernanceMode.INSTITUTION_MANAGED && !isAdmin) {
            throw new ForbiddenException('Only institution admins can create clubs.');
        }



        const club = this.clubRepo.create({
            ...dto,
            communityId,
            createdBy: profileId
        });

        const saved = await this.clubRepo.save(club);

        await this.clubMemberRepo.save({
            clubId: saved.id,
            userId: profileId,
            role: ClubRole.ADMIN,
            status: ClubMemberStatus.ACTIVE
        });

        return saved;
    }

    async findClub(id: string) {
        const club = await this.clubRepo.findOne({ where: { id }, relations: ['community'] });
        if (!club) throw new NotFoundException('Club not found');
        return club;
    }

    async joinClub(clubId: string, identityId: string) {
        const profileId = await this.getProfileId(identityId);
        const club = await this.clubRepo.findOne({ where: { id: clubId }, relations: ['community'] });
        if (!club) throw new NotFoundException('Club not found');

        // Check community membership
        const commMember = await this.communityMemberRepo.findOne({
            where: { communityId: club.communityId, userId: profileId }
        });
        if (!commMember) throw new ForbiddenException('Must be a community member to join a club');

        const existing = await this.clubMemberRepo.findOne({ where: { clubId, userId: profileId } });
        if (existing) {
            if (existing.status === ClubMemberStatus.PENDING) throw new ConflictException('Join request already pending');
            if (existing.status === ClubMemberStatus.ACTIVE) throw new ConflictException('Already a member of this club');
            if (existing.status === ClubMemberStatus.REJECTED) throw new ConflictException('Previous request was rejected');
        }

        const member = this.clubMemberRepo.create({
            clubId,
            userId: profileId,
            role: ClubRole.MEMBER,
            status: ClubMemberStatus.PENDING
        });

        return this.clubMemberRepo.save(member);
    }

    async promoteToAdmin(communityId: string, targetUserId: string, adminIdentityId: string) {
        const adminProfileId = await this.getProfileId(adminIdentityId);

        // Verify Requester is Admin/Owner
        const adminMember = await this.communityMemberRepo.findOne({
            where: { communityId, userId: adminProfileId }
        });

        if (!adminMember || (adminMember.role !== CommunityRole.ADMIN && adminMember.role !== CommunityRole.OWNER)) {
            throw new ForbiddenException('Only community admins can promote members');
        }

        const targetMember = await this.communityMemberRepo.findOne({
            where: { communityId, userId: targetUserId }
        });

        if (!targetMember) throw new NotFoundException('Member not found');

        targetMember.role = CommunityRole.ADMIN;
        return this.communityMemberRepo.save(targetMember);
    }

    async getClubMembers(clubId: string, status?: ClubMemberStatus) {
        return this.clubMemberRepo.find({
            where: { clubId, ...(status && { status }) },
            relations: ['user', 'user.identity']
        });
    }

    async respondToClubRequest(clubId: string, memberId: string, status: ClubMemberStatus, adminIdentityId: string) {
        const adminProfileId = await this.getProfileId(adminIdentityId);

        // Verify Admin (Club Admin OR Community Admin/Owner)
        const adminMember = await this.clubMemberRepo.findOne({ where: { clubId, userId: adminProfileId } });
        const isClubAdmin = adminMember && adminMember.role === ClubRole.ADMIN && adminMember.status === ClubMemberStatus.ACTIVE;

        if (!isClubAdmin) {
            // Check if Community Admin
            const club = await this.clubRepo.findOne({ where: { id: clubId } });
            if (!club) throw new NotFoundException('Club not found');

            const communityMember = await this.communityMemberRepo.findOne({
                where: { communityId: club.communityId, userId: adminProfileId }
            });

            const isCommunityAdmin = communityMember && (communityMember.role === CommunityRole.ADMIN || communityMember.role === CommunityRole.OWNER);

            if (!isCommunityAdmin) {
                throw new ForbiddenException('Only club admins or community admins can manage requests');
            }
        }

        const targetMember = await this.clubMemberRepo.findOne({ where: { id: memberId, clubId } });
        if (!targetMember) throw new NotFoundException('Member request not found');

        targetMember.status = status;
        if (status === ClubMemberStatus.REJECTED) {
            // Option: delete or keep as rejected
            return this.clubMemberRepo.save(targetMember);
        }
        return this.clubMemberRepo.save(targetMember);
    }

    async promoteToClubAdmin(clubId: string, memberId: string, adminIdentityId: string) {
        const adminProfileId = await this.getProfileId(adminIdentityId);

        // Verify Admin (Club Admin OR Community Admin/Owner)
        const adminMember = await this.clubMemberRepo.findOne({ where: { clubId, userId: adminProfileId } });
        const isClubAdmin = adminMember && adminMember.role === ClubRole.ADMIN && adminMember.status === ClubMemberStatus.ACTIVE;

        if (!isClubAdmin) {
            // Check if Community Admin
            const club = await this.clubRepo.findOne({ where: { id: clubId } });
            if (!club) throw new NotFoundException('Club not found');

            const communityMember = await this.communityMemberRepo.findOne({
                where: { communityId: club.communityId, userId: adminProfileId }
            });

            const isCommunityAdmin = communityMember && (communityMember.role === CommunityRole.ADMIN || communityMember.role === CommunityRole.OWNER);

            if (!isCommunityAdmin) {
                throw new ForbiddenException('Only club admins or community admins can promote members');
            }
        }

        const targetMember = await this.clubMemberRepo.findOne({ where: { id: memberId, clubId } });
        if (!targetMember) throw new NotFoundException('Member not found');

        targetMember.role = ClubRole.ADMIN;
        return this.clubMemberRepo.save(targetMember);
    }

    async demoteCommunityMember(communityId: string, memberId: string, adminIdentityId: string) {
        const adminProfileId = await this.getProfileId(adminIdentityId);

        // Verify Requester is ADMIN or OWNER
        const adminMember = await this.communityMemberRepo.findOne({
            where: { communityId, userId: adminProfileId }
        });

        if (!adminMember || (adminMember.role !== CommunityRole.ADMIN && adminMember.role !== CommunityRole.OWNER)) {
            throw new ForbiddenException('Only community admins or owners can demote members');
        }

        const targetMember = await this.communityMemberRepo.findOne({
            where: { communityId, userId: memberId } // memberId is userId
        });

        if (!targetMember) throw new NotFoundException('Member not found');

        if (targetMember.role === CommunityRole.OWNER) {
            throw new ForbiddenException('Cannot demote community owner');
        }

        targetMember.role = CommunityRole.MEMBER;
        return this.communityMemberRepo.save(targetMember);
    }

    async demoteClubMember(clubId: string, memberId: string, adminIdentityId: string) {
        const adminProfileId = await this.getProfileId(adminIdentityId);

        // Verify Admin (Club Admin OR Community Admin/Owner)
        const adminMember = await this.clubMemberRepo.findOne({ where: { clubId, userId: adminProfileId } });
        const isClubAdmin = adminMember && adminMember.role === ClubRole.ADMIN && adminMember.status === ClubMemberStatus.ACTIVE;

        let isCommunityAdmin = false;
        if (!isClubAdmin) {
            // Check if Community Admin
            const club = await this.clubRepo.findOne({ where: { id: clubId } });
            if (!club) throw new NotFoundException('Club not found');

            const communityMember = await this.communityMemberRepo.findOne({
                where: { communityId: club.communityId, userId: adminProfileId }
            });

            isCommunityAdmin = !!(communityMember && (communityMember.role === CommunityRole.ADMIN || communityMember.role === CommunityRole.OWNER));

            if (!isCommunityAdmin) {
                throw new ForbiddenException('Only club admins or community admins can demote members');
            }
        }

        const targetMember = await this.clubMemberRepo.findOne({ where: { id: memberId, clubId } });
        if (!targetMember) throw new NotFoundException('Member not found');

        targetMember.role = ClubRole.MEMBER;
        return this.clubMemberRepo.save(targetMember);
    }

    async getCommunityMembers(communityId: string) {
        return this.communityMemberRepo.find({
            where: { communityId },
            relations: ['user', 'user.identity']
        });
    }

    async findMyCommunities(identityId: string) {
        const profileId = await this.getProfileId(identityId);
        return this.communityMemberRepo.find({
            where: { userId: profileId },
            relations: ['community'],
        });
    }

    async findMyClubs(identityId: string) {
        const profileId = await this.getProfileId(identityId);
        return this.clubMemberRepo.find({
            where: { userId: profileId },
            relations: ['club'],
        });
    }
}
