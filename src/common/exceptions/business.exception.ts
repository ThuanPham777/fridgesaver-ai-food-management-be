// src/common/exceptions/business.exception.ts
// Business-specific exceptions

import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from '../constants';
import { BaseException } from './base.exception';

/**
 * Exception for business logic errors
 */
export class BusinessException extends BaseException {
  constructor(
    message: string,
    errorCode: ErrorCode | string = ERROR_CODES.UNKNOWN_ERROR,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, any>,
  ) {
    super(message, errorCode, status, details);
  }
}

/**
 * Exception for resource not found errors
 */
export class NotFoundException extends BaseException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, ERROR_CODES.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception for validation errors
 */
export class ValidationException extends BaseException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

/**
 * Exception for duplicate entry errors
 */
export class DuplicateException extends BaseException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super(message, ERROR_CODES.RESOURCE_ALREADY_EXISTS, HttpStatus.CONFLICT);
  }
}

/**
 * Exception for unauthorized access
 */
export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized access') {
    super(message, ERROR_CODES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Exception for forbidden access
 */
export class ForbiddenException extends BaseException {
  constructor(message = 'Access forbidden') {
    super(message, ERROR_CODES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception for external service errors
 */
export class ExternalServiceException extends BaseException {
  constructor(serviceName: string, details?: Record<string, any>) {
    super(
      `External service '${serviceName}' error`,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
      details,
    );
  }
}

/**
 * Exception for timeout errors
 */
export class TimeoutException extends BaseException {
  constructor(operation?: string) {
    const message = operation
      ? `Operation '${operation}' timed out`
      : 'Operation timed out';
    super(message, ERROR_CODES.TIMEOUT_ERROR, HttpStatus.REQUEST_TIMEOUT);
  }
}
