import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CommunityType } from '../enums/community-type.enum';
import { GovernanceMode } from '../enums/governance-mode.enum';

export class CreateCommunityDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(CommunityType)
    @IsOptional()
    type?: CommunityType;

    @IsEnum(GovernanceMode)
    @IsOptional()
    governanceMode?: GovernanceMode;
}
