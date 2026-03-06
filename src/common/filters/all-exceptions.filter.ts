// src/common/filters/all-exceptions.filter.ts
// Global filter for all unhandled exceptions

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES, APP_CONSTANTS } from '../constants';
import { ErrorResponse } from './http-exception.filter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If it's an HttpException, let HttpExceptionFilter handle it
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ||
            APP_CONSTANTS.MESSAGES.INTERNAL_ERROR;

      const errorResponse: ErrorResponse = {
        success: false,
        message: Array.isArray(message) ? message.join(', ') : message,
        errorCode: ERROR_CODES.UNKNOWN_ERROR,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      response.status(status).json(errorResponse);
      return;
    }

    // Handle non-HTTP exceptions
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ErrorResponse = {
      success: false,
      message: APP_CONSTANTS.MESSAGES.INTERNAL_ERROR,
      errorCode: ERROR_CODES.UNKNOWN_ERROR,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the full error for debugging
    this.logger.error(
      `Unhandled Exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}
