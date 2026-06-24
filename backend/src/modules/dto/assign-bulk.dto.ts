import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBulkDto {
  @ApiProperty({ description: 'Array of device IDs to assign the module to' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deviceIds!: string[];
}
