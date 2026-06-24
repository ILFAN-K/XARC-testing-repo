import { IsArray, IsString, ArrayNotEmpty, IsNotEmpty, IsOptional } from 'class-validator';

export class LaunchMultipleDevicesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  deviceIds!: string[];

  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}