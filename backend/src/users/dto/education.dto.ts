import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddEducationDto {
    @IsString()
    @IsNotEmpty()
    school: string;

    @IsString()
    @IsNotEmpty()
    degree: string;

    @IsString()
    @IsNotEmpty()
    field: string;

    @IsString()
    @IsNotEmpty()
    startYear: string;

    @IsString()
    @IsOptional()
    endYear?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateEducationDto extends AddEducationDto {
    @IsString()
    @IsNotEmpty()
    id: string;
}
