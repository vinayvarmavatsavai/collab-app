import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_TYPE_KEY } from '../decorators/require-type.decorator';

interface JwtUser {
  sub: string;
  type: string;
}

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(ctx: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_TYPE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredTypes) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: JwtUser }>();

    if (!user || !user.type) {
      throw new UnauthorizedException('User type not found in JWT payload');
    }

    const hasPermission = requiredTypes.includes(user.type);

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
