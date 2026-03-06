// src/modules/households/dto/household-response.dto.ts
// Response DTOs for household endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Data shape DTOs (nested types) ──────────────────────────────────────────

export class HouseholdMemberUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  fullName: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  email: string;

  @ApiPropertyOptional({ example: null })
  avatarUrl: string | null;
}

export class HouseholdMemberDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ['admin', 'member'], example: 'admin' })
  role: string;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ type: HouseholdMemberUserDto })
  user: HouseholdMemberUserDto;
}

export class HouseholdInviteDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  token: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class HouseholdDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: 'Gia đình Nguyễn' })
  name: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: HouseholdMemberUserDto })
  owner: HouseholdMemberUserDto;

  @ApiProperty({ type: [HouseholdMemberDto] })
  members: HouseholdMemberDto[];

  @ApiPropertyOptional({ type: HouseholdInviteDto, nullable: true })
  activeInvite: HouseholdInviteDto | null;
}

// ─── API Response wrappers (kế thừa ApiResponseDto để match kiểu trả về) ────

import { ApiResponseDto } from '../../../common/dto';

export class HouseholdResponseDto extends ApiResponseDto<HouseholdDetailDto> {
  @ApiProperty({ type: HouseholdDetailDto })
  declare data: HouseholdDetailDto;
}

export class HouseholdListResponseDto extends ApiResponseDto<
  HouseholdDetailDto[]
> {
  @ApiProperty({ type: [HouseholdDetailDto] })
  declare data: HouseholdDetailDto[];
}
