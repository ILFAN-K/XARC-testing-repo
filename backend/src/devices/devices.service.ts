import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { AppGateway } from '../gateway/app.gateway';
import { DevicePersistenceService } from '../device-persistence/device-persistence.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly gateway: AppGateway,
    private readonly devicePersistenceService: DevicePersistenceService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  // ─── Utilities ──────────────────────────────────────────────────

  private isLaunchEligible(device: any, isConnected: boolean): boolean {
    if (!device) return false;
    if (!device.isRegistered) return false;
    if (device.isDisabled) return false;
    // System is considered online if it is connected via WebSocket OR has status ONLINE in DB
    if (!isConnected && device.status !== 'ONLINE') return false;
    return true;
  }

  // ─── Identity ───────────────────────────────────────────────────

  private async enrichWithDeviceStatuses(devices: any[]) {
    if (!devices.length) return devices;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deviceIds = devices.map(d => d.deviceId);

    const recentAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'Device',
        entityId: { in: deviceIds },
        action: {
          in: [
            'DEVICE_IDENTITY_CONFLICT',
            'DEVICE_IDENTITY_RECREATED',
            'DEVICE_IDENTITY_MACHINE_CHANGED',
            'DUPLICATE_DEVICE_CONNECTION'
          ]
        },
        createdAt: { gte: twentyFourHoursAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    const recentInstallCommands = await this.prisma.deviceCommand.findMany({
      where: {
        device: { deviceId: { in: deviceIds } },
        type: 'INSTALL_AGGREGATOR'
      },
      include: { device: { select: { deviceId: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const logsByDeviceId = recentAuditLogs.reduce((acc, log) => {
      if (!acc[log.entityId]) acc[log.entityId] = [];
      acc[log.entityId].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    const latestCommandByDeviceId = recentInstallCommands.reduce((acc, cmd) => {
      const dId = cmd.device?.deviceId;
      if (dId && !acc[dId]) {
        acc[dId] = cmd;
      }
      return acc;
    }, {} as Record<string, any>);

    return devices.map(device => {
      const events = logsByDeviceId[device.deviceId] || [];
      let identityStatus = 'Healthy';
      
      const hasConflict = events.some((e: any) => 
        e.action === 'DEVICE_IDENTITY_CONFLICT' || 
        e.action === 'DUPLICATE_DEVICE_CONNECTION'
      );
      
      const hasWarning = events.some((e: any) => 
        e.action === 'DEVICE_IDENTITY_RECREATED' || 
        e.action === 'DEVICE_IDENTITY_MACHINE_CHANGED'
      );

      if (hasConflict) {
        identityStatus = 'Conflict';
      } else if (hasWarning) {
        identityStatus = 'Warning';
      }

      let aggregatorStatus = 'Missing';
      if (device.aggregatorInstalled) {
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          if (device.aggregatorLastSeen && device.aggregatorLastSeen >= twoMinutesAgo) {
              aggregatorStatus = 'Installed & Running';
          } else {
              aggregatorStatus = 'Installed but Stopped';
          }
      }
      const latestInstallCommand = latestCommandByDeviceId[device.deviceId];
      if (latestInstallCommand) {
          if (['QUEUED', 'SENT', 'RECEIVED', 'EXECUTING'].includes(latestInstallCommand.status)) {
              aggregatorStatus = 'Installing';
          } else if (latestInstallCommand.status === 'FAILED' && !device.aggregatorInstalled) {
              aggregatorStatus = 'Install Failed';
          }
      }

      return {
        ...device,
        identityStatus,
        identityEventsCount: events.length,
        recentIdentityEvents: events.slice(0, 5), // Return top 5 recent events
        aggregatorStatus
      };
    });
  }

  // ─── Device Listing ─────────────────────────────────────────────

  async getDevices(organizationId?: string) {
    const devices = await this.devicePersistenceService.getDevices(organizationId);
    const connectedIds = this.gateway.getConnectedDevices();

    const mapped = devices.map((device) => ({
      ...device,
      status: connectedIds.includes(device.deviceId) ? 'ONLINE' : device.status,
      connectionStatus: connectedIds.includes(device.deviceId)
        ? 'Connected'
        : 'Disconnected',
    }));
    return this.enrichWithDeviceStatuses(mapped);
  }

  async getAllDevices(organizationId?: string) {
    const devices = await this.devicePersistenceService.getAllDevices(organizationId);
    return this.enrichWithDeviceStatuses(devices);
  }

  async getDiscoveredDevices(organizationId?: string) {
    const devices = await this.devicePersistenceService.getDiscoveredDevices(organizationId);
    const connectedIds = this.gateway.getConnectedDevices();
    
    // Strict runtime filter to ensure active agent connection
    const filtered = devices.filter((d: any) => connectedIds.includes(d.deviceId));
    return this.enrichWithDeviceStatuses(filtered);
  }

  async getDeviceById(deviceId: string, organizationId?: string) {
    const device = await this.devicePersistenceService.getDeviceById(deviceId);
    if (organizationId && device.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const isConnected = this.gateway.isDeviceConnected(deviceId);

    const mapped = {
      ...device,
      status: isConnected ? 'ONLINE' : device.status,
      connectionStatus: isConnected ? 'Connected' : 'Disconnected',
    };
    const enriched = await this.enrichWithDeviceStatuses([mapped]);
    return enriched[0];
  }

  // ─── KPI Stats ──────────────────────────────────────────────────

  async getStats(organizationId?: string) {
    const connectedIds = this.gateway.getConnectedDevices();
    const orgFilter = organizationId ? { organizationId } : {};

    const totalSystems = await this.prisma.device.count({
      where: { isRegistered: true, ...orgFilter },
    });

    const registeredDevices = await this.prisma.device.findMany({
      where: { isRegistered: true, ...orgFilter },
      select: { deviceId: true, licenses: { select: { id: true } } },
    });

    const onlineSystems = registeredDevices.filter(
      (d) => connectedIds.includes(d.deviceId),
    ).length;

    const offlineSystems = totalSystems - onlineSystems;

    const unlicensedSystems = registeredDevices.filter(
      (d) => d.licenses.length === 0,
    ).length;

    return {
      totalSystems,
      onlineSystems,
      offlineSystems,
      unlicensedSystems,
    };
  }

  // ─── Name Availability ──────────────────────────────────────────

  async checkNameAvailability(name: string, deviceId?: string) {
    if (!name || name.length < 3) {
      return { available: false, reason: 'Invalid Name' };
    }

    const trimmed = name.trim();

    if (trimmed.length > 64) {
      return { available: false, reason: 'Name too long' };
    }

    // Check against existing friendly names (case-insensitive)
    const nameExists = await this.prisma.device.findFirst({
      where: {
        friendlyName: { equals: trimmed, mode: 'insensitive' },
        ...(deviceId ? { deviceId: { not: deviceId } } : {}),
      },
    });

    if (nameExists) {
      return { available: false, reason: 'Already Exists' };
    }

    // Check against machine names (case-insensitive)
    const machineNameMatch = await this.prisma.device.findFirst({
      where: {
        machineName: { equals: trimmed, mode: 'insensitive' },
        ...(deviceId ? { deviceId: { not: deviceId } } : {}),
      },
    });

    if (machineNameMatch) {
      return { available: false, reason: 'Cannot match a Machine Name' };
    }

    return { available: true, reason: null };
  }

  // ─── Compliance ─────────────────────────────────────────────────

  async getCompliance(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};
    const orgDeviceFilter = organizationId ? { device: { organizationId } } : {};

    const totalRegistered = await this.prisma.device.count({
      where: { isRegistered: true, ...orgFilter },
    });

    const licensedSystems = await this.prisma.device.count({
      where: {
        isRegistered: true,
        ...orgFilter,
        licenses: { some: { status: 'Active' } },
      },
    });

    const activeLicenses = await this.prisma.systemLicense.count({
      where: { status: 'Active', ...orgDeviceFilter },
    });

    const expiringSoon = await this.prisma.systemLicense.count({
      where: { status: 'Expiring', ...orgDeviceFilter },
    });

    const expired = await this.prisma.systemLicense.count({
      where: { status: 'Expired', ...orgDeviceFilter },
    });

    const totalLicenses = activeLicenses + expiringSoon + expired;
    const percentage = totalLicenses > 0
      ? Math.round((activeLicenses / totalLicenses) * 100)
      : 0;

    return {
      percentage,
      licensedSystems,
      totalRegistered,
      activeLicenses,
      expiringSoon,
      expired,
    };
  }

  // ─── Device Registration ────────────────────────────────────────

  async registerDevice(
    deviceId: string,
    friendlyName: string,
    performedBy?: string,
  ) {
    if (!this.gateway.isDeviceConnected(deviceId)) {
      throw new BadRequestException(
        'Device is no longer online. Refresh discovery and try again.'
      );
    }

    const device = await this.devicePersistenceService.registerDevice(
      deviceId,
      friendlyName,
    );

    await this.auditService.log({
      action: 'DEVICE_REGISTERED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
      metadata: { friendlyName, machineName: device.machineName },
    });

    return device;
  }

  // ─── Device Name ────────────────────────────────────────────────

  async updateFriendlyName(
    deviceId: string,
    friendlyName: string,
    performedBy?: string,
    organizationId?: string,
  ) {
    const existing = await this.prisma.device.findUnique({
      where: { deviceId },
      select: { friendlyName: true, organizationId: true },
    });
    if (!existing) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    if (organizationId && existing.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const device = await this.devicePersistenceService.updateFriendlyName(
      deviceId,
      friendlyName,
    );

    await this.auditService.log({
      action: 'DEVICE_RENAMED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
      metadata: {
        oldName: existing?.friendlyName,
        newName: friendlyName,
      },
    });

    return device;
  }

  // ─── Device State ───────────────────────────────────────────────

  async disableDevice(deviceId: string, performedBy?: string, organizationId?: string) {
    const deviceCheck = await this.prisma.device.findUnique({ where: { deviceId }, select: { organizationId: true } });
    if (!deviceCheck) throw new NotFoundException(`Device ${deviceId} not found`);
    if (organizationId && deviceCheck.organizationId !== organizationId) throw new NotFoundException(`Device ${deviceId} not found`);

    const device = await this.devicePersistenceService.disableDevice(deviceId);

    await this.auditService.log({
      action: 'DEVICE_DISABLED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
    });

    return device;
  }

  async enableDevice(deviceId: string, performedBy?: string, organizationId?: string) {
    const deviceCheck = await this.prisma.device.findUnique({ where: { deviceId }, select: { organizationId: true } });
    if (!deviceCheck) throw new NotFoundException(`Device ${deviceId} not found`);
    if (organizationId && deviceCheck.organizationId !== organizationId) throw new NotFoundException(`Device ${deviceId} not found`);

    const device = await this.devicePersistenceService.enableDevice(deviceId);

    await this.auditService.log({
      action: 'DEVICE_ENABLED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
    });

    return device;
  }

  async removeDevice(deviceId: string, performedBy?: string, organizationId?: string) {
    const deviceCheck = await this.prisma.device.findUnique({ where: { deviceId }, select: { organizationId: true } });
    if (!deviceCheck) throw new NotFoundException(`Device ${deviceId} not found`);
    if (organizationId && deviceCheck.organizationId !== organizationId) throw new NotFoundException(`Device ${deviceId} not found`);

    const device = await this.devicePersistenceService.removeDevice(deviceId);

    await this.auditService.log({
      action: 'DEVICE_REMOVED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
      metadata: { deviceId },
    });

    return device;
  }

  // ─── Device Activity ────────────────────────────────────────────

  async getDeviceActivity(deviceId: string, organizationId?: string) {
    // Verify device exists
    const device = await this.devicePersistenceService.getDeviceById(deviceId);
    if (organizationId && device.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const auditLogs = await this.auditService.getByEntity('DEVICE', deviceId);
    const commands = await this.prisma.deviceCommand.findMany({
      where: { device: { deviceId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { auditLogs, commands };
  }

  // ─── Device Health & Metrics ────────────────────────────────────

  async getDeviceHealth(deviceId: string, organizationId?: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      select: {
        deviceId: true,
        organizationId: true,
        healthScore: true,
        isCritical: true,
        status: true,
        licenses: { select: { status: true } },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    if (organizationId && device.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    // Get latest usage metrics for health breakdown
    const latestMetric = await this.prisma.usageMetric.findFirst({
      where: { device: { deviceId } },
      orderBy: { metricDate: 'desc' },
    });

    const isConnected = this.gateway.isDeviceConnected(deviceId);
    const hasActiveLicense = device.licenses.some(
      (l) => l.status === 'Active',
    );

    return {
      deviceId: device.deviceId,
      healthScore: device.healthScore,
      isCritical: device.isCritical,
      breakdown: {
        cpu: latestMetric?.cpuUsage ?? null,
        memory: latestMetric?.memoryUsage ?? null,
        disk: latestMetric?.diskUsage ?? null,
        agent: isConnected ? 'Running' : 'Stopped',
        license: hasActiveLicense ? 'Active' : 'Inactive',
      },
    };
  }

  async getDeviceMetrics(deviceId: string, organizationId?: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      select: { id: true, organizationId: true },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    if (organizationId && device.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.usageMetric.findMany({
      where: {
        device: { deviceId },
        metricDate: { gte: thirtyDaysAgo },
      },
      orderBy: { metricDate: 'desc' },
    });
  }

  // ─── Online Devices ─────────────────────────────────────────────

  async getOnlineDevices(organizationId?: string) {
    const connectedDeviceIds = this.gateway.getConnectedDevices();

    const orgFilter = organizationId ? { organizationId } : {};

    const devices = await this.prisma.device.findMany({
      where: {
        OR: [
          { status: 'ONLINE' },
          { deviceId: { in: connectedDeviceIds } },
        ],
        ...orgFilter,
      },
      include: { moduleAssignments: true },
    });

    return devices
      .filter((d) => this.isLaunchEligible(d, connectedDeviceIds.includes(d.deviceId)))
      .map((d) => ({
        ...d,
        status: 'ONLINE',
        connectionStatus: 'Connected',
      }));
  }

  // ─── Command Execution (DeviceCommand integration) ──────────────

  async installAggregatorBulk(deviceIds: string[], all: boolean, performedBy?: string, organizationId?: string) {
    let targetDeviceIds = deviceIds;

    if (all) {
      const orgFilter = organizationId ? { organizationId } : {};
      const devices = await this.prisma.device.findMany({
        where: { isRegistered: true, aggregatorInstalled: false, ...orgFilter },
        select: { deviceId: true }
      });
      targetDeviceIds = devices.map(d => d.deviceId);
    }

    if (!targetDeviceIds.length) {
      throw new BadRequestException('No eligible devices found for installation');
    }

    const results = [];
    
    for (const dId of targetDeviceIds) {
      try {
        const device = await this.prisma.device.findUnique({ where: { deviceId: dId } });
        if (!device) throw new NotFoundException(`Device ${dId} not found`);
        if (!this.gateway.isDeviceConnected(dId)) throw new BadRequestException(`Device ${dId} is offline`);
        if (device.aggregatorInstalled) throw new ConflictException(`Aggregator is already installed on device ${dId}`);

        const activeCommand = await this.prisma.deviceCommand.findFirst({
            where: { deviceId: device.id, type: 'INSTALL_AGGREGATOR', status: { in: ['QUEUED', 'SENT', 'RECEIVED', 'EXECUTING'] } },
        });
        if (activeCommand) throw new ConflictException(`Aggregator installation is already in progress`);

        const command = await this.devicePersistenceService.createInstallAggregatorCommand(dId, performedBy);

        this.gateway.sendInstallAggregatorCommand(dId, command.id, command.payload);
        await this.prisma.deviceCommand.update({
            where: { id: command.id },
            data: { status: 'SENT', sentAt: new Date() },
        });

        await this.auditService.log({
            action: 'INSTALL_AGGREGATOR_INITIATED',
            entityType: 'DEVICE',
            entityId: dId,
            performedBy,
            metadata: { commandId: command.id },
        });

        results.push({ deviceId: dId, success: true, commandId: command.id });
      } catch (error: any) {
        results.push({ deviceId: dId, success: false, reason: error.message });
      }
    }

    return { total: targetDeviceIds.length, results };
  }

  async launchDevice(
    deviceId: string,
    moduleId: string,
    userId: string,
    performedBy?: string,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: { moduleAssignments: true },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (!this.isLaunchEligible(device, this.gateway.isDeviceConnected(deviceId))) {
      if (!device.isRegistered) throw new BadRequestException(`Device ${deviceId} is not registered`);
      if (device.isDisabled) throw new BadRequestException(`Device ${deviceId} is disabled`);
      if (!this.gateway.isDeviceConnected(deviceId)) throw new BadRequestException(`Device ${deviceId} is offline`);
      throw new BadRequestException(`Device ${deviceId} has no active licenses`);
    }

    if (!device.aggregatorInstalled) {
      throw new BadRequestException(
        'Aggregator is not installed on this device. Install Aggregator before launching XR modules.'
      );
    }

    const minVersion = process.env.MINIMUM_AGGREGATOR_VERSION;
    if (minVersion && device.aggregatorVersion) {
        if (device.aggregatorVersion.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) < 0) {
            throw new BadRequestException(`Aggregator version ${device.aggregatorVersion} is outdated. Minimum required version is ${minVersion}.`);
        }
    }

    const moduleRecord = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleRecord) {
      throw new NotFoundException(`Module ${moduleId} not found`);
    }

    const hasLicense = device.moduleAssignments.some(
      (ma) => ma.moduleId === moduleId
    );

    if (!hasLicense) {
      throw new BadRequestException(
        `Device ${deviceId} does not have an active license for module ${moduleRecord.name}`
      );
    }

    const userRecord = await this.usersService.findOne(userId);
    if (!userRecord) {
      throw new NotFoundException(`User ${userId} not found or eligible`);
    }

    const command = await this.prisma.deviceCommand.create({
      data: {
        deviceId: device.id,
        type: 'LAUNCH_MODULE',
        payload: { module: moduleRecord.name, userId },
        status: 'QUEUED',
        createdBy: performedBy,
      },
    });

    try {
      this.gateway.sendLaunchCommand(deviceId, moduleRecord.name, command.id, userId);

      await this.prisma.deviceCommand.update({
        where: { id: command.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      // Also write to legacy LaunchLog for backward compatibility
      await this.prisma.launchLog.create({
        data: { deviceId, module: moduleRecord.name, status: 'SUCCESS' },
      });

      await this.auditService.log({
        action: 'MODULE_LAUNCHED',
        entityType: 'DEVICE',
        entityId: deviceId,
        performedBy,
        metadata: { module: moduleRecord.name, commandId: command.id, userId },
      });

      return {
        deviceId,
        moduleId,
        moduleName: moduleRecord.name,
        userId,
        status: 'LAUNCHED',
      };
    } catch (error: any) {
      await this.prisma.deviceCommand.update({
        where: { id: command.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          failureReason: error.message,
        },
      });

      throw new BadRequestException(error.message);
    }
  }

  async launchMultipleDevices(
    deviceIds: string[],
    moduleId: string,
    userId: string,
    performedBy?: string,
  ) {
    const results: Array<{ deviceId: string; success: boolean; error?: string }> = [];

    for (const deviceId of deviceIds) {
      try {
        await this.launchDevice(deviceId, moduleId, userId, performedBy);
        results.push({ deviceId, success: true });
      } catch (error: any) {
        results.push({ deviceId, success: false, error: error.message });
      }
    }

    return {
      success: results.every((r) => r.success),
      moduleId,
      results,
      message: `Launch command processed for ${deviceIds.length} device(s)`,
    };
  }

  async launchAllDevices(
    moduleId: string,
    userId: string,
    onlyLicensed: boolean = false,
    performedBy?: string,
  ) {
    const connectedDeviceIds = this.gateway.getConnectedDevices();
    if (connectedDeviceIds.length === 0) {
      return { success: true, moduleId, results: [], message: 'No devices connected' };
    }

    const devices = await this.prisma.device.findMany({
      where: { deviceId: { in: connectedDeviceIds } },
      include: { licenses: true },
    });

    const moduleRecord = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleRecord) {
      throw new NotFoundException(`Module ${moduleId} not found`);
    }

    const eligibleDevices = devices.filter(d => {
      if (!this.isLaunchEligible(d, true)) return false;
      if (onlyLicensed) {
        return d.licenses.some(l => l.moduleName === moduleRecord.name && l.status === 'Active');
      }
      return true;
    });

    const targetDeviceIds = eligibleDevices.map(d => d.deviceId);
    return this.launchMultipleDevices(targetDeviceIds, moduleId, userId, performedBy);
  }

  async restartAgent(deviceId: string, performedBy?: string) {
    if (!this.gateway.isDeviceConnected(deviceId)) {
      throw new BadRequestException('Device is currently offline');
    }

    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const command = await this.prisma.deviceCommand.create({
      data: {
        deviceId: device.id,
        type: 'RESTART_AGENT',
        status: 'QUEUED',
        createdBy: performedBy,
      },
    });

    try {
      this.gateway.sendRestartCommand(deviceId);

      await this.prisma.deviceCommand.update({
        where: { id: command.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      await this.auditService.log({
        action: 'AGENT_RESTARTED',
        entityType: 'DEVICE',
        entityId: deviceId,
        performedBy,
        metadata: { commandId: command.id },
      });

      return {
        success: true,
        deviceId,
        commandId: command.id,
        message: 'Restart command sent successfully',
      };
    } catch (error: any) {
      await this.prisma.deviceCommand.update({
        where: { id: command.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          failureReason: error.message,
        },
      });

      throw new BadRequestException(error.message);
    }
  }

  // ─── Launch Logs (Legacy) ───────────────────────────────────────

  async getLaunchLogs(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};
    return this.prisma.launchLog.findMany({
      where: orgFilter,
      orderBy: { launchedAt: 'desc' },
    });
  }

  // ─── License Management ─────────────────────────────────────────

  async getAvailableLicenses(organizationId?: string) {
    const orgDeviceFilter = organizationId ? { device: { organizationId } } : {};
    // Return licenses grouped by module with assignment counts
    const allLicenses = await this.prisma.systemLicense.findMany({
      where: orgDeviceFilter,
      include: {
        device: {
          select: { deviceId: true, friendlyName: true, machineName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return allLicenses;
  }

  async assignLicense(
    deviceId: string,
    moduleName: string,
    expiresAt?: string,
    performedBy?: string,
    organizationId?: string,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    if (organizationId && device.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (!device.isRegistered) {
      throw new ConflictException('Cannot assign license to an unregistered device');
    }

    // Check for existing assignment (unique constraint will also catch this)
    const existing = await this.prisma.systemLicense.findUnique({
      where: {
        deviceId_moduleName: {
          deviceId: device.id,
          moduleName,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Device already has a license for module "${moduleName}"`,
      );
    }

    const license = await this.prisma.systemLicense.create({
      data: {
        deviceId: device.id,
        moduleName,
        status: 'Active',
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      action: 'LICENSE_ASSIGNED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
      metadata: { moduleName, licenseId: license.id },
    });

    return license;
  }

  async revokeLicense(
    deviceId: string,
    licenseId: string,
    performedBy?: string,
    organizationId?: string,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    if (organizationId && device.organizationId !== organizationId) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const license = await this.prisma.systemLicense.findFirst({
      where: { id: licenseId, deviceId: device.id },
    });

    if (!license) {
      throw new NotFoundException(`License ${licenseId} not found on device ${deviceId}`);
    }

    await this.prisma.systemLicense.delete({
      where: { id: licenseId },
    });

    await this.auditService.log({
      action: 'LICENSE_REVOKED',
      entityType: 'DEVICE',
      entityId: deviceId,
      performedBy,
      metadata: { moduleName: license.moduleName, licenseId },
    });

    return { success: true, message: 'License revoked successfully' };
  }
}