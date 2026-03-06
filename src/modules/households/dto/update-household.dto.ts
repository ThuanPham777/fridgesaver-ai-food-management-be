// src/modules/households/dto/update-household.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateHouseholdDto {
  @ApiProperty({ example: 'Gia đình Trần', description: 'Tên hộ gia đình mới' })
  @IsString()
  @IsNotEmpty({ message: 'Tên hộ gia đình không được để trống' })
  @MaxLength(100, { message: 'Tên hộ gia đình tối đa 100 ký tự' })
  name: string;
}
