// src/common/middleware/request-logger.middleware.ts
// Middleware for logging incoming requests

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { APP_CONSTANTS } from '../constants';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or use existing request ID
    const requestId =
      (req.headers[APP_CONSTANTS.HEADERS.REQUEST_ID.toLowerCase()] as string) ||
      randomUUID();

    // Set request ID in headers for tracking
    req.headers[APP_CONSTANTS.HEADERS.REQUEST_ID.toLowerCase()] = requestId;
    res.setHeader(APP_CONSTANTS.HEADERS.REQUEST_ID, requestId);

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Log request
    this.logger.log(`[${requestId}] --> ${method} ${originalUrl} | IP: ${ip}`);

    // Log response when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - startTime;

      const logMethod = statusCode >= 400 ? 'warn' : 'log';
      this.logger[logMethod](
        `[${requestId}] <-- ${method} ${originalUrl} ${statusCode} ${contentLength}B - ${duration}ms`,
      );
    });

    next();
  }
}
