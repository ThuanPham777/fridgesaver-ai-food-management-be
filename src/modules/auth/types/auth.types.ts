// src/modules/auth/types/auth.types.ts
// Shared types for auth module

import type { UserRole } from '../../../../generated/prisma/enums';

export interface JwtPayload {
  sub: string;     // userId
  role: UserRole;
  email: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;     // userId
  type: 'refresh';
}

export interface RequestUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface GoogleOAuthUser {
  oauthId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}
