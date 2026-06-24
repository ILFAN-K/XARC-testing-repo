import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateDeviceNameDto {
  @IsString()
  @IsNotEmpty({ message: 'Friendly name is required' })
  @MinLength(3, { message: 'Friendly name must be at least 3 characters' })
  @MaxLength(64, { message: 'Friendly name must be at most 64 characters' })
  friendlyName!: string;
}