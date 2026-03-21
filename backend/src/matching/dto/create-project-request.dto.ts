import { IsString, IsArray, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ExperienceLevel } from '../entities/project-request.entity';

export class CreateProjectRequestDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsArray()
    @IsString({ each: true })
    requiredSkills: string[];

    @IsArray()
    @IsString({ each: true })
    requiredDomains: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    optionalSkills?: string[];

    @IsOptional()
    @IsEnum(ExperienceLevel)
    preferredExperienceLevel?: ExperienceLevel;

    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(20)
    maxCohortSize?: number;

    @IsOptional()
    @IsString()
    visibilityMode?: 'matching-only' | 'open' | 'hybrid';
}
