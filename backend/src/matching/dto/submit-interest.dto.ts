import { IsString, IsArray, IsOptional } from 'class-validator';

export class SubmitInterestDto {
    @IsString()
    interestText: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachmentUrls?: string[];
}
