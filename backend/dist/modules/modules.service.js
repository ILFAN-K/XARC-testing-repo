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
exports.ModulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ModulesService = class ModulesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateUtilization(assigned, purchased) {
        if (purchased === 0)
            return 0;
        return (assigned / purchased) * 100;
    }
    calculateHealthStatus(utilization) {
        if (utilization < 80)
            return 'Healthy';
        if (utilization < 100)
            return 'Near Capacity';
        return 'Fully Utilized';
    }
    mapModuleWithCalculations(module) {
        const assignedLicenses = module.assignments?.length || 0;
        const availableLicenses = module.purchasedLicenses - assignedLicenses;
        const utilizationPercentage = this.calculateUtilization(assignedLicenses, module.purchasedLicenses);
        const healthStatus = this.calculateHealthStatus(utilizationPercentage);
        return {
            ...module,
            assignedLicenses,
            availableLicenses,
            utilizationPercentage,
            healthStatus,
        };
    }
    async findAll(organizationId, search, filter, sort) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const modules = await this.prisma.module.findMany({
            where: whereClause,
            include: {
                assignments: true,
            },
        });
        let processedModules = modules.map(m => this.mapModuleWithCalculations(m));
        // Apply backend filters
        if (filter && filter !== 'all') {
            processedModules = processedModules.filter(m => {
                if (filter === 'available-capacity')
                    return m.availableLicenses > 0;
                if (filter === 'near-capacity')
                    return m.healthStatus === 'Near Capacity';
                if (filter === 'fully-utilized')
                    return m.healthStatus === 'Fully Utilized';
                return true;
            });
        }
        // Apply sorting
        if (sort) {
            processedModules.sort((a, b) => {
                if (sort === 'name')
                    return a.name.localeCompare(b.name);
                if (sort === 'usage')
                    return b.utilizationPercentage - a.utilizationPercentage;
                return 0;
            });
        }
        return processedModules;
    }
    async findOne(organizationId, id) {
        const module = await this.prisma.module.findFirst({
            where: { id, organizationId },
            include: {
                assignments: {
                    include: {
                        device: true,
                    },
                },
            },
        });
        if (!module)
            throw new common_1.NotFoundException('Module not found');
        return this.mapModuleWithCalculations(module);
    }
    async getAvailableSystems(organizationId, id) {
        const module = await this.prisma.module.findFirst({
            where: { id, organizationId },
            include: { assignments: true },
        });
        if (!module)
            throw new common_1.NotFoundException('Module not found');
        const assignedDeviceIds = module.assignments.map(a => a.deviceId);
        return this.prisma.device.findMany({
            where: {
                organizationId,
                status: 'ONLINE',
                id: { notIn: assignedDeviceIds },
            },
        });
    }
    async assignSystem(organizationId, id, dto, userEmail) {
        const module = await this.prisma.module.findFirst({
            where: { id, organizationId },
            include: { assignments: true },
        });
        if (!module)
            throw new common_1.NotFoundException('Module not found');
        const device = await this.prisma.device.findFirst({
            where: { id: dto.deviceId, organizationId },
        });
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        if (device.status !== 'ONLINE') {
            throw new common_1.BadRequestException('Module licenses can only be assigned to online systems.');
        }
        const assignedLicenses = module.assignments.length;
        if (assignedLicenses >= module.purchasedLicenses) {
            throw new common_1.ConflictException('License capacity reached.');
        }
        const existingAssignment = module.assignments.find(a => a.deviceId === dto.deviceId);
        if (existingAssignment) {
            throw new common_1.ConflictException('Module already assigned to this system.');
        }
        await this.prisma.moduleSystemAssignment.create({
            data: {
                moduleId: id,
                deviceId: dto.deviceId,
                assignedBy: userEmail || 'System',
                organizationId,
            },
        });
        return this.findOne(organizationId, id);
    }
    async assignModuleToSystemsBulk(organizationId, id, deviceIds, userEmail) {
        if (!deviceIds || deviceIds.length === 0) {
            throw new common_1.BadRequestException('No devices provided for assignment.');
        }
        return this.prisma.$transaction(async (tx) => {
            // 1. Module exists
            const module = await tx.module.findFirst({
                where: { id, organizationId },
                include: { assignments: true },
            });
            if (!module)
                throw new common_1.NotFoundException('Module not found');
            // 2. Available capacity
            const assignedLicenses = module.assignments.length;
            const availableLicenses = module.purchasedLicenses - assignedLicenses;
            if (deviceIds.length > availableLicenses) {
                throw new common_1.ConflictException(`Insufficient licenses. Required: ${deviceIds.length}, Available: ${availableLicenses}`);
            }
            // 3. Check devices
            const devices = await tx.device.findMany({
                where: { id: { in: deviceIds }, organizationId },
            });
            if (devices.length !== deviceIds.length) {
                throw new common_1.NotFoundException('One or more devices were not found in your organization.');
            }
            const offlineDevices = devices.filter(d => d.status !== 'ONLINE');
            if (offlineDevices.length > 0) {
                throw new common_1.BadRequestException('All devices must be ONLINE for assignment.');
            }
            // 4. Check existing assignments
            const existingAssignments = module.assignments.filter(a => deviceIds.includes(a.deviceId));
            if (existingAssignments.length > 0) {
                throw new common_1.ConflictException('One or more devices are already assigned to this module.');
            }
            // 5. Create assignments
            await tx.moduleSystemAssignment.createMany({
                data: deviceIds.map(deviceId => ({
                    moduleId: id,
                    deviceId,
                    assignedBy: userEmail || 'System',
                    organizationId,
                })),
            });
            // 6. Return updated module
            const updatedModule = await tx.module.findFirst({
                where: { id, organizationId },
                include: {
                    assignments: {
                        include: { device: true },
                    },
                },
            });
            return this.mapModuleWithCalculations(updatedModule);
        });
    }
    async removeAssignment(organizationId, id, assignmentId) {
        const assignment = await this.prisma.moduleSystemAssignment.findFirst({
            where: { id: assignmentId, moduleId: id, organizationId },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        await this.prisma.moduleSystemAssignment.delete({
            where: { id: assignmentId },
        });
        return this.findOne(organizationId, id);
    }
    async purchaseLicenses(organizationId, id, dto) {
        const module = await this.prisma.module.findFirst({
            where: { id, organizationId },
        });
        if (!module)
            throw new common_1.NotFoundException('Module not found');
        await this.prisma.module.update({
            where: { id },
            data: {
                purchasedLicenses: module.purchasedLicenses + dto.additionalLicenses,
            },
        });
        return this.findOne(organizationId, id);
    }
    async getAvailableForLaunch(organizationId, deviceIds) {
        if (!deviceIds || deviceIds.length === 0)
            return [];
        // Map string deviceIds (e.g. "PC-01") to internal Prisma CUIDs
        const devices = await this.prisma.device.findMany({
            where: {
                organizationId,
                deviceId: { in: deviceIds },
            },
            select: { id: true, deviceId: true },
        });
        const internalDeviceIds = devices.map(d => d.id);
        if (internalDeviceIds.length === 0)
            return [];
        // Find all modules assigned to these devices using internal CUIDs
        const modules = await this.prisma.module.findMany({
            where: {
                organizationId,
                assignments: {
                    some: {
                        deviceId: { in: internalDeviceIds },
                    },
                },
            },
            include: { assignments: true },
        });
        // Filter down to ONLY modules where every single internal CUID requested exists in the assignments
        const validModules = modules.filter(m => {
            const assignedDeviceIds = m.assignments.map(a => a.deviceId);
            return internalDeviceIds.every(id => assignedDeviceIds.includes(id));
        });
        return validModules.map(m => ({
            id: m.id,
            moduleId: m.moduleId,
            name: m.name,
            description: m.description,
            iconKey: m.iconKey,
            category: m.category,
            version: m.version,
        }));
    }
};
exports.ModulesService = ModulesService;
exports.ModulesService = ModulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModulesService);
//# sourceMappingURL=modules.service.js.map