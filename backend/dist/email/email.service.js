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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
class MockEmailProvider {
    constructor() {
        this.logger = new common_1.Logger(MockEmailProvider.name);
    }
    async sendInvitationEmail(email, fullName, organizationName, invitationToken) {
        const inviteUrl = `http://localhost:3000/invite/${invitationToken}`;
        this.logger.log(`\n======================================================\n[EMAIL] MOCK EMAIL SENT\nTo: ${email} (${fullName})\nOrganization: ${organizationName}\nSubject: You've been invited to XR Nexus\n\nInvitation Link:\n${inviteUrl}\n======================================================`);
    }
}
let EmailService = class EmailService {
    constructor() {
        // Currently hardcoded to MockEmailProvider. 
        // In the future, this can be injected via ConfigService to switch between SMTP/Resend/SendGrid.
        this.provider = new MockEmailProvider();
    }
    async sendInvitationEmail(email, fullName, organizationName, invitationToken) {
        return this.provider.sendInvitationEmail(email, fullName, organizationName, invitationToken);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map