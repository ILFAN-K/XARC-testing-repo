import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LaunchDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}