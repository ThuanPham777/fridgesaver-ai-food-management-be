// src/common/exceptions/base.exception.ts
// Base exception class for all custom exceptions

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants';

export interface ExceptionPayload {
  errorCode: ErrorCode | string;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
  path?: string;
}

export class BaseException extends HttpException {
  public readonly errorCode: ErrorCode | string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    errorCode: ErrorCode | string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: Record<string, any>,
  ) {
    const payload: ExceptionPayload = {
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    super(payload, status);
    this.errorCode = errorCode;
    this.details = details;
  }
}
