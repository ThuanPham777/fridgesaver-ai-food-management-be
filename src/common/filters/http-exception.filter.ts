// src/common/filters/http-exception.filter.ts
// Global HTTP exception filter

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException, ExceptionPayload } from '../exceptions';
import { ERROR_CODES, APP_CONSTANTS } from '../constants';

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: Record<string, any>;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    let errorResponse: ErrorResponse;

    if (exception instanceof BaseException) {
      const payload = exception.getResponse() as ExceptionPayload;
      errorResponse = {
        success: false,
        message: payload.message,
        errorCode: payload.errorCode,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        details: payload.details,
      };
    } else {
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ||
            APP_CONSTANTS.MESSAGES.INTERNAL_ERROR;

      errorResponse = {
        success: false,
        message: Array.isArray(message) ? message.join(', ') : message,
        errorCode: this.getErrorCodeFromStatus(status),
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    this.logger.error(
      `HTTP Exception: ${errorResponse.message}`,
      JSON.stringify({
        statusCode: status,
        path: request.url,
        method: request.method,
        errorCode: errorResponse.errorCode,
      }),
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.RESOURCE_CONFLICT;
      case HttpStatus.REQUEST_TIMEOUT:
        return ERROR_CODES.TIMEOUT_ERROR;
      default:
        return ERROR_CODES.UNKNOWN_ERROR;
    }
  }
}
