import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
import { UserSkillService } from '../services/user-skill.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

export class AddUserSkillDto {
    @IsString()
    @IsNotEmpty()
    skillId: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    proficiency?: number; // 1-5

    @IsOptional()
    @IsNumber()
    @Min(0)
    yearsExperience?: number;
}

export class BulkAddUserSkillsDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    skillIds: string[];
}

export class UpdateUserSkillDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    proficiency?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    yearsExperience?: number;
}

@Controller('users/me/skills')
@UseGuards(JwtAuthGuard)
export class UserSkillController {
    constructor(private readonly userSkillService: UserSkillService) { }

    @Get()
    async getUserSkills(@Request() req: any) {
        return await this.userSkillService.getUserSkills(req.user.sub);
    }

    @Post()
    async addUserSkill(
        @Request() req: any,
        @Body() dto: AddUserSkillDto,
    ) {
        return await this.userSkillService.addUserSkill(
            req.user.sub,
            dto.skillId,
            dto.proficiency,
            dto.yearsExperience,
        );
    }

    @Post('bulk')
    async bulkAddUserSkills(
        @Request() req: any,
        @Body() dto: BulkAddUserSkillsDto,
    ) {
        return await this.userSkillService.bulkAddUserSkills(
            req.user.sub,
            dto.skillIds,
        );
    }



    @Patch(':id')
    async updateUserSkill(
        @Request() req: any,
        @Param('id') userSkillId: string,
        @Body() dto: UpdateUserSkillDto,
    ) {
        return await this.userSkillService.updateUserSkill(
            req.user.sub,
            userSkillId,
            dto,
        );
    }

    @Delete(':id')
    async removeUserSkill(
        @Request() req: any,
        @Param('id') userSkillId: string,
    ) {
        await this.userSkillService.removeUserSkill(req.user.sub, userSkillId);
        return { success: true };
    }
}
