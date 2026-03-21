import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { UserIntent } from '../enums/user-intent.enum';

export class UpdateUserProfileDto {
    @IsString()
    @IsOptional()
    firstname?: string;

    @IsString()
    @IsOptional()
    lastname?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    skills?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    domains?: string[];

    @IsEnum(UserIntent)
    @IsOptional()
    intent?: UserIntent;

    @IsString()
    @IsOptional()
    headline?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    profilePicture?: string;

    @IsString()
    @IsOptional()
    coverPhoto?: string;

    @IsString()
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
    preferredRoles?: string[];

    @IsString()
    @IsOptional()
    collaborationGoals?: string;

    @IsOptional()
    availabilityHours?: number;
}
