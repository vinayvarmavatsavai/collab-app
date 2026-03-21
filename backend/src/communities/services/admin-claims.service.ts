import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionClaim, ClaimStatus } from '../entities/institution-claim.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { CommunityMember, CommunityRole } from '../entities/community-member.entity';
import { CreateAdminClaimDto } from '../dto/create-admin-claim.dto';
import { ReviewAdminClaimDto } from '../dto/review-admin-claim.dto';
import { Identity, IdentityStatus } from '../../auth/entities/identity.entity';
import { Community } from '../entities/community.entity';
import { GovernanceMode } from '../enums/governance-mode.enum';

@Injectable()
export class AdminClaimsService {
    constructor(
        @InjectRepository(InstitutionClaim)
        private claimsRepo: Repository<InstitutionClaim>,
        @InjectRepository(UserProfile)
        private profilesRepo: Repository<UserProfile>,
        @InjectRepository(CommunityMember)
        private membersRepo: Repository<CommunityMember>,
        @InjectRepository(Identity)
        private identitiesRepo: Repository<Identity>,
        @InjectRepository(Community)
        private communitiesRepo: Repository<Community>,
    ) { }

    async createClaim(userId: string, communityId: string, dto: CreateAdminClaimDto) {
        // 1. Fetch User and Identity
        const profile = await this.profilesRepo.findOne({ where: { identityId: userId } });
        const identity = await this.identitiesRepo.findOne({ where: { id: userId } });

        if (!profile || !identity) throw new NotFoundException('User profile not found');

        // 2. Eligibility Checks
        if (identity.status !== IdentityStatus.ACTIVE) {
            throw new ForbiddenException('Email must be verified to claim admin rights');
        }

        if (profile.riskLevel >= 3) {
            throw new ForbiddenException('Account restricted from making admin claims');
        }

        const member = await this.membersRepo.findOne({
            where: { communityId, userId: profile.id }, // Use profile.id for member lookup
        });

        if (!member) {
            throw new ForbiddenException('You must be a member of this institution first');
        }

        const communityToCheck = await this.communitiesRepo.findOne({ where: { id: communityId } });
        if (communityToCheck?.governanceMode === GovernanceMode.INSTITUTION_MANAGED) {
            throw new ForbiddenException('This institution already has an administrator.');
        }

        // Check for existing pending claims
        const pendingClaim = await this.claimsRepo.findOne({
            where: { communityId, requestedBy: userId, status: ClaimStatus.PENDING },
        });

        if (pendingClaim) {
            throw new BadRequestException('You already have a pending claim for this institution');
        }

        // Check for max lifetime claims
        const claimCount = await this.claimsRepo.count({
            where: { communityId, requestedBy: userId },
        });

        if (claimCount >= 3) {
            throw new ForbiddenException('Maximum claim attempts reached for this institution');
        }

        // Cooldown check for Risk Level 2
        if (profile.riskLevel >= 2 && profile.lastAdminClaimAt) {
            const cooldownDays = 14;
            const daysSinceLast = (Date.now() - profile.lastAdminClaimAt.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLast < cooldownDays) {
                throw new ForbiddenException(`Account is under cooldown. Please try again in ${Math.ceil(cooldownDays - daysSinceLast)} days.`);
            }
        }

        // 3. Calculate Trust Score
        let score = 0;
        // Base score for verified email (implied by active status)
        score += 30;
        if (dto.officialProfileUrl) score += 25;
        if (dto.proofDocumentUrl) score += 25;

        // Check if contact email matches institution domain
        const community = await this.communitiesRepo.findOne({ where: { id: communityId } });
        if (community?.institutionDomain && dto.contactEmail?.endsWith(community.institutionDomain)) {
            score += 20;
        }

        // Penalties
        score -= (profile.failedAdminClaims * 25);
        score -= (profile.riskLevel * 30);

        // 4. Create Claim
        const claim = this.claimsRepo.create({
            ...dto,
            communityId,
            requestedBy: userId, // Identity ID
            trustScore: score,
            status: ClaimStatus.PENDING,
        });

        // Update user last claim time
        await this.profilesRepo.update(profile.id, { lastAdminClaimAt: new Date() });

        return this.claimsRepo.save(claim);
    }

    async findAll(status?: ClaimStatus) {
        const query = this.claimsRepo.createQueryBuilder('claim')
            .orderBy('claim.trustScore', 'DESC')
            .addOrderBy('claim.createdAt', 'ASC');

        if (status) {
            query.where('claim.status = :status', { status });
        }

        return query.getMany();
    }

    async getClaim(id: string) {
        return this.claimsRepo.findOne({ where: { id } });
    }

    async reviewClaim(claimId: string, reviewerId: string, dto: ReviewAdminClaimDto) {
        const claim = await this.claimsRepo.findOne({ where: { id: claimId } });
        if (!claim) throw new NotFoundException('Claim not found');

        if (claim.status !== ClaimStatus.PENDING) {
            throw new BadRequestException('Claim has already been reviewed');
        }

        if (dto.status === ClaimStatus.REJECTED && !dto.rejectionReason) {
            throw new BadRequestException('Rejection reason is required when rejecting a claim');
        }

        claim.status = dto.status;
        claim.reviewedBy = reviewerId;
        claim.reviewedAt = new Date();
        claim.rejectionReason = dto.rejectionReason ?? null;

        await this.claimsRepo.save(claim);

        if (dto.status === ClaimStatus.APPROVED) {
            // Grant Admin Role
            const profile = await this.profilesRepo.findOne({ where: { identityId: claim.requestedBy } });
            if (profile) {
                await this.membersRepo.update(
                    { communityId: claim.communityId, userId: profile.id }, // Use profile.id
                    {
                        role: CommunityRole.ADMIN,
                        roleGrantedAt: new Date(),
                        roleGrantedBy: reviewerId
                    }
                );

                // Update Community Governance Mode
                await this.communitiesRepo.update(claim.communityId, {
                    governanceMode: GovernanceMode.INSTITUTION_MANAGED
                });
            }
        } else if (dto.status === ClaimStatus.REJECTED) {
            // Handle Rejection Logic
            const profile = await this.profilesRepo.findOne({ where: { identityId: claim.requestedBy } });
            if (profile) {
                const newFailCount = profile.failedAdminClaims + 1;
                let newRiskLevel = profile.riskLevel;

                // Rule: First rejection -> riskLevel = max(current, 1)
                if (newFailCount === 1) {
                    newRiskLevel = Math.max(newRiskLevel, 1);
                }
                // Rule: Repeated failures -> riskLevel -> 2
                else if (newFailCount > 1) {
                    newRiskLevel = Math.max(newRiskLevel, 2);
                }

                await this.profilesRepo.update(profile.id, {
                    failedAdminClaims: newFailCount,
                    riskLevel: newRiskLevel
                });
            }
        }

        return claim;
    }
}
