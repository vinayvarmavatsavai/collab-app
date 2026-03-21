import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SkillDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    proficiency: number;

    @IsNumber()
    @Min(0)
    yearsExperience: number;

    @IsString()
    @IsOptional()
    evidence?: string;

    @IsBoolean()
    confirmed: boolean;
}

export class ProjectDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    role: string;

    @IsArray()
    @IsString({ each: true })
    technologies: string[];

    @IsString()
    @IsOptional()
    duration?: string;

    @IsBoolean()
    confirmed: boolean;
}

export class ExperienceDto {
    @IsString()
    company: string;

    @IsString()
    position: string;

    @IsString()
    duration: string;
}

export class OnboardingProfileDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SkillDto)
    skills: SkillDto[];

    @IsArray()
    @IsString({ each: true })
    domains: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProjectDto)
    projects: ProjectDto[];

    @IsArray()
    @IsString({ each: true })
    preferredRoles: string[];

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(168) // Max hours in a week
    availabilityHours?: number;

    @IsString()
    @IsOptional()
    collaborationGoals?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExperienceDto)
    @IsOptional()
    experience?: ExperienceDto[];
}
