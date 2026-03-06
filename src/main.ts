// src/main.ts
// Application entry point with global configurations

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
  LoggingInterceptor,
  TransformResponseInterceptor,
  TimeoutInterceptor,
} from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Get configuration
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', 'api');
  const corsOrigins = configService.get<string[]>('cors.origins', [
    'http://localhost:3000',
  ]);
  const swaggerEnabled = configService.get<boolean>('swagger.enabled', true);
  const requestTimeout = configService.get<number>('requestTimeout', 30000);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(requestTimeout),
    new TransformResponseInterceptor(),
  );

  // Swagger documentation
  if (swaggerEnabled) {
    const swaggerTitle = configService.get<string>(
      'swagger.title',
      'API Documentation',
    );
    const swaggerDescription = configService.get<string>(
      'swagger.description',
      'API documentation',
    );
    const swaggerVersion = configService.get<string>('swagger.version', '1.0');

    const swaggerConfig = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription(swaggerDescription)
      .setVersion(swaggerVersion)
      .addBearerAuth()
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger documentation available at /docs`);
  }

  await app.listen(port);

  logger.log(`Application running on port ${port}`);
  logger.log(`API prefix: /${apiPrefix}`);
  logger.log(
    `Environment: ${configService.get<string>('nodeEnv', 'development')}`,
  );
}

bootstrap();
