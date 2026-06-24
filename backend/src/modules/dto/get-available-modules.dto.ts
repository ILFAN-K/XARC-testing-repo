import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAvailableModulesDto {
  @ApiProperty({ description: 'Array of device IDs to check module availability for' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deviceIds!: string[];
}
