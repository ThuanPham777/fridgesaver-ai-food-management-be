# NestJS Backend Base Template

A clean, modular, and scalable NestJS backend base template that provides common infrastructure without any business logic. This template is designed to be reusable across multiple projects.

## Features

- **Configuration Management** - Environment-based configuration with validation
- **Logging** - Custom logger service with structured logging
- **Error Handling** - Global exception filters with standardized error responses
- **API Response Format** - Unified response wrapper for all endpoints
- **Request Validation** - Global validation pipe with detailed error messages
- **Pagination** - Built-in pagination support with DTOs
- **Middleware** - Request logging with request ID tracking
- **Interceptors** - Logging, timeout, and response transformation
- **Base Patterns** - Abstract base service and controller for CRUD operations
- **Health Checks** - Ready-to-use health, readiness, and liveness endpoints
- **Swagger Documentation** - Auto-generated API documentation
- **Security** - Helmet and CORS configuration
- **Utilities** - String, date, object, and async utility functions

## Project Structure

```
src/
├── main.ts                     # Application entry point
├── app.module.ts               # Root module
├── app.controller.ts           # Root controller
├── app.service.ts              # Root service
├── common/                     # Shared utilities and infrastructure
│   ├── config/                 # Configuration management
│   │   ├── configuration.ts    # Config factory
│   │   ├── validation.schema.ts # Env validation with Joi
│   │   └── index.ts
│   ├── constants/              # Application constants
│   │   ├── app.constants.ts    # Messages, pagination, error codes
│   │   └── index.ts
│   ├── decorators/             # Custom decorators
│   │   ├── api-paginated-response.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── index.ts
│   ├── dto/                    # Data Transfer Objects
│   │   ├── api-response.dto.ts # Standard API response wrapper
│   │   ├── pagination.dto.ts   # Pagination query & response
│   │   └── index.ts
│   ├── exceptions/             # Custom exceptions
│   │   ├── base.exception.ts   # Base exception class
│   │   ├── business.exception.ts # Business-specific exceptions
│   │   └── index.ts
│   ├── filters/                # Exception filters
│   │   ├── http-exception.filter.ts
│   │   ├── all-exceptions.filter.ts
│   │   └── index.ts
│   ├── guards/                 # Route guards (placeholder)
│   │   └── index.ts
│   ├── interceptors/           # Request/response interceptors
│   │   ├── logging.interceptor.ts
│   │   ├── transform-response.interceptor.ts
│   │   ├── timeout.interceptor.ts
│   │   └── index.ts
│   ├── middleware/             # HTTP middleware
│   │   ├── request-logger.middleware.ts
│   │   └── index.ts
│   ├── pipes/                  # Validation pipes
│   │   ├── validation.pipe.ts
│   │   └── index.ts
│   ├── utils/                  # Utility functions
│   │   ├── string.util.ts
│   │   ├── date.util.ts
│   │   ├── object.util.ts
│   │   ├── async.util.ts
│   │   └── index.ts
│   └── index.ts                # Barrel export
├── core/                       # Core application modules
│   ├── base/                   # Base patterns
│   │   ├── base.service.ts     # Abstract CRUD service
│   │   ├── base.controller.ts  # Abstract CRUD controller
│   │   └── index.ts
│   ├── logger/                 # Logger module
│   │   ├── logger.service.ts
│   │   ├── logger.module.ts
│   │   └── index.ts
│   ├── health/                 # Health check module
│   │   ├── health.controller.ts
│   │   ├── health.module.ts
│   │   └── index.ts
│   └── index.ts                # Barrel export
├── shared/                     # Shared providers
│   ├── shared.module.ts
│   └── index.ts
└── modules/                    # Feature modules (add yours here)
    └── (your modules)
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` file with your settings:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
LOG_LEVEL=debug
SWAGGER_ENABLED=true
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### API Documentation

When `SWAGGER_ENABLED=true`, Swagger documentation is available at:
- http://localhost:3000/docs

### Health Endpoints

- `GET /api/v1/health` - Health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Usage Examples

### Creating a New Module

1. Create your module folder in `src/modules/`
2. Extend base patterns for CRUD operations:

```typescript
// src/modules/example/example.service.ts
import { Injectable } from '@nestjs/common';
import { BaseService } from '../../core/base';
import { Example } from './example.entity';

@Injectable()
export class ExampleService extends BaseService<Example> {
  constructor(private readonly exampleRepository: ExampleRepository) {
    super(exampleRepository, 'ExampleService');
  }

  // Add custom methods here
}
```

```typescript
// src/modules/example/example.controller.ts
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '../../core/base';
import { Example } from './example.entity';
import { ExampleService } from './example.service';

@ApiTags('Examples')
@Controller('examples')
export class ExampleController extends BaseController<Example> {
  constructor(private readonly exampleService: ExampleService) {
    super(exampleService, 'Example');
  }

  // Override or add custom endpoints here
}
```

### Using Custom Exceptions

```typescript
import { NotFoundException, ValidationException, BusinessException } from '../common/exceptions';

// Resource not found
throw new NotFoundException('User', userId);

// Validation error
throw new ValidationException('Invalid input', { field: ['error message'] });

// Business logic error
throw new BusinessException('Operation not allowed', ERROR_CODES.INVALID_OPERATION);
```

### Using Utilities

```typescript
import { slugify, formatDateTime, pick, retry } from '../common/utils';

// String utilities
const slug = slugify('Hello World'); // 'hello-world'

// Date utilities
const formatted = formatDateTime(new Date()); // '2024-01-01 12:00:00'

// Object utilities
const partial = pick(obj, ['id', 'name']);

// Async utilities
const result = await retry(() => fetchData(), { maxRetries: 3 });
```

### Standard API Response

All responses follow this format:

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "E1001",
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/resource"
}
```

## Adding Features

This base template is designed to be extended. Here's what you might add:

- **Database Layer**: Prisma, TypeORM, or MongoDB
- **Authentication**: JWT, OAuth, Passport.js
- **Caching**: Redis integration
- **Queue Processing**: Bull/BullMQ
- **Email Service**: Nodemailer, SendGrid
- **File Upload**: Multer, S3

## Scripts

```bash
npm run start         # Start the application
npm run start:dev     # Start in watch mode
npm run start:prod    # Start production build
npm run build         # Build the application
npm run lint          # Lint the code
npm run test          # Run unit tests
npm run test:e2e      # Run e2e tests
npm run test:cov      # Run tests with coverage
```

## License

MIT
