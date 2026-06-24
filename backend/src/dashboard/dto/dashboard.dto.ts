import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Organization ID to filter summary metrics by.',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ example: 142 })
  totalRegisteredPCs!: number;

  @ApiProperty({ example: 128 })
  totalLicensedPCs!: number;

  @ApiProperty({ example: 112 })
  onlineSystems!: number;

  @ApiProperty({ example: 16 })
  offlineSystems!: number;

  @ApiProperty({ example: 124 })
  activeLicenses!: number;

  @ApiProperty({ example: 150 })
  totalPurchasedLicenses!: number;

  @ApiProperty({ example: 82.7 })
  licenseUtilization!: number;
}

export class LicenseStatusResponseDto {
  @ApiProperty({ example: 92 })
  active!: number;

  @ApiProperty({ example: 5 })
  expiring!: number;

  @ApiProperty({ example: 3 })
  expired!: number;
}

export class PerformanceResponseDto {
  @ApiProperty({ example: 1240 })
  totalUsageHours!: number;

  @ApiProperty({ example: '30d' })
  period!: string;

  @ApiProperty({ example: [65, 72, 80, 55, 90, 85, 78, 92] })
  dailyUsage!: number[];

  @ApiProperty({ example: ['2026-06-01', '2026-06-02'] })
  dailyLabels!: string[];
}

export class EfficiencyResponseDto {
  @ApiProperty({ example: 88 })
  percentage!: number;

  @ApiProperty({ example: 'Module Resource Utilization' })
  label!: string;

  @ApiProperty({ example: [62, 68, 75, 71, 80, 78, 85] })
  weeklyData!: number[];
}

export class LiveSOPEntryDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'DEV-001' })
  deviceId!: string;

  @ApiProperty({ example: 'PC-101' })
  systemName!: string;

  @ApiProperty({ example: 'Fire Safety' })
  module!: string;

  @ApiProperty({ example: 'Active' })
  license!: string;

  @ApiProperty({ example: 'ONLINE' })
  status!: string;

  @ApiProperty({ example: 92 })
  health!: number;

  @ApiProperty({ example: '2026-06-13T10:30:00Z', nullable: true })
  lastSeen!: string | null;
}

export class ModuleEfficiencyItemDto {
  @ApiProperty({ example: 'Fire Safety' })
  name!: string;

  @ApiProperty({ example: 92 })
  utilization!: number;
}

export class ModuleEfficiencyResponseDto {
  @ApiProperty({ example: 88 })
  averageUtilization!: number;

  @ApiProperty({ type: [ModuleEfficiencyItemDto] })
  modules!: ModuleEfficiencyItemDto[];
}
