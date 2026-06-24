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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const firebase_admin_1 = require("../firebase/firebase-admin");
const id_generator_1 = require("../common/utils/id-generator");
let AuthService = class AuthService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    getRedirectPath(role) {
        const paths = {
            SUPERADMIN: '/super-admin/dashboard',
            ADMIN: '/admin/dashboard',
            INSTRUCTOR: '/instructor/dashboard',
            TRAINEE: '/trainee/dashboard',
            MANAGER: '/admin/dashboard',
        };
        return paths[role] || '/login';
    }
    async getOrganizations() {
        const orgs = await this.prisma.organization.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });
        return { success: true, organizations: orgs };
    }
    async registerUser(token, fullName, organizationId, role) {
        try {
            const decodedToken = await firebase_admin_1.firebaseAdmin.auth().verifyIdToken(token);
            const email = decodedToken.email;
            if (!email) {
                throw new common_1.UnauthorizedException({ success: false, message: 'Token does not contain an email' });
            }
            const existingUser = await this.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new common_1.ConflictException({ success: false, message: 'User already exists' });
            }
            const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
            if (!org)
                throw new common_1.BadRequestException({ success: false, message: 'Invalid organization' });
            const orgCode = (0, id_generator_1.extractOrgCode)(org.name);
            const customUserId = await (0, id_generator_1.generateUserId)(orgCode, role || 'ADMIN', this.prisma);
            const now = new Date();
            const user = await this.prisma.user.create({
                data: {
                    email,
                    fullName,
                    firebaseUid: decodedToken.uid,
                    role: role || 'ADMIN',
                    customUserId,
                    status: client_1.UserStatus.ACTIVE,
                    organizationId: org.orgId, // CRITICAL FIX: The relation targets orgId, not id.
                    lastLoginAt: now,
                    lastActivityAt: now,
                },
            });
            await this.auditService.log({
                action: 'USER_REGISTERED',
                entityType: 'USER',
                entityId: user.id,
                performedBy: user.id,
                metadata: {
                    description: `User registered a new account`,
                },
            });
            return {
                success: true,
                message: 'Registration successful',
                user: {
                    id: user.id, email: user.email, role: user.role, organizationId: user.organizationId,
                },
                redirectPath: this.getRedirectPath(user.role),
            };
        }
        catch (error) {
            console.error('Registration backend failure:', error);
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.UnauthorizedException({ success: false, message: error.message || 'Invalid token' });
        }
    }
    async syncUser(token, role) {
        try {
            // Verify token
            const decodedToken = await firebase_admin_1.firebaseAdmin.auth().verifyIdToken(token);
            const email = decodedToken.email;
            if (!email) {
                throw new common_1.UnauthorizedException({ success: false, message: 'Token does not contain an email' });
            }
            // Check if user already exists in Postgres
            let user = await this.prisma.user.findUnique({
                where: { email },
            });
            if (user) {
                if (user.isDeleted) {
                    throw new common_1.UnauthorizedException({ success: false, message: 'Account is deleted' });
                }
                if (user.status === client_1.UserStatus.PENDING_INVITATION) {
                    // They must accept the invitation first
                    throw new common_1.UnauthorizedException({ success: false, message: 'Please accept your invitation first' });
                }
                if (user.status === client_1.UserStatus.SUSPENDED) {
                    throw new common_1.UnauthorizedException({ success: false, message: 'Account is suspended' });
                }
                const now = new Date();
                // Update firebaseUid if it was missing, and update login/activity timestamps
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        firebaseUid: decodedToken.uid,
                        lastLoginAt: now,
                        lastActivityAt: now,
                    },
                });
            }
            else {
                throw new common_1.UnauthorizedException({ success: false, message: 'User not registered. Please register first.' });
            }
            await this.auditService.log({
                action: 'USER_LOGIN',
                entityType: 'USER',
                entityId: user.id,
                performedBy: user.id,
                metadata: {
                    description: `User logged in`,
                },
            });
            return {
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId,
                    fullName: user.fullName,
                },
                redirectPath: this.getRedirectPath(user.role),
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            throw new common_1.UnauthorizedException({ success: false, message: 'Invalid or expired Firebase token' });
        }
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
                fullName: true,
                customUserId: true,
                status: true,
                lastLoginAt: true,
                organization: {
                    select: {
                        name: true,
                    }
                }
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException({ success: false, message: 'User not found' });
        }
        const { organization, ...userData } = user;
        return {
            success: true,
            user: {
                ...userData,
                organizationName: organization?.name || null,
            },
        };
    }
    async validateInvitation(token) {
        const user = await this.prisma.user.findUnique({
            where: { invitationToken: token },
            include: { organization: true },
        });
        if (!user || user.isDeleted) {
            throw new common_1.BadRequestException({ success: false, message: 'Invalid invitation token' });
        }
        if (user.status !== client_1.UserStatus.PENDING_INVITATION) {
            throw new common_1.BadRequestException({ success: false, message: 'Invitation has already been accepted or is no longer valid' });
        }
        if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
            throw new common_1.BadRequestException({ success: false, message: 'Invitation has expired' });
        }
        return {
            success: true,
            fullName: user.fullName,
            email: user.email,
            organizationName: user.organization?.name || 'Unknown Organization',
            role: user.role,
        };
    }
    async acceptInvitation(dto) {
        const user = await this.prisma.user.findUnique({
            where: { invitationToken: dto.token },
        });
        if (!user) {
            throw new common_1.BadRequestException({ success: false, message: 'Invalid invitation token' });
        }
        if (user.isDeleted) {
            throw new common_1.BadRequestException({ success: false, message: 'Invalid invitation token' });
        }
        if (user.status !== client_1.UserStatus.PENDING_INVITATION) {
            throw new common_1.BadRequestException({ success: false, message: 'Invitation has already been accepted or is no longer valid' });
        }
        if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
            throw new common_1.BadRequestException({ success: false, message: 'Invitation has expired' });
        }
        try {
            // Create Firebase user
            const firebaseUser = await firebase_admin_1.firebaseAdmin.auth().createUser({
                email: user.email,
                password: dto.password,
                displayName: user.fullName || undefined,
            });
            const now = new Date();
            // Update Postgres user
            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    firebaseUid: firebaseUser.uid,
                    status: client_1.UserStatus.ACTIVE,
                    invitationAcceptedAt: now,
                    invitationToken: null,
                    invitationExpiresAt: null,
                },
            });
            // Audit log
            await this.auditService.log({
                action: 'USER_ACTIVATED',
                entityType: 'USER',
                entityId: updatedUser.id,
                performedBy: updatedUser.id,
                metadata: {
                    description: `User accepted invitation and activated account`,
                },
            });
            return {
                success: true,
                message: 'Invitation accepted successfully. You can now log in.',
            };
        }
        catch (error) {
            if (error.code === 'auth/email-already-exists') {
                throw new common_1.ConflictException({ success: false, message: 'An account with this email already exists in the authentication provider.' });
            }
            throw new common_1.BadRequestException({ success: false, message: 'Failed to create account', error: error.message });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map