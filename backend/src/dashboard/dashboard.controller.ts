import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import {
  DashboardSummaryResponseDto,
  LicenseStatusResponseDto,
  PerformanceResponseDto,
  EfficiencyResponseDto,
  LiveSOPEntryDto,
  ModuleEfficiencyResponseDto,
} from './dto/dashboard.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get Dashboard Summary metrics' })
  @ApiResponse({ status: 200, description: 'Summary returned successfully', type: DashboardSummaryResponseDto })
  async getSummary(@CurrentUser() user: any): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(user.organizationId);
  }

  @Get('license-status')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get License Status breakdown' })
  @ApiResponse({ status: 200, description: 'License Status returned successfully', type: LicenseStatusResponseDto })
  async getLicenseStatus(@CurrentUser() user: any): Promise<LicenseStatusResponseDto> {
    return this.dashboardService.getLicenseStatus(user.organizationId);
  }

  @Get('performance')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get Aggregate Performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics returned successfully', type: PerformanceResponseDto })
  async getPerformance(@CurrentUser() user: any): Promise<PerformanceResponseDto> {
    return this.dashboardService.getPerformance(user.organizationId);
  }

  @Get('efficiency')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get Efficiency metrics' })
  @ApiResponse({ status: 200, description: 'Efficiency metrics returned successfully', type: EfficiencyResponseDto })
  async getEfficiency(@CurrentUser() user: any): Promise<EfficiencyResponseDto> {
    return this.dashboardService.getEfficiency(user.organizationId);
  }

  @Get('module-efficiency')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get Module Efficiency metrics' })
  @ApiResponse({ status: 200, description: 'Module efficiency returned successfully', type: ModuleEfficiencyResponseDto })
  async getModuleEfficiency(@CurrentUser() user: any): Promise<ModuleEfficiencyResponseDto> {
    return this.dashboardService.getModuleEfficiency(user.organizationId);
  }

  @Get('live-sop')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get Live SOP table entries' })
  @ApiResponse({ status: 200, description: 'Live SOP entries returned successfully', type: [LiveSOPEntryDto] })
  async getLiveSOP(@CurrentUser() user: any): Promise<LiveSOPEntryDto[]> {
    return this.dashboardService.getLiveSOP(user.organizationId);
  }
}
