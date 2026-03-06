// src/app.module.ts
// Root application module

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration, validationSchema } from './common/config';
import { RequestLoggerMiddleware } from './common/middleware';
import { LoggerModule } from './core/logger';
import { HealthModule } from './core/health';
import { SharedModule } from './shared';

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
    LoggerModule,
    HealthModule,

    // Shared module
    SharedModule,

    // Add your feature modules here
    // Example:
    // UserModule,
    // AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply request logger middleware to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
