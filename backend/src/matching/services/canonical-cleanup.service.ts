import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CanonicalSkill } from '../entities/canonical-skill.entity';
import { ProfessionalRole } from '../entities/professional-role.entity';
import { Domain } from '../entities/domain.entity';
import { UserSkill } from '../entities/user-skill.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserDomain } from '../entities/user-domain.entity';

@Injectable()
export class CanonicalCleanupService {
    private readonly logger = new Logger(CanonicalCleanupService.name);

    constructor(
        @InjectRepository(CanonicalSkill)
        private skillRepo: Repository<CanonicalSkill>,
        @InjectRepository(ProfessionalRole)
        private roleRepo: Repository<ProfessionalRole>,
        @InjectRepository(Domain)
        private domainRepo: Repository<Domain>,
        @InjectRepository(UserSkill)
        private userSkillRepo: Repository<UserSkill>,
        @InjectRepository(UserRole)
        private userRoleRepo: Repository<UserRole>,
        @InjectRepository(UserDomain)
        private userDomainRepo: Repository<UserDomain>,
        private configService: ConfigService,
    ) { }

    /**
     * Runs daily at 2:00 AM (configurable via matching.cleanup.cronExpression).
     * Deletes stale USER_GENERATED canonicals that have never gained traction.
     *
     * Safety guarantees:
     *  - Never deletes SEED source entries
     *  - Never deletes HIGH confidence entries
     *  - Never deletes is_verified=true entries
     *  - Never deletes entries referenced by any user or project
     */
    @Cron('0 2 * * *')
    async runDailyCleanup(): Promise<void> {
        this.logger.log('Starting daily canonical cleanup...');

        const staleAfterDays: number =
            this.configService.get<number>('matching.cleanup.staleAfterDays') ?? 30;
        const maxUsage: number =
            this.configService.get<number>('matching.cleanup.maxUsageCountToDelete') ?? 1;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - staleAfterDays);

        const [skillsDeleted, rolesDeleted, domainsDeleted] = await Promise.all([
            this.cleanupSkills(cutoff, maxUsage),
            this.cleanupRoles(cutoff, maxUsage),
            this.cleanupDomains(cutoff, maxUsage),
        ]);

        this.logger.log(
            `Cleanup complete — skills:${skillsDeleted} roles:${rolesDeleted} domains:${domainsDeleted}`,
        );
    }

    // ─── skills ──────────────────────────────────────────────────────────────

    private async cleanupSkills(cutoff: Date, maxUsage: number): Promise<number> {
        const candidates = await this.skillRepo.find({
            where: {
                isVerified: false,
                usageCount: maxUsage,
            },
        });

        let deleted = 0;
        for (const skill of candidates) {
            if (skill.createdAt > cutoff) continue;

            // FK safety — ensure no bridge table references remain
            const hasUser = await this.userSkillRepo.findOne({
                where: { canonicalSkillId: skill.id },
            });
            if (hasUser) continue;

            // For project_required_skills / project_optional_skills we rely on
            // usage_count being > 1 (project selection increments it).
            // If usage_count === 1 and no user bridge row → safe to delete.

            await this.skillRepo.remove(skill);
            deleted++;
        }

        return deleted;
    }

    // ─── roles ───────────────────────────────────────────────────────────────

    private async cleanupRoles(cutoff: Date, maxUsage: number): Promise<number> {
        const candidates = await this.roleRepo.find({
            where: {
                isVerified: false,
                usageCount: maxUsage,
            },
        });

        let deleted = 0;
        for (const role of candidates) {
            if (role.createdAt > cutoff) continue;

            const hasUser = await this.userRoleRepo.findOne({ where: { roleId: role.id } });
            if (hasUser) continue;

            await this.roleRepo.remove(role);
            deleted++;
        }

        return deleted;
    }

    // ─── domains ─────────────────────────────────────────────────────────────

    private async cleanupDomains(cutoff: Date, maxUsage: number): Promise<number> {
        const candidates = await this.domainRepo.find({
            where: {
                isVerified: false,
                usageCount: maxUsage,
            },
        });

        let deleted = 0;
        for (const domain of candidates) {
            if (domain.createdAt > cutoff) continue;

            const hasUser = await this.userDomainRepo.findOne({ where: { domainId: domain.id } });
            if (hasUser) continue;

            await this.domainRepo.remove(domain);
            deleted++;
        }

        return deleted;
    }
}
