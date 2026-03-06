// src/core/base/base.controller.ts
// Abstract base controller providing common CRUD endpoints pattern

import {
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { BaseService, BaseEntity } from './base.service';
import {
  ApiResponseDto,
  OffsetPaginationQueryDto,
  PaginatedData,
} from '../../common/dto';
import { NotFoundException } from '../../common/exceptions';
import { APP_CONSTANTS } from '../../common/constants';

/**
 * Abstract base controller providing common CRUD endpoints
 * Extend this in your domain controllers
 *
 * @example
 * @Controller('users')
 * @ApiTags('Users')
 * class UserController extends BaseController<User> {
 *   constructor(private readonly userService: UserService) {
 *     super(userService, 'User');
 *   }
 * }
 */
export abstract class BaseController<T extends BaseEntity> {
  protected readonly logger: Logger;

  constructor(
    protected readonly service: BaseService<T>,
    protected readonly entityName: string,
  ) {
    this.logger = new Logger(`${entityName}Controller`);
  }

  /**
   * Get all entities with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all items' })
  @SwaggerResponse({ status: 200, description: 'Successfully retrieved items' })
  async findAll(
    @Query() query: OffsetPaginationQueryDto,
  ): Promise<ApiResponseDto<PaginatedData<T>>> {
    this.logger.debug('GET request - findAll');
    const result = await this.service.findAll(query);
    return ApiResponseDto.success(result, APP_CONSTANTS.MESSAGES.SUCCESS);
  }

  /**
   * Get a single entity by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @SwaggerResponse({ status: 200, description: 'Successfully retrieved item' })
  @SwaggerResponse({ status: 404, description: 'Item not found' })
  async findOne(@Param('id') id: string | number): Promise<ApiResponseDto<T>> {
    this.logger.debug(`GET request - findOne: ${id}`);
    const entity = await this.service.findById(id);

    if (!entity) {
      throw new NotFoundException(this.entityName, id);
    }

    return ApiResponseDto.success(entity, APP_CONSTANTS.MESSAGES.SUCCESS);
  }

  /**
   * Create a new entity
   * Override this method to add specific create DTO
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new item' })
  @SwaggerResponse({ status: 201, description: 'Successfully created item' })
  @SwaggerResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDto: Partial<T>): Promise<ApiResponseDto<T>> {
    this.logger.debug('POST request - create');
    const entity = await this.service.create(createDto);
    return ApiResponseDto.success(entity, APP_CONSTANTS.MESSAGES.CREATED);
  }

  /**
   * Update an existing entity
   * Override this method to add specific update DTO
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update item by ID' })
  @SwaggerResponse({ status: 200, description: 'Successfully updated item' })
  @SwaggerResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string | number,
    @Body() updateDto: Partial<T>,
  ): Promise<ApiResponseDto<T>> {
    this.logger.debug(`PUT request - update: ${id}`);

    const exists = await this.service.exists(id);
    if (!exists) {
      throw new NotFoundException(this.entityName, id);
    }

    const entity = await this.service.update(id, updateDto);
    return ApiResponseDto.success(entity, APP_CONSTANTS.MESSAGES.UPDATED);
  }

  /**
   * Delete an entity
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete item by ID' })
  @SwaggerResponse({ status: 200, description: 'Successfully deleted item' })
  @SwaggerResponse({ status: 404, description: 'Item not found' })
  async delete(
    @Param('id') id: string | number,
  ): Promise<ApiResponseDto<null>> {
    this.logger.debug(`DELETE request - delete: ${id}`);

    const exists = await this.service.exists(id);
    if (!exists) {
      throw new NotFoundException(this.entityName, id);
    }

    await this.service.delete(id);
    return ApiResponseDto.success(null, APP_CONSTANTS.MESSAGES.DELETED);
  }
}
