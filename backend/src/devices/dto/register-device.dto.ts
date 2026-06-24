import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Friendly name must be at least 3 characters' })
  @MaxLength(64, { message: 'Friendly name must be at most 64 characters' })
  friendlyName!: string;
}
