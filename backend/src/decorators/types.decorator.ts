import { SetMetadata } from '@nestjs/common';

export const TYPES_KEY = 'types';
export const Types = (...types: string[]) =>
    SetMetadata(TYPES_KEY, types);
