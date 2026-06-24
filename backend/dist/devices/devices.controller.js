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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const devices_service_1 = require("./devices.service");
const launch_device_dto_1 = require("./dto/launch-device.dto");
const launch_multiple_devices_dto_1 = require("./dto/launch-multiple-devices.dto");
const launch_all_devices_dto_1 = require("./dto/launch-all-devices.dto");
const update_device_name_dto_1 = require("./dto/update-device-name.dto");
const register_device_dto_1 = require("./dto/register-device.dto");
const assign_license_dto_1 = require("./dto/assign-license.dto");
let DevicesController = class DevicesController {
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    // ─── Device Listing ─────────────────────────────────────────────
    getDevices(user) {
        return this.devicesService.getDevices(user.organizationId);
    }
    getOnlineDevices(user) {
        return this.devicesService.getOnlineDevices(user.organizationId);
    }
    getDiscoveredDevices(user) {
        return this.devicesService.getDiscoveredDevices(user.organizationId);
    }
    getAllDevices(user) {
        return this.devicesService.getAllDevices(user.organizationId);
    }
    getLaunchLogs(user) {
        return this.devicesService.getLaunchLogs(user.organizationId);
    }
    getStats(user) {
        return this.devicesService.getStats(user.organizationId);
    }
    checkName(name, deviceId) {
        return this.devicesService.checkNameAvailability(name || '', deviceId);
    }
    getCompliance(user) {
        return this.devicesService.getCompliance(user.organizationId);
    }
    // ─── Device Details ─────────────────────────────────────────────
    getDevice(deviceId, user) {
        return this.devicesService.getDeviceById(deviceId, user.organizationId);
    }
    getDeviceActivity(deviceId, user) {
        return this.devicesService.getDeviceActivity(deviceId, user.organizationId);
    }
    getDeviceHealth(deviceId, user) {
        return this.devicesService.getDeviceHealth(deviceId, user.organizationId);
    }
    getDeviceMetrics(deviceId, user) {
        return this.devicesService.getDeviceMetrics(deviceId, user.organizationId);
    }
    // ─── Device Registration ────────────────────────────────────────
    registerDevice(dto, user) {
        return this.devicesService.registerDevice(dto.deviceId, dto.friendlyName, user?.sub);
    }
    // ─── Device Name ────────────────────────────────────────────────
    updateFriendlyName(deviceId, dto, user) {
        return this.devicesService.updateFriendlyName(deviceId, dto.friendlyName, user?.sub);
    }
    // ─── Device State ───────────────────────────────────────────────
    disableDevice(deviceId, user) {
        return this.devicesService.disableDevice(deviceId, user?.sub);
    }
    enableDevice(deviceId, user) {
        return this.devicesService.enableDevice(deviceId, user?.sub);
    }
    removeDevice(deviceId, user) {
        return this.devicesService.removeDevice(deviceId, user?.sub);
    }
    // ─── Command Execution ──────────────────────────────────────────
    launch(dto, user) {
        return this.devicesService.launchDevice(dto.deviceId, dto.moduleId, dto.userId, user?.sub);
    }
    launchMultiple(dto, user) {
        return this.devicesService.launchMultipleDevices(dto.deviceIds, dto.moduleId, dto.userId, user?.sub);
    }
    launchAll(dto, user) {
        return this.devicesService.launchAllDevices(dto.moduleId, dto.userId, dto.onlyLicensed, user?.sub);
    }
    restartAgent(deviceId, user) {
        return this.devicesService.restartAgent(deviceId, user?.sub);
    }
    async installAggregator(body, user) {
        return this.devicesService.installAggregatorBulk(body.deviceIds || [], !!body.all, user?.sub, user?.organizationId);
    }
    // ─── License Management ─────────────────────────────────────────
    getAvailableLicenses(user) {
        return this.devicesService.getAvailableLicenses(user.organizationId);
    }
    assignLicense(deviceId, dto, user) {
        return this.devicesService.assignLicense(deviceId, dto.moduleName, dto.expiresAt, user?.sub);
    }
    revokeLicense(deviceId, licenseId, user) {
        return this.devicesService.revokeLicense(deviceId, licenseId, user?.sub);
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Get)('online'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getOnlineDevices", null);
__decorate([
    (0, common_1.Get)('discovered'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getDiscoveredDevices", null);
__decorate([
    (0, common_1.Get)('db'),
    (0, roles_decorator_1.Roles)('SUPERADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getAllDevices", null);
__decorate([
    (0, common_1.Get)('launch-logs'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getLaunchLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('check-name'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Query)('name')),
    __param(1, (0, common_1.Query)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "checkName", null);
__decorate([
    (0, common_1.Get)('compliance'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getCompliance", null);
__decorate([
    (0, common_1.Get)(':deviceId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getDevice", null);
__decorate([
    (0, common_1.Get)(':deviceId/activity'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getDeviceActivity", null);
__decorate([
    (0, common_1.Get)(':deviceId/health'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getDeviceHealth", null);
__decorate([
    (0, common_1.Get)(':deviceId/metrics'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getDeviceMetrics", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_device_dto_1.RegisterDeviceDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Patch)(':deviceId/name'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_device_name_dto_1.UpdateDeviceNameDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "updateFriendlyName", null);
__decorate([
    (0, common_1.Patch)(':deviceId/disable'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "disableDevice", null);
__decorate([
    (0, common_1.Patch)(':deviceId/enable'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "enableDevice", null);
__decorate([
    (0, common_1.Delete)(':deviceId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "removeDevice", null);
__decorate([
    (0, common_1.Post)('launch'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [launch_device_dto_1.LaunchDeviceDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "launch", null);
__decorate([
    (0, common_1.Post)('launch-multiple'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [launch_multiple_devices_dto_1.LaunchMultipleDevicesDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "launchMultiple", null);
__decorate([
    (0, common_1.Post)('launch-all'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [launch_all_devices_dto_1.LaunchAllDevicesDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "launchAll", null);
__decorate([
    (0, common_1.Post)(':deviceId/restart-agent'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "restartAgent", null);
__decorate([
    (0, common_1.Post)('install-aggregator'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "installAggregator", null);
__decorate([
    (0, common_1.Get)('licenses/available'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getAvailableLicenses", null);
__decorate([
    (0, common_1.Post)(':deviceId/license'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_license_dto_1.AssignLicenseDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "assignLicense", null);
__decorate([
    (0, common_1.Delete)(':deviceId/license/:licenseId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Param)('licenseId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "revokeLicense", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('devices'),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map