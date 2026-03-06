// src/modules/auth/guards/roles.guard.ts
// RBAC guard — checks user.role against @Roles() metadata

import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenException } from '../../../common/exceptions';
import type { UserRole } from '../../../../generated/prisma/enums';
import type { RequestUser } from '../types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Access forbidden');
    if (!requiredRoles.includes(user.role)) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
