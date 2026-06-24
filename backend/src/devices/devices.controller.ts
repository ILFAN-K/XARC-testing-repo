import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { DevicesService } from './devices.service';
import { LaunchDeviceDto } from './dto/launch-device.dto';
import { LaunchMultipleDevicesDto } from './dto/launch-multiple-devices.dto';
import { LaunchAllDevicesDto } from './dto/launch-all-devices.dto';
import { UpdateDeviceNameDto } from './dto/update-device-name.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { AssignLicenseDto } from './dto/assign-license.dto';

// @UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
  ) {}

  // ─── Device Listing ─────────────────────────────────────────────

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  getDevices(@CurrentUser() user: any) {
    return this.devicesService.getDevices(user.organizationId);
  }

  @Get('online')
  @Roles('SUPERADMIN', 'ADMIN')
  getOnlineDevices(@CurrentUser() user: any) {
    return this.devicesService.getOnlineDevices(user.organizationId);
  }

  @Get('discovered')
  @Roles('SUPERADMIN', 'ADMIN')
  getDiscoveredDevices(@CurrentUser() user: any) {
    return this.devicesService.getDiscoveredDevices(user.organizationId);
  }

  @Get('db')
  @Roles('SUPERADMIN')
  getAllDevices(@CurrentUser() user: any) {
    return this.devicesService.getAllDevices(user.organizationId);
  }

  @Get('launch-logs')
  @Roles('SUPERADMIN', 'ADMIN')
  getLaunchLogs(@CurrentUser() user: any) {
    return this.devicesService.getLaunchLogs(user.organizationId);
  }

  @Get('stats')
  @Roles('SUPERADMIN', 'ADMIN')
  getStats(@CurrentUser() user: any) {
    return this.devicesService.getStats(user.organizationId);
  }

  @Get('check-name')
  @Roles('SUPERADMIN', 'ADMIN')
  checkName(
    @Query('name') name: string,
    @Query('deviceId') deviceId?: string
  ) {
    return this.devicesService.checkNameAvailability(name || '', deviceId);
  }

  @Get('compliance')
  @Roles('SUPERADMIN', 'ADMIN')
  getCompliance(@CurrentUser() user: any) {
    return this.devicesService.getCompliance(user.organizationId);
  }

  // ─── Device Details ─────────────────────────────────────────────

  @Get(':deviceId')
  @Roles('SUPERADMIN', 'ADMIN')
  getDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.getDeviceById(deviceId, user.organizationId);
  }

  @Get(':deviceId/activity')
  @Roles('SUPERADMIN', 'ADMIN')
  getDeviceActivity(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.getDeviceActivity(deviceId, user.organizationId);
  }

  @Get(':deviceId/health')
  @Roles('SUPERADMIN', 'ADMIN')
  getDeviceHealth(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.getDeviceHealth(deviceId, user.organizationId);
  }

  @Get(':deviceId/metrics')
  @Roles('SUPERADMIN', 'ADMIN')
  getDeviceMetrics(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.getDeviceMetrics(deviceId, user.organizationId);
  }

  // ─── Device Registration ────────────────────────────────────────

  @Post('register')
  @Roles('SUPERADMIN', 'ADMIN')
  registerDevice(
    @Body() dto: RegisterDeviceDto,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.registerDevice(
      dto.deviceId,
      dto.friendlyName,
      user?.sub,
    );
  }

  // ─── Device Name ────────────────────────────────────────────────

  @Patch(':deviceId/name')
  @Roles('SUPERADMIN', 'ADMIN')
  updateFriendlyName(
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDeviceNameDto,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.updateFriendlyName(
      deviceId,
      dto.friendlyName,
      user?.sub,
    );
  }

  // ─── Device State ───────────────────────────────────────────────

  @Patch(':deviceId/disable')
  @Roles('SUPERADMIN', 'ADMIN')
  disableDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.disableDevice(deviceId, user?.sub);
  }

  @Patch(':deviceId/enable')
  @Roles('SUPERADMIN', 'ADMIN')
  enableDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.enableDevice(deviceId, user?.sub);
  }

  @Delete(':deviceId')
  @Roles('SUPERADMIN', 'ADMIN')
  removeDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.removeDevice(deviceId, user?.sub);
  }

  // ─── Command Execution ──────────────────────────────────────────

  @Post('launch')
  @Roles('SUPERADMIN', 'ADMIN')
  launch(
    @Body() dto: LaunchDeviceDto,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.launchDevice(
      dto.deviceId,
      dto.moduleId,
      dto.userId,
      user?.sub,
    );
  }

  @Post('launch-multiple')
  @Roles('SUPERADMIN', 'ADMIN')
  launchMultiple(
    @Body() dto: LaunchMultipleDevicesDto,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.launchMultipleDevices(
      dto.deviceIds,
      dto.moduleId,
      dto.userId,
      user?.sub,
    );
  }

  @Post('launch-all')
  @Roles('SUPERADMIN', 'ADMIN')
  launchAll(
    @Body() dto: LaunchAllDevicesDto,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.launchAllDevices(
      dto.moduleId,
      dto.userId,
      dto.onlyLicensed,
      user?.sub,
    );
  }

  @Post(':deviceId/restart-agent')
  @Roles('SUPERADMIN', 'ADMIN')
  restartAgent(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.restartAgent(deviceId, user?.sub);
  }

  @Post('install-aggregator')
  @Roles('SUPERADMIN', 'ADMIN')
  async installAggregator(
    @Body() body: { deviceIds?: string[]; all?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.devicesService.installAggregatorBulk(body.deviceIds || [], !!body.all, user?.sub, user?.organizationId);
  }

  // ─── License Management ─────────────────────────────────────────

  @Get('licenses/available')
  @Roles('SUPERADMIN', 'ADMIN')
  getAvailableLicenses(@CurrentUser() user: any) {
    return this.devicesService.getAvailableLicenses(user.organizationId);
  }

  @Post(':deviceId/license')
  @Roles('SUPERADMIN', 'ADMIN')
  assignLicense(
    @Param('deviceId') deviceId: string,
    @Body() dto: AssignLicenseDto,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.assignLicense(
      deviceId,
      dto.moduleName,
      dto.expiresAt,
      user?.sub,
    );
  }

  @Delete(':deviceId/license/:licenseId')
  @Roles('SUPERADMIN', 'ADMIN')
  revokeLicense(
    @Param('deviceId') deviceId: string,
    @Param('licenseId') licenseId: string,
    @CurrentUser() user: any,
  ) {
    return this.devicesService.revokeLicense(
      deviceId,
      licenseId,
      user?.sub,
    );
  }
}