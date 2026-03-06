// src/modules/households/households.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiResponseDto, MessageResponseDto } from '../../common/dto';
import { CurrentUser } from '../auth/decorators';
import type { RequestUser } from '../auth/types/auth.types';

import { HouseholdsService } from './households.service';
import {
  CreateHouseholdRequestDto,
  UpdateHouseholdRequestDto,
  HouseholdResponseDto,
  HouseholdListResponseDto,
} from './dto';

@ApiBearerAuth()
@ApiTags('Households')
@Controller({ path: 'households', version: '1' })
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  // ─── Create household ────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Tạo hộ gia đình mới' })
  @ApiCreatedResponse({
    description: 'Tạo hộ gia đình thành công',
    type: HouseholdResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateHouseholdRequestDto,
  ) {
    const household = await this.householdsService.create(user.userId, dto);
    return ApiResponseDto.success(household, 'Tạo hộ gia đình thành công');
  }

  // ─── Create invite link ──────────────────────────────────────────────

  @Post(':id/invites')
  @ApiOperation({ summary: 'Tạo link mời cho hộ gia đình (admin only)' })
  @ApiCreatedResponse({
    description: 'Tạo link mời thành công',
    type: HouseholdResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Bạn không phải admin của hộ gia đình' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hộ gia đình' })
  async createInvite(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const household = await this.householdsService.createInvite(
      id,
      user.userId,
    );
    return ApiResponseDto.success(household, 'Tạo link mời thành công');
  }

  // ─── Join by invite token ────────────────────────────────────────────────────

  @Post('join/:token')
  @ApiOperation({ summary: 'Tham gia hộ gia đình bằng invite link' })
  @ApiOkResponse({
    description: 'Tham gia hộ gia đình thành công',
    type: HouseholdResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Link mời đã hết hạn' })
  @ApiNotFoundResponse({ description: 'Link mời không tồn tại' })
  async joinByToken(
    @CurrentUser() user: RequestUser,
    @Param('token') token: string,
  ) {
    const { alreadyMember, household } =
      await this.householdsService.joinByToken(user.userId, token);
    return ApiResponseDto.success(
      household,
      alreadyMember
        ? 'Bạn đã là thành viên của hộ gia đình này'
        : 'Tham gia hộ gia đình thành công',
    );
  }

  // ─── List my households ─────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Danh sách hộ gia đình của user hiện tại' })
  @ApiOkResponse({
    description: 'Danh sách hộ gia đình',
    type: HouseholdListResponseDto,
  })
  async findAll(@CurrentUser() user: RequestUser) {
    const households = await this.householdsService.findAllByUser(user.userId);
    return ApiResponseDto.success(households);
  }

  // ─── Get household detail ────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Xem thông tin hộ gia đình' })
  @ApiOkResponse({
    description: 'Thông tin hộ gia đình',
    type: HouseholdResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không phải thành viên của hộ gia đình',
  })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hộ gia đình' })
  async findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const household = await this.householdsService.findOne(id, user.userId);
    return ApiResponseDto.success(household);
  }

  // ─── Update household ───────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tên hộ gia đình (admin only)' })
  @ApiOkResponse({
    description: 'Cập nhật thành công',
    type: HouseholdResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiForbiddenResponse({ description: 'Bạn không phải admin của hộ gia đình' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hộ gia đình' })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHouseholdRequestDto,
  ) {
    const household = await this.householdsService.update(id, user.userId, dto);
    return ApiResponseDto.success(household, 'Cập nhật hộ gia đình thành công');
  }

  // ─── Remove member ──────────────────────────────────────────────────────────

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Xóa thành viên khỏi hộ gia đình (admin only)' })
  @ApiOkResponse({
    description: 'Đã xóa thành viên',
    type: HouseholdResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Bạn không phải admin của hộ gia đình' })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy hộ gia đình hoặc thành viên',
  })
  async removeMember(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    const household = await this.householdsService.removeMember(
      id,
      targetUserId,
      user.userId,
    );
    return ApiResponseDto.success(
      household,
      'Đã xóa thành viên khỏi hộ gia đình',
    );
  }

  // ─── Delete household ───────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hộ gia đình (owner only)' })
  @ApiOkResponse({
    description: 'Đã xóa hộ gia đình',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Bạn không phải owner của hộ gia đình' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hộ gia đình' })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.householdsService.remove(id, user.userId);
    return ApiResponseDto.success(null, 'Đã xóa hộ gia đình');
  }
}
