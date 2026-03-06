// src/modules/auth/strategies/jwt-refresh.strategy.ts
// Refresh token validation strategy — extracts token from HttpOnly cookie

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type StrategyOptionsWithRequest } from 'passport-jwt';
import type { Request } from 'express';
import { UnauthorizedException } from '../../../common/exceptions';
import { JwtRefreshPayload } from '../types/auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const opts: StrategyOptionsWithRequest = {
      // Extract JWT from the HttpOnly cookie (never accessible to JS)
      jwtFromRequest: (req: Request) => req?.cookies?.refreshToken ?? null,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret')!,
      passReqToCallback: true,
    };
    super(opts);
  }

  async validate(req: Request, payload: JwtRefreshPayload): Promise<{ userId: string; refreshToken: string }> {
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const refreshToken: string = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');

    return { userId: payload.sub, refreshToken };
  }
}
