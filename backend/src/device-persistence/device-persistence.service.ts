import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicePersistenceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Called by WebSocket gateway when an agent connects.
   * Creates a new discovered device or updates an existing one.
   */
  async registerOrUpdateDevice(
    deviceId: string,
    machineName: string,
    metadata?: {
      os?: string;
      ipAddress?: string;
      agentVersion?: string;
      hardwareUuid?: string;
      primaryMacAddress?: string;
      networkInterfaces?: any;
      aggregatorInstalled?: boolean;
      aggregatorVersion?: string;
      aggregatorRunning?: boolean;
    },
  ) {
    const existingDevice =
      await this.prisma.device.findUnique({
        where: { deviceId },
      });

    if (existingDevice) {
      if (
        existingDevice.hardwareUuid &&
        metadata?.hardwareUuid &&
        existingDevice.hardwareUuid !== metadata.hardwareUuid
      ) {
        await this.logIdentityEvent('DEVICE_IDENTITY_CONFLICT', deviceId, {
          oldHardwareUuid: existingDevice.hardwareUuid,
          newHardwareUuid: metadata.hardwareUuid,
        });
      } else if (
        existingDevice.machineName !== machineName &&
        existingDevice.hardwareUuid === metadata?.hardwareUuid
      ) {
        await this.logIdentityEvent('DEVICE_IDENTITY_MACHINE_CHANGED', deviceId, {
          oldMachineName: existingDevice.machineName,
          newMachineName: machineName,
        });
      }

      return this.prisma.device.update({
        where: { deviceId },
        data: {
          machineName,
          status: 'ONLINE',
          lastSeen: new Date(),
          isRegistered: existingDevice.isRegistered,
          friendlyName: existingDevice.friendlyName,
          registeredAt: existingDevice.registeredAt,
          ...(metadata?.os && { os: metadata.os }),
          ...(metadata?.ipAddress && { ipAddress: metadata.ipAddress }),
          ...(metadata?.primaryMacAddress && { primaryMacAddress: metadata.primaryMacAddress }),
          ...(metadata?.agentVersion && { agentVersion: metadata.agentVersion }),
          ...(metadata?.hardwareUuid && { hardwareUuid: metadata.hardwareUuid }),
          ...(metadata?.networkInterfaces && { networkInterfaces: metadata.networkInterfaces }),
          ...(metadata?.aggregatorInstalled !== undefined && {
            aggregatorInstalled: metadata.aggregatorInstalled,
            aggregatorVerifiedAt: new Date(),
            ...(metadata.aggregatorRunning && { aggregatorLastSeen: new Date() }),
          }),
          ...(metadata?.aggregatorVersion && { aggregatorVersion: metadata.aggregatorVersion }),
        },
      });
    }

    if (metadata?.hardwareUuid) {
      const otherDevice = await this.prisma.device.findFirst({
        where: { hardwareUuid: metadata.hardwareUuid },
      });
      if (otherDevice) {
        await this.logIdentityEvent('DEVICE_IDENTITY_RECREATED', deviceId, {
          existingDeviceId: otherDevice.deviceId,
          hardwareUuid: metadata.hardwareUuid,
        });
      }
    }

    const defaultOrg = await this.prisma.organization.findFirst({
      orderBy: { name: 'asc' },
    });

    if (!defaultOrg) {
      throw new Error('No organization found.');
    }

    return this.prisma.device.create({
      data: {
        deviceId,
        machineName,
        status: 'ONLINE',
        lastSeen: new Date(),
        isRegistered: false,
        discoveredAt: new Date(),
        organizationId: defaultOrg.orgId,
        ...(metadata?.os && { os: metadata.os }),
        ...(metadata?.ipAddress && { ipAddress: metadata.ipAddress }),
        ...(metadata?.primaryMacAddress && { primaryMacAddress: metadata.primaryMacAddress }),
        ...(metadata?.agentVersion && { agentVersion: metadata.agentVersion }),
        ...(metadata?.hardwareUuid && { hardwareUuid: metadata.hardwareUuid }),
        ...(metadata?.networkInterfaces && { networkInterfaces: metadata.networkInterfaces }),
        ...(metadata?.aggregatorInstalled !== undefined && {
          aggregatorInstalled: metadata.aggregatorInstalled,
          aggregatorVerifiedAt: new Date(),
          ...(metadata.aggregatorRunning && { aggregatorLastSeen: new Date() }),
        }),
        ...(metadata?.aggregatorVersion && { aggregatorVersion: metadata.aggregatorVersion }),
      },
    });
  }

  /**
   * Logs an identity audit event, suppressing duplicates within 24 hours.
   */
  async logIdentityEvent(action: string, deviceId: string, metadata?: any) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingLog = await this.prisma.auditLog.findFirst({
      where: {
        entityType: 'DEVICE',
        entityId: deviceId,
        action,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (!existingLog) {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityType: 'DEVICE',
          entityId: deviceId,
          metadata: metadata || {},
          performedBy: 'SYSTEM',
        },
      });
    }
  }

  async markDeviceOffline(deviceId: string) {
    return this.prisma.device.updateMany({
      where: { deviceId },
      data: { status: 'OFFLINE' },
    });
  }

  async updateHeartbeat(deviceId: string, ipAddress?: string, primaryMacAddress?: string, networkInterfaces?: any, aggregatorInstalled?: boolean, aggregatorVersion?: string, aggregatorRunning?: boolean) {
    return this.prisma.device.updateMany({
      where: { deviceId },
      data: {
        lastSeen: new Date(),
        status: 'ONLINE',
        ...(ipAddress && { ipAddress }),
        ...(primaryMacAddress && { primaryMacAddress }),
        ...(networkInterfaces && { networkInterfaces }),
        ...(aggregatorInstalled !== undefined && {
          aggregatorInstalled,
          aggregatorVerifiedAt: new Date(),
          ...(aggregatorRunning && { aggregatorLastSeen: new Date() }),
        }),
        ...(aggregatorVersion && { aggregatorVersion }),
      },
    });
  }

  async markStaleDevicesOffline(thresholdSeconds: number = 60) {
    const threshold = new Date(Date.now() - thresholdSeconds * 1000);
    return this.prisma.device.updateMany({
      where: {
        status: 'ONLINE',
        lastSeen: { lt: threshold },
      },
      data: { status: 'OFFLINE' },
    });
  }

  /**
   * Returns registered devices only — used by Systems Inventory.
   */
  async getDevices(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};
    return this.prisma.device.findMany({
      where: { isRegistered: true, ...orgFilter },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        licenses: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns all devices regardless of registration status.
   */
  async getAllDevices(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};
    return this.prisma.device.findMany({
      where: orgFilter,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns discovered but unregistered devices — used by Register Device wizard.
   */
  async getDiscoveredDevices(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};
    return this.prisma.device.findMany({
      where: { isRegistered: false, isDisabled: false, status: 'ONLINE', ...orgFilter },
      orderBy: { discoveredAt: 'desc' },
      select: {
        deviceId: true,
        machineName: true,
        os: true,
        ipAddress: true,
        primaryMacAddress: true,
        hardwareUuid: true,
        agentVersion: true,
        discoveredAt: true,
        status: true,
        aggregatorInstalled: true,
        aggregatorVersion: true,
        aggregatorVerifiedAt: true,
        aggregatorLastSeen: true,
      },
    });
  }

  /**
   * Registers a discovered device with a friendly name.
   */
  async registerDevice(deviceId: string, friendlyName: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (device.isRegistered) {
      throw new ConflictException(`Device ${deviceId} is already registered`);
    }

    // Check friendly name uniqueness
    const nameExists = await this.prisma.device.findFirst({
      where: {
        friendlyName: { equals: friendlyName, mode: 'insensitive' },
        deviceId: { not: deviceId },
      },
    });

    if (nameExists) {
      throw new ConflictException(`Friendly name "${friendlyName}" is already in use`);
    }

    // Check friendly name doesn't match any machine name (except its own)
    const machineNameConflict = await this.prisma.device.findFirst({
      where: {
        machineName: { equals: friendlyName, mode: 'insensitive' },
        deviceId: { not: deviceId },
      },
    });

    if (machineNameConflict) {
      throw new ConflictException(`Friendly name cannot match a machine name`);
    }

    return this.prisma.device.update({
      where: { deviceId },
      data: {
        friendlyName,
        isRegistered: true,
        registeredAt: new Date(),
      },
    });
  }

  /**
   * Returns a single device by deviceId with full relations.
   */
  async getDeviceById(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: {
        organization: { select: { id: true, name: true } },
        licenses: true,
        commands: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return device;
  }

  async updateFriendlyName(deviceId: string, friendlyName: string) {
    // Validate uniqueness
    const nameExists = await this.prisma.device.findFirst({
      where: {
        friendlyName: { equals: friendlyName, mode: 'insensitive' },
        deviceId: { not: deviceId },
      },
    });

    if (nameExists) {
      throw new ConflictException(`Friendly name "${friendlyName}" is already in use`);
    }

    const machineNameConflict = await this.prisma.device.findFirst({
      where: {
        machineName: { equals: friendlyName, mode: 'insensitive' },
        deviceId: { not: deviceId },
      },
    });

    if (machineNameConflict) {
      throw new ConflictException(`Friendly name cannot match a machine name`);
    }

    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return this.prisma.device.update({
      where: { deviceId },
      data: { friendlyName },
    });
  }

  async disableDevice(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (!device.isRegistered) {
      throw new ConflictException('Cannot disable an unregistered device');
    }

    return this.prisma.device.update({
      where: { deviceId },
      data: { isDisabled: true },
    });
  }

  async enableDevice(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return this.prisma.device.update({
      where: { deviceId },
      data: { isDisabled: false },
    });
  }

  async removeDevice(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    // Release assigned licenses
    await this.prisma.systemLicense.deleteMany({
      where: { deviceId: device.id },
    });

    // Remove module assignments
    await this.prisma.moduleSystemAssignment.deleteMany({
      where: { deviceId: device.id },
    });

    // Reset registration state to push back to discovery
    return this.prisma.device.update({
      where: { deviceId },
      data: {
        isRegistered: false,
        friendlyName: null,
        registeredAt: null,
        isDisabled: false,
      },
    });
  }

  async createInstallAggregatorCommand(deviceId: string, createdBy?: string) {
    const device = await this.prisma.device.findUnique({ where: { deviceId } });
    if (!device) throw new NotFoundException(`Device ${deviceId} not found`);

    const installerUrl = process.env.AGGREGATOR_INSTALLER_URL
      || 'https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.6.5/npp.8.6.5.Installer.exe';
    const installerArgs = process.env.AGGREGATOR_INSTALLER_ARGS || '/S';
    const expectedVersion = process.env.AGGREGATOR_EXPECTED_VERSION || '8.6.5';

    return this.prisma.deviceCommand.create({
        data: {
            deviceId: device.id,
            type: 'INSTALL_AGGREGATOR',
            payload: {
                installerUrl,
                installerArguments: installerArgs,
                expectedVersion,
                checksum: '', // Optional checksum for now, can be enforced by Agent
            },
            status: 'QUEUED',
            createdBy,
        },
    });
  }
  private static readonly VALID_COMMAND_STATUSES = ['QUEUED', 'SENT', 'RECEIVED', 'EXECUTING', 'COMPLETED', 'FAILED'];

  async updateCommandStatus(
  commandId: string,
  status: string,
  message?: string,
  ) {
    if (!DevicePersistenceService.VALID_COMMAND_STATUSES.includes(status)) {
      throw new ConflictException(`Invalid command status: ${status}`);
    }

    return this.prisma.deviceCommand.update({
      where: {
        id: commandId,
      },
      data: {
        status,

        ...(status === 'COMPLETED' && {
          completedAt: new Date(),
        }),

        ...(status === 'FAILED' && {
          completedAt: new Date(),
          failureReason: message,
        }),
      },
    });
  }
}