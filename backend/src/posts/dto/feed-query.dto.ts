import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class FeedQueryDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}
