import { IsEmail, MinLength, IsOptional, IsString } from 'class-validator';

export class SigninDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
