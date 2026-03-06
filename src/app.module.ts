// src/app.module.ts
// Root application module

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { configuration, validationSchema } from './common/config';
import { RequestLoggerMiddleware } from './common/middleware';
import { HealthModule } from './core/health';
import { PrismaModule } from './core/prisma';
import { SharedModule } from './shared';
import { AuthModule } from './modules/auth/auth.module';
import { HouseholdsModule } from './modules/households/households.module';
import { JwtAuthGuard, RolesGuard } from './modules/auth/guards';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration module - load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
      envFilePath: ['.env.local', '.env'],
    }),

    // Core modules
    HealthModule,
    PrismaModule,

    // Shared module
    SharedModule,

    // Feature modules
    AuthModule,
    HouseholdsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply request logger middleware to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
