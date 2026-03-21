import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, JwtFromRequestFunction } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
  };
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ((req: RequestWithCookies) =>
        req.cookies?.refreshToken) as JwtFromRequestFunction,
      secretOrKey: config.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: RequestWithCookies, payload: RefreshTokenPayload) {
    return {
      sub: payload.sub,
      sessionId: payload.sessionId,
      refreshToken: req.cookies?.refreshToken,
    };
  }
}
