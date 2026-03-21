import { IsString, IsNotEmpty, IsOptional, IsUrl, IsDateString } from 'class-validator';

export class AddCertificationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    issuer: string;

    @IsDateString()
    @IsNotEmpty()
    issueDate: string;

    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @IsString()
    @IsOptional()
    credentialId?: string;

    @IsUrl()
    @IsOptional()
    credentialUrl?: string;
}

export class UpdateCertificationDto extends AddCertificationDto {
    @IsString()
    @IsNotEmpty()
    id: string;
}
