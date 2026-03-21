import { IsString, IsEnum, IsOptional, IsArray, MaxLength } from 'class-validator';
import { PostVisibility } from '../entities/post.entity';

export class CreatePostDto {
    @IsString()
    @MaxLength(10000, { message: 'Post content cannot exceed 10,000 characters' })
    content: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[];

    @IsOptional()
    @IsEnum(PostVisibility)
    visibility?: PostVisibility;
}
