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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const admin_users_service_1 = require("./admin-users.service");
const get_users_query_dto_1 = require("./dto/get-users-query.dto");
const create_user_dto_1 = require("./dto/create-user.dto");
const user_response_dto_1 = require("./dto/user-response.dto");
/**
 * Admin controller for user management operations.
 *
 * All endpoints are protected by Firebase authentication and require
 * SUPERADMIN or ADMIN role.
 */
let AdminUsersController = class AdminUsersController {
    constructor(adminUsersService) {
        this.adminUsersService = adminUsersService;
    }
    // ─── List Users (Paginated) ──────────────────────────────────────────
    findAll(query, user) {
        return this.adminUsersService.findAll(query, user.organizationId);
    }
    // ─── User Statistics ─────────────────────────────────────────────────
    getStats(user) {
        return this.adminUsersService.getStats(user.organizationId);
    }
    // ─── Available Roles ─────────────────────────────────────────────────
    getRoles() {
        return this.adminUsersService.getRoles();
    }
    // ─── Create User ─────────────────────────────────────────────────────
    createUser(createUserDto, user) {
        return this.adminUsersService.createUser({
            fullName: createUserDto.fullName,
            email: createUserDto.email,
            role: createUserDto.role,
            sendInvitation: createUserDto.sendInvitation,
        }, user.sub, user.organizationId);
    }
    // ─── User Profile ────────────────────────────────────────────────────
    getProfile(id, user) {
        return this.adminUsersService.getProfile(id, user.organizationId, user.sub);
    }
    // ─── User Activity ───────────────────────────────────────────────────
    getActivity(id, user, page, limit) {
        return this.adminUsersService.getActivity(id, user.organizationId, user.sub, Number(page) || 1, Number(limit) || 10);
    }
    // ─── User Workspace ──────────────────────────────────────────────────
    getWorkspace(id, user) {
        return this.adminUsersService.getWorkspace(id, user.organizationId, user.sub);
    }
    // ─── Resend Invitation ───────────────────────────────────────────────
    resendInvitation(id, user) {
        return this.adminUsersService.resendInvitation(id, user.sub, user.organizationId);
    }
    // ─── Delete User (Soft) ──────────────────────────────────────────────
    deleteUser(id, user) {
        return this.adminUsersService.softDelete(id, user.sub, user.organizationId);
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List users with pagination, search, and filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated user list', type: user_response_dto_1.PaginatedUsersResponseDto }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_users_query_dto_1.GetUsersQueryDto, Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics for dashboard cards' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics', type: user_response_dto_1.UserStatsResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available roles for user creation and filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of available roles', type: [user_response_dto_1.RoleDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user with invitation-based onboarding' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(':id/profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile', type: user_response_dto_1.UserProfileResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated user activity from audit logs' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated activity log', type: user_response_dto_1.PaginatedActivityResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)(':id/workspace'),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregated user workspace (profile + activity summary)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User workspace data', type: user_response_dto_1.UserWorkspaceResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "getWorkspace", null);
__decorate([
    (0, common_1.Post)(':id/resend-invitation'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend invitation email to a pending user' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invitation resent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'User is not in PENDING_INVITATION status' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "resendInvitation", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a user' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "deleteUser", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)('Admin Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [admin_users_service_1.AdminUsersService])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map