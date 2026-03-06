// src/common/dto/message-response.dto.ts
// Concrete response DTO for endpoints that return no data (data: null)

import { ApiProperty } from '@nestjs/swagger';

import { ApiResponseDto } from './api-response.dto';

export class MessageResponseDto extends ApiResponseDto<null> {
  @ApiProperty({ example: null, nullable: true })
  declare data: null;
}
