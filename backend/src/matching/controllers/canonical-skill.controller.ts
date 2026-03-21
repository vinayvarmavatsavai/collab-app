import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { CanonicalSkillService } from '../services/canonical-skill.service';
import { CreateSkillFromInputDto } from '../dto/create-skill-from-input.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';


@Controller('skills')
@UseGuards(JwtAuthGuard)
export class CanonicalSkillController {
    constructor(private canonicalSkillService: CanonicalSkillService) { }

    /**
     * Autocomplete endpoint for skill suggestions
     * GET /skills/autocomplete?q=nex
     */
    @Get('autocomplete')
    async autocomplete(@Query('q') query: string, @Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;

        const suggestions = await this.canonicalSkillService.getSuggestions(query, limitNum);

        return suggestions.map(s => ({
            skill: s.skill,
            similarity: s.similarity,
            matchType: s.matchType,
        }));
    }

    /**
     * Get popular skills
     * GET /skills/popular
     */
    @Get('popular')
    async getPopular(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        const suggestions = await this.canonicalSkillService.getPopularSkills(limitNum);

        // Return array of skills directly (frontend expects CanonicalSkill[])
        return suggestions.map(s => s.skill);
    }

    /**
     * Get skills by primary domain
     * GET /skills/domain/:domainId
     */
    @Get('domain/:domainId')
    async getByDomain(@Param('domainId') primaryDomainId: string, @Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        const skills = await this.canonicalSkillService.getSkillsByDomain(primaryDomainId, limitNum);

        return {
            primaryDomainId,
            skills: skills.map(s => ({
                id: s.id,
                name: s.name,
                usageCount: s.usageCount,
            })),
        };
    }

    /**
     * Get similar skills
     * GET /skills/:id/similar
     */
    @Get(':id/similar')
    async getSimilar(@Param('id') id: string, @Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const similar = await this.canonicalSkillService.findSimilarSkills(id, limitNum);

        return {
            skillId: id,
            similar: similar.map(s => ({
                id: s.skill.id,
                name: s.skill.name,
                primaryDomainId: s.skill.primaryDomainId,
                similarity: s.similarity,
            })),
        };
    }

    /**
     * Get skill details
     * GET /skills/:id
     */
    @Get(':id')
    async getSkill(@Param('id') id: string) {
        const skill = await this.canonicalSkillService.getSkillById(id);

        if (!skill) {
            return { error: 'Skill not found' };
        }

        return {
            id: skill.id,
            name: skill.name,
            primaryDomainId: skill.primaryDomainId,
            description: skill.description,
            usageCount: skill.usageCount,
        };
    }
    /**
     * Create skill from user input (if doesn't exist)
     * POST /skills/create-from-input
     */
    @Post('create-from-input')
    async createFromInput(@Body() dto: CreateSkillFromInputDto, @Request() req: any) {
        return this.canonicalSkillService.findOrCreateCanonicalSkill(
            dto.input,
            dto.primaryDomainId,
            req.user?.sub,
        );
    }
}

