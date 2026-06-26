import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class InstallAggregatorDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceIds?: string[];

  @IsOptional()
  @IsBoolean()
  all?: boolean;
}
