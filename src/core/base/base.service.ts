// src/core/base/base.service.ts
// Abstract base service providing common CRUD operations pattern

import { Logger } from '@nestjs/common';
import {
  OffsetPaginationQueryDto,
  CursorPaginationQueryDto,
  PaginatedData,
  CursorPaginatedData,
  createOffsetPaginationMeta,
  createCursorPaginationMeta,
} from '../../common/dto';

/**
 * Base entity interface - extend this for your entities
 */
export interface BaseEntity {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Repository interface - implement this for your data layer
 * This keeps the base service ORM-agnostic
 */
export interface IBaseRepository<T extends BaseEntity> {
  findAll(options?: any): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  findOne(conditions: Partial<T>): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T>;
  delete(id: string | number): Promise<void>;
  count(conditions?: Partial<T>): Promise<number>;
}

/**
 * Abstract base service providing common patterns
 * Extend this in your domain services
 *
 * @example
 * class UserService extends BaseService<User> {
 *   constructor(private readonly userRepository: UserRepository) {
 *     super(userRepository, 'UserService');
 *   }
 * }
 */
export abstract class BaseService<T extends BaseEntity> {
  protected readonly logger: Logger;

  constructor(
    protected readonly repository: IBaseRepository<T>,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
  }

  /**
   * Find all entities with offset pagination
   */
  async findAll(
    query: OffsetPaginationQueryDto,
  ): Promise<PaginatedData<T>> {
    this.logger.debug('Finding all entities with pagination', { query });

    const [items, totalItems] = await Promise.all([
      this.repository.findAll({
        skip: query.offset,
        take: query.limit,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : undefined,
      }),
      this.repository.count(),
    ]);

    return {
      items,
      meta: createOffsetPaginationMeta(query.page, query.limit, totalItems),
    };
  }

  /**
   * Find all entities with cursor pagination
   */
  async findAllCursorPaginated(
    query: CursorPaginationQueryDto,
    cursorField: keyof T = 'id' as keyof T,
  ): Promise<CursorPaginatedData<T>> {
    this.logger.debug('Finding all entities with cursor pagination', { query });

    const items = await this.repository.findAll({
      take: query.take,
      cursor: query.cursor ? { [cursorField]: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
    });

    const hasMore = items.length > query.limit;
    const resultItems = hasMore ? items.slice(0, -1) : items;
    const nextCursor =
      hasMore && resultItems.length > 0
        ? String(resultItems[resultItems.length - 1][cursorField])
        : null;

    return {
      items: resultItems,
      meta: createCursorPaginationMeta(
        query.limit,
        hasMore,
        nextCursor,
        query.cursor ?? null,
      ),
    };
  }

  /**
   * Find all entities without pagination
   */
  async findAllNoPagination(): Promise<T[]> {
    this.logger.debug('Finding all entities');
    return this.repository.findAll();
  }

  /**
   * Find a single entity by ID
   */
  async findById(id: string | number): Promise<T | null> {
    this.logger.debug(`Finding entity by ID: ${id}`);
    return this.repository.findById(id);
  }

  /**
   * Find a single entity by conditions
   */
  async findOne(conditions: Partial<T>): Promise<T | null> {
    this.logger.debug('Finding entity by conditions', { conditions });
    return this.repository.findOne(conditions);
  }

  /**
   * Create a new entity
   */
  async create(data: Partial<T>): Promise<T> {
    this.logger.debug('Creating new entity', { data });
    return this.repository.create(data);
  }

  /**
   * Update an existing entity
   */
  async update(id: string | number, data: Partial<T>): Promise<T> {
    this.logger.debug(`Updating entity: ${id}`, { data });
    return this.repository.update(id, data);
  }

  /**
   * Delete an entity
   */
  async delete(id: string | number): Promise<void> {
    this.logger.debug(`Deleting entity: ${id}`);
    return this.repository.delete(id);
  }

  /**
   * Check if an entity exists
   */
  async exists(id: string | number): Promise<boolean> {
    const entity = await this.repository.findById(id);
    return entity !== null;
  }

  /**
   * Count entities
   */
  async count(conditions?: Partial<T>): Promise<number> {
    return this.repository.count(conditions);
  }
}
