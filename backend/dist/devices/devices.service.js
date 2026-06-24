"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const app_gateway_1 = require("../gateway/app.gateway");
const device_persistence_service_1 = require("../device-persistence/device-persistence.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
let DevicesService = class DevicesService {
    constructor(gateway, devicePersistenceService, prisma, auditService, usersService) {
        this.gateway = gateway;
        this.devicePersistenceService = devicePersistenceService;
        this.prisma = prisma;
        this.auditService = auditService;
        this.usersService = usersService;
    }
    // ─── Utilities ──────────────────────────────────────────────────
    isLaunchEligible(device, isConnected) {
        if (!device)
            return false;
        if (!device.isRegistered)
            return false;
        if (device.isDisabled)
            return false;
        // System is considered online if it is connected via WebSocket OR has status ONLINE in DB
        if (!isConnected && device.status !== 'ONLINE')
            return false;
        return true;
    }
    // ─── Identity ───────────────────────────────────────────────────
    async enrichWithDeviceStatuses(devices) {
        if (!devices.length)
            return devices;
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
            if (!acc[log.entityId])
                acc[log.entityId] = [];
            acc[log.entityId].push(log);
            return acc;
        }, {});
        const latestCommandByDeviceId = recentInstallCommands.reduce((acc, cmd) => {
            const dId = cmd.device?.deviceId;
            if (dId && !acc[dId]) {
                acc[dId] = cmd;
            }
            return acc;
        }, {});
        return devices.map(device => {
            const events = logsByDeviceId[device.deviceId] || [];
            let identityStatus = 'Healthy';
            const hasConflict = events.some((e) => e.action === 'DEVICE_IDENTITY_CONFLICT' ||
                e.action === 'DUPLICATE_DEVICE_CONNECTION');
            const hasWarning = events.some((e) => e.action === 'DEVICE_IDENTITY_RECREATED' ||
                e.action === 'DEVICE_IDENTITY_MACHINE_CHANGED');
            if (hasConflict) {
                identityStatus = 'Conflict';
            }
            else if (hasWarning) {
                identityStatus = 'Warning';
            }
            let aggregatorStatus = 'Missing';
            if (device.aggregatorInstalled) {
                const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
                if (device.aggregatorLastSeen && device.aggregatorLastSeen >= twoMinutesAgo) {
                    aggregatorStatus = 'Installed & Running';
                }
                else {
                    aggregatorStatus = 'Installed but Stopped';
                }
            }
            const latestInstallCommand = latestCommandByDeviceId[device.deviceId];
            if (latestInstallCommand) {
                if (['QUEUED', 'SENT', 'RECEIVED', 'EXECUTING'].includes(latestInstallCommand.status)) {
                    aggregatorStatus = 'Installing';
                }
                else if (latestInstallCommand.status === 'FAILED' && !device.aggregatorInstalled) {
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
    async getDevices(organizationId) {
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
    async getAllDevices(organizationId) {
        const devices = await this.devicePersistenceService.getAllDevices(organizationId);
        return this.enrichWithDeviceStatuses(devices);
    }
    async getDiscoveredDevices(organizationId) {
        const devices = await this.devicePersistenceService.getDiscoveredDevices(organizationId);
        const connectedIds = this.gateway.getConnectedDevices();
        // Strict runtime filter to ensure active agent connection
        const filtered = devices.filter((d) => connectedIds.includes(d.deviceId));
        return this.enrichWithDeviceStatuses(filtered);
    }
    async getDeviceById(deviceId, organizationId) {
        const device = await this.devicePersistenceService.getDeviceById(deviceId);
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
    async getStats(organizationId) {
        const connectedIds = this.gateway.getConnectedDevices();
        const orgFilter = organizationId ? { organizationId } : {};
        const totalSystems = await this.prisma.device.count({
            where: { isRegistered: true, ...orgFilter },
        });
        const registeredDevices = await this.prisma.device.findMany({
            where: { isRegistered: true, ...orgFilter },
            select: { deviceId: true, licenses: { select: { id: true } } },
        });
        const onlineSystems = registeredDevices.filter((d) => connectedIds.includes(d.deviceId)).length;
        const offlineSystems = totalSystems - onlineSystems;
        const unlicensedSystems = registeredDevices.filter((d) => d.licenses.length === 0).length;
        return {
            totalSystems,
            onlineSystems,
            offlineSystems,
            unlicensedSystems,
        };
    }
    // ─── Name Availability ──────────────────────────────────────────
    async checkNameAvailability(name, deviceId) {
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
    async getCompliance(organizationId) {
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
    async registerDevice(deviceId, friendlyName, performedBy) {
        if (!this.gateway.isDeviceConnected(deviceId)) {
            throw new common_1.BadRequestException('Device is no longer online. Refresh discovery and try again.');
        }
        const device = await this.devicePersistenceService.registerDevice(deviceId, friendlyName);
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
    async updateFriendlyName(deviceId, friendlyName, performedBy) {
        const existing = await this.prisma.device.findUnique({
            where: { deviceId },
            select: { friendlyName: true },
        });
        const device = await this.devicePersistenceService.updateFriendlyName(deviceId, friendlyName);
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
    async disableDevice(deviceId, performedBy) {
        const device = await this.devicePersistenceService.disableDevice(deviceId);
        await this.auditService.log({
            action: 'DEVICE_DISABLED',
            entityType: 'DEVICE',
            entityId: deviceId,
            performedBy,
        });
        return device;
    }
    async enableDevice(deviceId, performedBy) {
        const device = await this.devicePersistenceService.enableDevice(deviceId);
        await this.auditService.log({
            action: 'DEVICE_ENABLED',
            entityType: 'DEVICE',
            entityId: deviceId,
            performedBy,
        });
        return device;
    }
    async removeDevice(deviceId, performedBy) {
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
    async getDeviceActivity(deviceId, organizationId) {
        // Verify device exists
        await this.devicePersistenceService.getDeviceById(deviceId);
        const auditLogs = await this.auditService.getByEntity('DEVICE', deviceId);
        const commands = await this.prisma.deviceCommand.findMany({
            where: { device: { deviceId } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return { auditLogs, commands };
    }
    // ─── Device Health & Metrics ────────────────────────────────────
    async getDeviceHealth(deviceId, organizationId) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
            select: {
                deviceId: true,
                healthScore: true,
                isCritical: true,
                status: true,
                licenses: { select: { status: true } },
            },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
        }
        // Get latest usage metrics for health breakdown
        const latestMetric = await this.prisma.usageMetric.findFirst({
            where: { device: { deviceId } },
            orderBy: { metricDate: 'desc' },
        });
        const isConnected = this.gateway.isDeviceConnected(deviceId);
        const hasActiveLicense = device.licenses.some((l) => l.status === 'Active');
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
    async getDeviceMetrics(deviceId, organizationId) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
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
    async getOnlineDevices(organizationId) {
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
    async installAggregatorBulk(deviceIds, all, performedBy, organizationId) {
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
            throw new common_1.BadRequestException('No eligible devices found for installation');
        }
        const results = [];
        for (const dId of targetDeviceIds) {
            try {
                const device = await this.prisma.device.findUnique({ where: { deviceId: dId } });
                if (!device)
                    throw new common_1.NotFoundException(`Device ${dId} not found`);
                if (!this.gateway.isDeviceConnected(dId))
                    throw new common_1.BadRequestException(`Device ${dId} is offline`);
                if (device.aggregatorInstalled)
                    throw new common_1.ConflictException(`Aggregator is already installed on device ${dId}`);
                const activeCommand = await this.prisma.deviceCommand.findFirst({
                    where: { deviceId: device.id, type: 'INSTALL_AGGREGATOR', status: { in: ['QUEUED', 'SENT', 'RECEIVED', 'EXECUTING'] } },
                });
                if (activeCommand)
                    throw new common_1.ConflictException(`Aggregator installation is already in progress`);
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
            }
            catch (error) {
                results.push({ deviceId: dId, success: false, reason: error.message });
            }
        }
        return { total: targetDeviceIds.length, results };
    }
    async launchDevice(deviceId, moduleId, userId, performedBy) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
            include: { moduleAssignments: true },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
        }
        if (!this.isLaunchEligible(device, this.gateway.isDeviceConnected(deviceId))) {
            if (!device.isRegistered)
                throw new common_1.BadRequestException(`Device ${deviceId} is not registered`);
            if (device.isDisabled)
                throw new common_1.BadRequestException(`Device ${deviceId} is disabled`);
            if (!this.gateway.isDeviceConnected(deviceId))
                throw new common_1.BadRequestException(`Device ${deviceId} is offline`);
            throw new common_1.BadRequestException(`Device ${deviceId} has no active licenses`);
        }
        if (!device.aggregatorInstalled) {
            throw new common_1.BadRequestException('Aggregator is not installed on this device. Install Aggregator before launching XR modules.');
        }
        const minVersion = process.env.MINIMUM_AGGREGATOR_VERSION;
        if (minVersion && device.aggregatorVersion) {
            if (device.aggregatorVersion.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) < 0) {
                throw new common_1.BadRequestException(`Aggregator version ${device.aggregatorVersion} is outdated. Minimum required version is ${minVersion}.`);
            }
        }
        const moduleRecord = await this.prisma.module.findUnique({
            where: { id: moduleId },
        });
        if (!moduleRecord) {
            throw new common_1.NotFoundException(`Module ${moduleId} not found`);
        }
        const hasLicense = device.moduleAssignments.some((ma) => ma.moduleId === moduleId);
        if (!hasLicense) {
            throw new common_1.BadRequestException(`Device ${deviceId} does not have an active license for module ${moduleRecord.name}`);
        }
        const userRecord = await this.usersService.findOne(userId);
        if (!userRecord) {
            throw new common_1.NotFoundException(`User ${userId} not found or eligible`);
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
        }
        catch (error) {
            await this.prisma.deviceCommand.update({
                where: { id: command.id },
                data: {
                    status: 'FAILED',
                    completedAt: new Date(),
                    failureReason: error.message,
                },
            });
            throw new common_1.BadRequestException(error.message);
        }
    }
    async launchMultipleDevices(deviceIds, moduleId, userId, performedBy) {
        const results = [];
        for (const deviceId of deviceIds) {
            try {
                await this.launchDevice(deviceId, moduleId, userId, performedBy);
                results.push({ deviceId, success: true });
            }
            catch (error) {
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
    async launchAllDevices(moduleId, userId, onlyLicensed = false, performedBy) {
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
            throw new common_1.NotFoundException(`Module ${moduleId} not found`);
        }
        const eligibleDevices = devices.filter(d => {
            if (!this.isLaunchEligible(d, true))
                return false;
            if (onlyLicensed) {
                return d.licenses.some(l => l.moduleName === moduleRecord.name && l.status === 'Active');
            }
            return true;
        });
        const targetDeviceIds = eligibleDevices.map(d => d.deviceId);
        return this.launchMultipleDevices(targetDeviceIds, moduleId, userId, performedBy);
    }
    async restartAgent(deviceId, performedBy) {
        if (!this.gateway.isDeviceConnected(deviceId)) {
            throw new common_1.BadRequestException('Device is currently offline');
        }
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
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
        }
        catch (error) {
            await this.prisma.deviceCommand.update({
                where: { id: command.id },
                data: {
                    status: 'FAILED',
                    completedAt: new Date(),
                    failureReason: error.message,
                },
            });
            throw new common_1.BadRequestException(error.message);
        }
    }
    // ─── Launch Logs (Legacy) ───────────────────────────────────────
    async getLaunchLogs(organizationId) {
        const orgFilter = organizationId ? { organizationId } : {};
        return this.prisma.launchLog.findMany({
            where: orgFilter,
            orderBy: { launchedAt: 'desc' },
        });
    }
    // ─── License Management ─────────────────────────────────────────
    async getAvailableLicenses(organizationId) {
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
    async assignLicense(deviceId, moduleName, expiresAt, performedBy) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
        }
        if (!device.isRegistered) {
            throw new common_1.ConflictException('Cannot assign license to an unregistered device');
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
            throw new common_1.ConflictException(`Device already has a license for module "${moduleName}"`);
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
    async revokeLicense(deviceId, licenseId, performedBy) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device ${deviceId} not found`);
        }
        const license = await this.prisma.systemLicense.findFirst({
            where: { id: licenseId, deviceId: device.id },
        });
        if (!license) {
            throw new common_1.NotFoundException(`License ${licenseId} not found on device ${deviceId}`);
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
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_gateway_1.AppGateway,
        device_persistence_service_1.DevicePersistenceService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        users_service_1.UsersService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map