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
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_admin_1 = require("../../firebase/firebase-admin");
const prisma_service_1 = require("../../prisma/prisma.service");
let FirebaseAuthGuard = class FirebaseAuthGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({ success: false, message: 'Missing or invalid Authorization header' });
        }
        const token = authHeader.split('Bearer ')[1];
        try {
            // Verify Firebase ID Token and enforce revocation/disabled checks
            const decodedToken = await firebase_admin_1.firebaseAdmin.auth().verifyIdToken(token, true);
            // Look up user in PostgreSQL strictly by firebaseUid
            const user = await this.prisma.user.findFirst({
                where: {
                    firebaseUid: decodedToken.uid
                },
            });
            if (!user) {
                throw new common_1.UnauthorizedException({ success: false, message: 'User not found in database. Please sync/register first.' });
            }
            // Ensure Firebase UID is synced if it was missing
            if (!user.firebaseUid) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { firebaseUid: decodedToken.uid },
                });
                user.firebaseUid = decodedToken.uid;
            }
            // Attach user to request
            request.user = {
                sub: user.id,
                email: user.email,
                role: user.role,
                firebaseUid: user.firebaseUid,
                organizationId: user.organizationId || null,
            };
            return true;
        }
        catch (error) {
            throw new common_1.UnauthorizedException({ success: false, message: 'Invalid or expired Firebase token' });
        }
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map