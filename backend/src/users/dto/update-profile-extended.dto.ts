import { IsString, IsOptional, IsArray, IsUrl, IsBoolean, IsNumber } from 'class-validator';

export class UpdateProfileExtendedDto {
    @IsString()
    @IsOptional()
    headline?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    skills?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    domains?: string[];

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    profilePicture?: string;

    @IsString()
    @IsOptional()
    coverPhoto?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    currentCompany?: string;

    @IsString()
    @IsOptional()
    currentPosition?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    languages?: string[];

    @IsBoolean()
    @IsOptional()
    isProfilePublic?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    preferredRoles?: string[];

    @IsString()
    @IsOptional()
    collaborationGoals?: string;

    @IsNumber()
    @IsOptional()
    availabilityHours?: number;
}
