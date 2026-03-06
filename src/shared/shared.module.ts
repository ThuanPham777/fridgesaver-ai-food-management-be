// src/shared/shared.module.ts
// Shared module for commonly used providers

import { Global, Module } from '@nestjs/common';

/**
 * Shared module for providers that should be available globally
 * Import this module in AppModule to make all exports available everywhere
 *
 * Add shared services here as your application grows:
 * - Cache service
 * - Event emitter
 * - Queue service
 * - etc.
 */
@Global()
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class SharedModule {}
