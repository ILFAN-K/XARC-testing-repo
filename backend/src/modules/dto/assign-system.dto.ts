import { IsString, IsNotEmpty } from 'class-validator';

export class AssignSystemDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}
