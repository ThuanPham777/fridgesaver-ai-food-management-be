// src/common/config/configuration.ts
// Central configuration factory

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  cors: {
    origins: string[];
  };
  logging: {
    level: string;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  requestTimeout: number;
  swagger: {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT ?? '30000', 10),
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    title: process.env.SWAGGER_TITLE || 'API Documentation',
    description: process.env.SWAGGER_DESCRIPTION || 'API documentation',
    version: process.env.SWAGGER_VERSION || '1.0',
  },
});
