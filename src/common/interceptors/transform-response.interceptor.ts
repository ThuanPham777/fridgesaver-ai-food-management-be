// src/common/interceptors/transform-response.interceptor.ts
// Interceptor to transform all responses into standard format

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto';

export interface TransformOptions {
  message?: string;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response is already an ApiResponseDto, return as-is
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // If data has success property, it might be manually formatted
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'message' in data
        ) {
          return data as unknown as ApiResponseDto<T>;
        }

        // Wrap the response in standard format
        return ApiResponseDto.success(data);
      }),
    );
  }
}
