import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateAdminClaimDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(20, { message: 'Reason must be at least 20 characters long' })
    reason: string;

    @IsUrl({}, { message: 'Official profile URL must be a valid URL' })
    officialProfileUrl: string;

    @IsOptional()
    @IsEmail({}, { message: 'Contact email must be a valid email' })
    contactEmail?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsUrl({}, { message: 'Proof document URL must be a valid URL' })
    proofDocumentUrl?: string;
}
