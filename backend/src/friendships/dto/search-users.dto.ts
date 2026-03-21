import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUsersDto {
    @IsString()
    @IsOptional()
    query?: string;

    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;

    @IsInt()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    offset?: number = 0;
}
