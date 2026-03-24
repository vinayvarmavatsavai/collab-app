import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingSession, Profile } from '../entities/onboarding-session.entity';
import { OnboardingStatus } from '../enums/onboarding-status.enum';
import { UsersService } from 'src/users/services/users/users.service';
import { TagGeneratorService, TagSuggestion } from './tag-generator.service';
import { HybridExtractorService, HybridInput } from './hybrid-extractor.service';
import { CanonicalSkillService } from 'src/matching/services/canonical-skill.service';
import { CanonicalRoleService } from 'src/matching/services/canonical-role.service';
import { CanonicalDomainService } from 'src/matching/services/canonical-domain.service';
import { isUUID } from 'class-validator';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  private readonly QUESTIONS = [
    { step: 1, question: 'What represents your primary role?', field: 'primary_role', optional: false },
    { step: 2, question: 'Do you have any other roles?', field: 'roles', optional: true },
    { step: 3, question: 'What areas do you work in?', field: 'domains', optional: false },
    { step: 4, question: 'What are your main skills?', field: 'skills', optional: false },
    { step: 5, question: 'What interests you?', field: 'interests', optional: true },
    { step: 6, question: 'How much time can you commit?', field: 'availability', optional: true },
  ];

  constructor(
    @InjectRepository(OnboardingSession)
    private repo: Repository<OnboardingSession>,
    private usersService: UsersService,
    private tagGenerator: TagGeneratorService,
    private hybridExtractor: HybridExtractorService,
    private canonicalSkillService: CanonicalSkillService,
    private canonicalRoleService: CanonicalRoleService,
    private canonicalDomainService: CanonicalDomainService,
  ) {}

  async start(identityId: string) {
    let session = await this.repo.findOne({ where: { identityId } });

    if (!session) {
      session = this.repo.create({
        identityId,
        status: OnboardingStatus.IN_PROGRESS,
        step: 0,
        profile: {
          domains: [],
          skills: [],
          experience: [],
          interests: [],
          availability: null,
        },
        selectedTags: {},
        conversationHistory: [],
      });
      await this.repo.save(session);
    }

    return this.getNextQuestion(session);
  }

  async answer(identityId: string, hybridInput: HybridInput) {
    const session = await this.repo.findOne({
      where: { identityId, status: OnboardingStatus.IN_PROGRESS },
    });

    if (!session) throw new NotFoundException('Onboarding session not found');

    const currentQ = this.QUESTIONS[session.step];
    if (!currentQ) throw new BadRequestException('Invalid step');

    session.selectedTags[currentQ.field] = hybridInput.selectedTags;

    this.extractToProfile(session.profile, currentQ.field, hybridInput);

    // IMPORTANT: do not mutate stored profile into names before save
    session.step++;
    await this.repo.save(session);

    if (session.step >= this.QUESTIONS.length) {
      return this.completeOnboarding(session);
    }

    return this.getNextQuestion(session);
  }

  async skip(identityId: string) {
    const session = await this.repo.findOne({
      where: { identityId, status: OnboardingStatus.IN_PROGRESS },
    });

    if (!session) throw new NotFoundException('Onboarding session not found');

    const currentQ = this.QUESTIONS[session.step];
    if (!currentQ?.optional) {
      throw new BadRequestException('Cannot skip required question');
    }

    session.step++;
    await this.repo.save(session);

    if (session.step >= this.QUESTIONS.length) {
      return this.completeOnboarding(session);
    }

    return this.getNextQuestion(session);
  }

  private async getNextQuestion(session: OnboardingSession) {
    const currentQ = this.QUESTIONS[session.step];

    if (!currentQ) {
      return this.completeOnboarding(session);
    }

    let tags: TagSuggestion[] = [];

    switch (currentQ.field) {
      case 'primary_role':
      case 'roles':
        tags = await this.tagGenerator.getRoleTags();
        break;
      case 'domains':
        tags = await this.tagGenerator.getDomainTags();
        break;
      case 'skills':
        tags = await this.tagGenerator.getSkillTags(session.profile?.domains || []);
        break;
      case 'interests':
        tags = this.tagGenerator.getInterestTags();
        break;
      case 'availability':
        tags = this.tagGenerator.getAvailabilityTags();
        break;
    }

    return {
      question: currentQ.question,
      field: currentQ.field,
      tags,
      optional: currentQ.optional,
      step: session.step + 1,
      totalSteps: this.QUESTIONS.length,
      completenessPercentage: this.calculateCompleteness(session),
    };
  }

  private extractToProfile(profile: Profile, field: string, input: HybridInput) {
    switch (field) {
      case 'primary_role':
        if (input.selectedTags.length > 0) {
          profile.primaryRole = input.selectedTags[0];
        } else if (input.textInput) {
          profile.primaryRole = input.textInput;
        }
        break;

      case 'roles': {
        const newRoles = [...input.selectedTags];
        if (input.textInput) {
          newRoles.push(
            ...input.textInput
              .split(',')
              .map((r) => r.trim())
              .filter((r) => r.length > 0),
          );
        }
        profile.roles = [...new Set([...(profile.roles || []), ...newRoles])];
        break;
      }

      case 'domains':
        profile.domains = this.hybridExtractor.extractDomains(input);
        break;

      case 'skills':
        profile.skills = this.hybridExtractor.extractSkills(input);
        break;

      case 'experience':
        profile.experience = this.hybridExtractor.extractExperience(input);
        break;

      case 'interests':
        profile.interests = this.hybridExtractor.extractInterests(input);
        break;

      case 'availability':
        profile.availability = this.hybridExtractor.extractAvailability(input);
        break;
    }
  }

  private calculateCompleteness(session: OnboardingSession): number {
    const profile = session.profile;
    let score = 0;

    if (profile.domains.length > 0) score += 25;
    if (profile.skills.length > 0) score += 25;
    if (profile.experience.length > 0) score += 20;
    if (profile.interests.length > 0) score += 15;
    if (profile.availability) score += 15;

    return Math.min(score, 100);
  }

  private async completeOnboarding(session: OnboardingSession) {
    session.status = OnboardingStatus.COMPLETED;
    session.completedAt = new Date();
    await this.repo.save(session);

    // Persist raw canonical ids / raw stored values
    await this.usersService.updateFromOnboarding(session.identityId, session.profile);

    // Return hydrated copy for UI only
    const hydratedProfile = await this.getHydratedProfileCopy(session.profile);

    return {
      complete: true,
      profile: hydratedProfile,
      completenessPercentage: this.calculateCompleteness(session),
    };
  }

  async finalize(identityId: string, profile: any) {
    const session = await this.repo.findOne({ where: { identityId } });
    if (!session) throw new NotFoundException();

    // Always finalize from stored session profile, not hydrated UI profile
    await this.usersService.updateFromOnboarding(identityId, session.profile);

    session.status = OnboardingStatus.COMPLETED;
    session.completedAt = new Date();
    await this.repo.save(session);
  }

  async getStatus(identityId: string) {
    const session = await this.repo.findOne({ where: { identityId } });

    if (!session) {
      return {
        status: OnboardingStatus.NOT_STARTED,
        currentQuestion: null,
        profile: null,
        completenessPercentage: 0,
      };
    }

    const hydratedProfile =
      session.profile ? await this.getHydratedProfileCopy(session.profile) : null;

    return {
      status: session.status,
      currentQuestion: session.currentQuestion,
      profile: hydratedProfile,
      completenessPercentage: this.calculateCompleteness(session),
    };
  }

  private async getHydratedProfileCopy(profile: Profile): Promise<Profile> {
    const copy: Profile = JSON.parse(JSON.stringify(profile));
    await this.hydrateProfile(copy);
    return copy;
  }

  private async hydrateProfile(profile: Profile): Promise<void> {
    if (profile.primaryRole && isUUID(profile.primaryRole)) {
      const role = await this.canonicalRoleService.getRoleById(profile.primaryRole);
      if (role) profile.primaryRole = role.name;
    }

    if (profile.roles && profile.roles.length > 0) {
      profile.roles = await Promise.all(
        profile.roles.map(async (r) => {
          if (isUUID(r)) {
            const role = await this.canonicalRoleService.getRoleById(r);
            return role ? role.name : r;
          }
          return r;
        }),
      );
    }

    if (profile.domains && profile.domains.length > 0) {
      profile.domains = await Promise.all(
        profile.domains.map(async (d) => {
          if (isUUID(d)) {
            const domain = await this.canonicalDomainService.getDomainById(d);
            return domain ? domain.name : d;
          }
          return d;
        }),
      );
    }

    if (profile.skills && profile.skills.length > 0) {
      profile.skills = await Promise.all(
        profile.skills.map(async (s) => {
          if (isUUID(s)) {
            const skill = await this.canonicalSkillService.getSkillById(s);
            return skill ? skill.name : s;
          }
          return s;
        }),
      );
    }
  }
}