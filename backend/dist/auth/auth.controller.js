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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const firebase_auth_guard_1 = require("../common/guards/firebase-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const accept_invitation_dto_1 = require("./dto/accept-invitation.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(request, role) {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({ success: false, message: 'Missing or invalid Authorization header' });
        }
        const token = authHeader.split('Bearer ')[1];
        return this.authService.syncUser(token, role);
    }
    getOrganizations() {
        return this.authService.getOrganizations();
    }
    async register(request, fullName, organizationId, role) {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({ success: false, message: 'Missing or invalid Authorization header' });
        }
        const token = authHeader.split('Bearer ')[1];
        return this.authService.registerUser(token, fullName, organizationId, role);
    }
    getMe(user) {
        return this.authService.me(user.sub);
    }
    validateInvitation(token) {
        return this.authService.validateInvitation(token);
    }
    acceptInvitation(acceptInvitationDto) {
        return this.authService.acceptInvitation(acceptInvitationDto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('organizations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available organizations for registration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getOrganizations", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user after Firebase auth' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('fullName')),
    __param(2, (0, common_1.Body)('organizationId')),
    __param(3, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('validate-invitation/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate an invitation token and return user info' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Invitation token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token is valid' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired invitation token' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "validateInvitation", null);
__decorate([
    (0, common_1.Post)('accept-invitation'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept an invitation and set a password to activate the account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invitation accepted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired invitation token' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Account with email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accept_invitation_dto_1.AcceptInvitationDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "acceptInvitation", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map