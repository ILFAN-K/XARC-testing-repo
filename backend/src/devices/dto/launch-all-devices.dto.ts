import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class LaunchAllDevicesDto {
  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  @IsOptional()
  @IsBoolean()
  onlyLicensed?: boolean;

  @IsNotEmpty()
  @IsString()
  userId!: string;
}
