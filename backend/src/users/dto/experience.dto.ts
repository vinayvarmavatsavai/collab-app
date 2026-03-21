import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class AddExperienceDto {
    @IsString()
    @IsNotEmpty()
    company: string;

    @IsString()
    @IsNotEmpty()
    position: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    current?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    location?: string;
}

export class UpdateExperienceDto extends AddExperienceDto {
    @IsString()
    @IsNotEmpty()
    id: string;
}
