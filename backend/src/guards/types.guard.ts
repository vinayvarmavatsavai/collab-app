import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TYPES_KEY } from '../decorators/types.decorator';

@Injectable()
export class TypesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(ctx: ExecutionContext): boolean {
        const allowedTypes = this.reflector.getAllAndOverride<string[]>(
            TYPES_KEY,
            [ctx.getHandler(), ctx.getClass()],
        );

        if (!allowedTypes) return true;

        const { user } = ctx.switchToHttp().getRequest();

        if (!user) throw new UnauthorizedException();

        if (!allowedTypes.includes(user.type)) {
            throw new ForbiddenException('Invalid identity type');
        }

        return true;
    }
}
