import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class AssignLicenseDto {
  @IsString()
  @IsNotEmpty()
  moduleName!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
