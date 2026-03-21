import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '../entities/institution-claim.entity';

export class ReviewAdminClaimDto {
    @IsEnum(ClaimStatus)
    status: ClaimStatus;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    rejectionReason?: string;
}
