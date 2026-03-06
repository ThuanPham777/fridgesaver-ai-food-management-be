// src/modules/households/dto/create-household.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Gia đình Nguyễn', description: 'Tên hộ gia đình' })
  @IsString()
  @IsNotEmpty({ message: 'Tên hộ gia đình không được để trống' })
  @MaxLength(100, { message: 'Tên hộ gia đình tối đa 100 ký tự' })
  name: string;
}
