// src/common/dto/api-response.dto.ts
// Unified API response wrapper for all endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API response wrapper
 * All API endpoints should return responses wrapped in this format
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message about the result',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Response data payload',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Timestamp of the response',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp?: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create a successful response
   */
  static success<T>(data: T, message = 'Success'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  /**
   * Create an error response
   */
  static error(message: string): ApiResponseDto<null> {
    return new ApiResponseDto(false, message, null);
  }

  /**
   * Create a paginated response (Offset Pagination)
   */
  static paginated<T>(
    items: T[],
    meta: OffsetPaginationMeta,
    message = 'Success',
  ): ApiResponseDto<PaginatedData<T>> {
    return new ApiResponseDto(true, message, { items, meta });
  }

  /**
   * Create a cursor-based paginated response
   */
  static cursorPaginated<T>(
    items: T[],
    meta: CursorPaginationMeta,
    message = 'Success',
  ): ApiResponseDto<CursorPaginatedData<T>> {
    return new ApiResponseDto(true, message, { items, meta });
  }
}

// ============================================
// OFFSET PAGINATION (Traditional page-based)
// ============================================

/**
 * Offset pagination metadata
 */
export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Paginated data structure for offset pagination
 */
export interface PaginatedData<T> {
  items: T[];
  meta: OffsetPaginationMeta;
}

/**
 * Create offset pagination metadata
 */
export function createOffsetPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): OffsetPaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

// ============================================
// CURSOR PAGINATION (Infinite scroll, real-time)
// ============================================

/**
 * Cursor pagination metadata
 */
export interface CursorPaginationMeta {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
}

/**
 * Cursor paginated data structure
 */
export interface CursorPaginatedData<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

/**
 * Create cursor pagination metadata
 */
export function createCursorPaginationMeta(
  limit: number,
  hasMore: boolean,
  nextCursor: string | null,
  prevCursor: string | null = null,
): CursorPaginationMeta {
  return {
    limit,
    hasMore,
    nextCursor,
    prevCursor,
  };
}
