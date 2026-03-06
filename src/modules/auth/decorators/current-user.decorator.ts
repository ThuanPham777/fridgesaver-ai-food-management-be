// src/modules/auth/decorators/current-user.decorator.ts
// Extracts the authenticated user from the request

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);
