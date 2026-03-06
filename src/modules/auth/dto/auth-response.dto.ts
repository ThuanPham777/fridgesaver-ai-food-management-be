// src/modules/auth/dto/auth-response.dto.ts
// Response DTOs for auth endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserRole } from '../../../../generated/prisma/enums';

// ─── Data shape DTOs ──────────────────────────────────────────────────────────

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiPropertyOptional() phone: string | null;
  @ApiPropertyOptional() avatarUrl: string | null;
  @ApiProperty() role: UserRole;
  @ApiPropertyOptional() address: string | null;
  @ApiProperty() language: string;
  @ApiProperty() createdAt: Date;
}

/**
 * Service-level auth result (includes refreshToken for cookie).
 * NOT the HTTP response shape — used internally by AuthService and strategies.
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15m)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (7d)' })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}

/**
 * HTTP response data shape for login/register/refresh.
 * Controller sends { accessToken, user } (refreshToken goes to cookie).
 */
export class AuthTokenDto {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOi...' })
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}

// ─── API Response wrappers (kế thừa ApiResponseDto để match kiểu trả về) ────

import { ApiResponseDto } from '../../../common/dto';

export class AuthTokenResponseDto extends ApiResponseDto<AuthTokenDto> {
  @ApiProperty({ type: AuthTokenDto })
  declare data: AuthTokenDto;
}

export class UserProfileResponseDto extends ApiResponseDto<UserProfileDto> {
  @ApiProperty({ type: UserProfileDto })
  declare data: UserProfileDto;
}
