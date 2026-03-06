// src/common/decorators/api-paginated-response.decorator.ts
// Custom decorator for Swagger paginated response documentation

import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '../dto/api-response.dto';

/**
 * Decorator for documenting offset paginated API responses in Swagger
 *
 * @example
 * @ApiOffsetPaginatedResponse(UserDto)
 * @Get()
 * async findAll(): Promise<ApiResponseDto<PaginatedData<UserDto>>> { ... }
 */
export const ApiOffsetPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiOkResponse({
      description: 'Successfully retrieved paginated list',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 10 },
                  totalItems: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 10 },
                  hasPreviousPage: { type: 'boolean', example: false },
                  hasNextPage: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
      },
    }),
  );
};

/**
 * Decorator for documenting cursor paginated API responses in Swagger
 *
 * @example
 * @ApiCursorPaginatedResponse(PostDto)
 * @Get()
 * async findAll(): Promise<ApiResponseDto<CursorPaginatedData<PostDto>>> { ... }
 */
export const ApiCursorPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiOkResponse({
      description: 'Successfully retrieved cursor paginated list',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  limit: { type: 'number', example: 20 },
                  hasMore: { type: 'boolean', example: true },
                  nextCursor: {
                    type: 'string',
                    nullable: true,
                    example: 'eyJpZCI6MTIzfQ==',
                  },
                  prevCursor: { type: 'string', nullable: true, example: null },
                },
              },
            },
          },
        },
      },
    }),
  );
};

/**
 * Decorator for documenting single item API responses in Swagger
 *
 * @example
 * @ApiSingleResponse(UserDto)
 * @Get(':id')
 * async findOne(): Promise<ApiResponseDto<UserDto>> { ... }
 */
export const ApiSingleResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiOkResponse({
      description: 'Successfully retrieved item',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          data: { $ref: getSchemaPath(model) },
        },
      },
    }),
  );
};
