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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_dto_1 = require("./dto/dashboard.dto");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getSummary(user) {
        return this.dashboardService.getSummary(user.organizationId);
    }
    async getLicenseStatus(user) {
        return this.dashboardService.getLicenseStatus(user.organizationId);
    }
    async getPerformance(user) {
        return this.dashboardService.getPerformance(user.organizationId);
    }
    async getEfficiency(user) {
        return this.dashboardService.getEfficiency(user.organizationId);
    }
    async getModuleEfficiency(user) {
        return this.dashboardService.getModuleEfficiency(user.organizationId);
    }
    async getLiveSOP(user) {
        return this.dashboardService.getLiveSOP(user.organizationId);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Dashboard Summary metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Summary returned successfully', type: dashboard_dto_1.DashboardSummaryResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('license-status'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get License Status breakdown' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'License Status returned successfully', type: dashboard_dto_1.LicenseStatusResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getLicenseStatus", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Aggregate Performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance metrics returned successfully', type: dashboard_dto_1.PerformanceResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Get)('efficiency'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Efficiency metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Efficiency metrics returned successfully', type: dashboard_dto_1.EfficiencyResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEfficiency", null);
__decorate([
    (0, common_1.Get)('module-efficiency'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Module Efficiency metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Module efficiency returned successfully', type: dashboard_dto_1.ModuleEfficiencyResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getModuleEfficiency", null);
__decorate([
    (0, common_1.Get)('live-sop'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Live SOP table entries' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Live SOP entries returned successfully', type: [dashboard_dto_1.LiveSOPEntryDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getLiveSOP", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Admin Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map