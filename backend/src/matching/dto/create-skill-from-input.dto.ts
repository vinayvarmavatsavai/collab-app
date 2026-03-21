import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSkillFromInputDto {
    @IsString()
    @IsNotEmpty()
    input: string;

    @IsOptional()
    @IsString()
    primaryDomainId?: string;
}
