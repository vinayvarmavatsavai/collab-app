import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { UserIntent } from '../enums/user-intent.enum';


export class CreateUserProfileDto {
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
