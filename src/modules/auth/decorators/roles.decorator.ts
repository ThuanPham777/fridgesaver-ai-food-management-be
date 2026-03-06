// src/modules/auth/decorators/roles.decorator.ts
// Marks a route/controller with required roles for RolesGuard

import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
