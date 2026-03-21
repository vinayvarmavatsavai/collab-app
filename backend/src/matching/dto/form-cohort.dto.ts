import { IsArray, IsUUID } from 'class-validator';

export class FormCohortDto {
    @IsArray()
    @IsUUID('4', { each: true })
    memberIds: string[];
}
