// src/common/dto/pagination.dto.ts
// Pagination Query DTOs for list endpoints

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsEnum } from 'class-validator';
import { APP_CONSTANTS } from '../constants';

/**
 * Sort order enum
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ============================================
// OFFSET PAGINATION QUERY (Page-based)
// ============================================

/**
 * Offset pagination query parameters
 * Use for traditional page-based pagination
 *
 * @example
 * GET /users?page=2&limit=20&sortBy=createdAt&sortOrder=desc
 */
export class OffsetPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    minimum: 1,
    default: APP_CONSTANTS.PAGINATION.DEFAULT_PAGE,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = APP_CONSTANTS.PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: APP_CONSTANTS.PAGINATION.MAX_LIMIT,
    default: APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(APP_CONSTANTS.PAGINATION.MAX_LIMIT)
  limit: number = APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;

  /**
   * Calculate offset for database queries
   */
  get offset(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Calculate skip for ORMs like Prisma
   */
  get skip(): number {
    return this.offset;
  }

  /**
   * Get take/limit for ORMs
   */
  get take(): number {
    return this.limit;
  }
}

// ============================================
// CURSOR PAGINATION QUERY (Infinite scroll)
// ============================================

/**
 * Cursor pagination query parameters
 * Use for infinite scroll, real-time feeds, or large datasets
 *
 * @example
 * GET /posts?cursor=abc123&limit=20
 */
export class CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor pointing to the last item of the previous page',
    example: 'eyJpZCI6MTIzfQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items to fetch',
    minimum: 1,
    maximum: APP_CONSTANTS.PAGINATION.MAX_LIMIT,
    default: APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(APP_CONSTANTS.PAGINATION.MAX_LIMIT)
  limit: number = APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  /**
   * Get take/limit for ORMs (fetch +1 to check if hasMore)
   */
  get take(): number {
    return this.limit + 1;
  }
}
