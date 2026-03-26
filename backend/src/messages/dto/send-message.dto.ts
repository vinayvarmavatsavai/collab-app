import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    body: string;

    @IsOptional()
    @IsString()
    type?: string;
}