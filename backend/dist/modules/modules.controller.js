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
exports.ModulesController = void 0;
const common_1 = require("@nestjs/common");
const modules_service_1 = require("./modules.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const assign_system_dto_1 = require("./dto/assign-system.dto");
const assign_bulk_dto_1 = require("./dto/assign-bulk.dto");
const purchase_licenses_dto_1 = require("./dto/purchase-licenses.dto");
const get_available_modules_dto_1 = require("./dto/get-available-modules.dto");
let ModulesController = class ModulesController {
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    findAll(req, search, filter, sort) {
        // Assuming organizationId is set on req.user from auth guard
        const orgId = req.user.organizationId;
        return this.modulesService.findAll(orgId, search, filter, sort);
    }
    findOne(req, id) {
        return this.modulesService.findOne(req.user.organizationId, id);
    }
    getAvailableSystems(req, id) {
        return this.modulesService.getAvailableSystems(req.user.organizationId, id);
    }
    assignSystem(req, id, dto) {
        return this.modulesService.assignSystem(req.user.organizationId, id, dto, req.user.email);
    }
    assignSystemBulk(req, id, dto) {
        return this.modulesService.assignModuleToSystemsBulk(req.user.organizationId, id, dto.deviceIds, req.user.email);
    }
    removeAssignment(req, id, assignmentId) {
        return this.modulesService.removeAssignment(req.user.organizationId, id, assignmentId);
    }
    purchaseLicenses(req, id, dto) {
        return this.modulesService.purchaseLicenses(req.user.organizationId, id, dto);
    }
    getAvailableForLaunch(req, dto) {
        return this.modulesService.getAvailableForLaunch(req.user.organizationId, dto.deviceIds);
    }
};
exports.ModulesController = ModulesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('filter')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/available-systems'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "getAvailableSystems", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_system_dto_1.AssignSystemDto]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "assignSystem", null);
__decorate([
    (0, common_1.Post)(':id/assign-bulk'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_bulk_dto_1.AssignBulkDto]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "assignSystemBulk", null);
__decorate([
    (0, common_1.Delete)(':id/assignments/:assignmentId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('assignmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "removeAssignment", null);
__decorate([
    (0, common_1.Patch)(':id/licenses'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, purchase_licenses_dto_1.PurchaseLicensesDto]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "purchaseLicenses", null);
__decorate([
    (0, common_1.Post)('available-for-launch'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_available_modules_dto_1.GetAvailableModulesDto]),
    __metadata("design:returntype", void 0)
], ModulesController.prototype, "getAvailableForLaunch", null);
exports.ModulesController = ModulesController = __decorate([
    (0, common_1.Controller)('modules'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [modules_service_1.ModulesService])
], ModulesController);
//# sourceMappingURL=modules.controller.js.map