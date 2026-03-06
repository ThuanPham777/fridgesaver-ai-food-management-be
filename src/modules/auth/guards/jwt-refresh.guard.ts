// src/modules/auth/guards/jwt-refresh.guard.ts
// Refresh token guard

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '../../../common/exceptions';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw err ?? new UnauthorizedException('Invalid refresh token');
    return user;
  }
}
