import {
    IsEmail,
    IsString,
    MinLength,
    IsArray,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { UserIntent } from 'src/users/enums/user-intent.enum';


export class SignupUserDto {
    // ---- Identity (Auth-owned) ----
    @IsEmail()
    email: string;

    @IsString()
    username: string;

    @IsString()
    @MinLength(8)
    password: string;

    // ---- Profile (User-owned) ----
    @IsString()
    firstname: string;

    @IsString()
    lastname: string;

    @IsString()
    phone: string;

    @IsArray()
    @IsOptional()
    skills: string[];

    @IsEnum(UserIntent)
    intent: UserIntent;
}
