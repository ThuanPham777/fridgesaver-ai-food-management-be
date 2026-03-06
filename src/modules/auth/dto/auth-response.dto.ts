// src/modules/auth/dto/auth-response.dto.ts
// Response DTOs for auth endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserRole } from '../../../../generated/prisma/enums';

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

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15m)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (7d)' })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
