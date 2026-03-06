// src/common/decorators/public.decorator.ts
// Decorator to mark endpoints as public (for future auth integration)

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark an endpoint as public, bypassing authentication
 * Use this when you integrate authentication in your project
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
