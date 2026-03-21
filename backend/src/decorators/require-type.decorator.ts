import { SetMetadata } from '@nestjs/common';

export const REQUIRE_TYPE_KEY = 'require_type';
export const RequireType = (...types: string[]) =>
    SetMetadata(REQUIRE_TYPE_KEY, types);
