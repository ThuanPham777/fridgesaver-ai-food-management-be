// src/common/constants/app.constants.ts
// Application-wide constants

export const APP_CONSTANTS = {
  // API Response Messages
  MESSAGES: {
    SUCCESS: 'Operation completed successfully',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Invalid request',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation failed',
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Date formats
  DATE_FORMATS: {
    DEFAULT: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  },

  // HTTP Headers
  HEADERS: {
    REQUEST_ID: 'X-Request-ID',
    CORRELATION_ID: 'X-Correlation-ID',
    API_VERSION: 'X-API-Version',
  },
} as const;

// Error codes for business exceptions
export const ERROR_CODES = {
  // General errors (1xxx)
  UNKNOWN_ERROR: 'E1000',
  VALIDATION_ERROR: 'E1001',
  NOT_FOUND: 'E1002',
  DUPLICATE_ENTRY: 'E1003',
  INVALID_OPERATION: 'E1004',

  // Authentication errors (2xxx)
  UNAUTHORIZED: 'E2000',
  INVALID_CREDENTIALS: 'E2001',
  TOKEN_EXPIRED: 'E2002',
  INVALID_TOKEN: 'E2003',

  // Authorization errors (3xxx)
  FORBIDDEN: 'E3000',
  INSUFFICIENT_PERMISSIONS: 'E3001',

  // Resource errors (4xxx)
  RESOURCE_NOT_FOUND: 'E4000',
  RESOURCE_ALREADY_EXISTS: 'E4001',
  RESOURCE_CONFLICT: 'E4002',

  // External service errors (5xxx)
  EXTERNAL_SERVICE_ERROR: 'E5000',
  TIMEOUT_ERROR: 'E5001',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
