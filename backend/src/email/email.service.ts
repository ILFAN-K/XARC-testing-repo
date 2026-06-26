import { Injectable, Logger } from '@nestjs/common';

export interface IEmailProvider {
  sendInvitationEmail(email: string, fullName: string, organizationName: string, invitationToken: string): Promise<void>;
}

class MockEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);

  async sendInvitationEmail(email: string, fullName: string, organizationName: string, invitationToken: string): Promise<void> {
    const baseUrl = process.env.INVITE_BASE_URL || 'http://localhost:3000/invite';
    const inviteUrl = `${baseUrl}/${invitationToken}`;
    
    this.logger.log(`\n======================================================\n[EMAIL] MOCK EMAIL SENT\nTo: ${email} (${fullName})\nOrganization: ${organizationName}\nSubject: You've been invited to XR Nexus\n\nInvitation Link:\n${inviteUrl}\n======================================================`);
  }
}

@Injectable()
export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    // Currently hardcoded to MockEmailProvider. 
    // In the future, this can be injected via ConfigService to switch between SMTP/Resend/SendGrid.
    this.provider = new MockEmailProvider();
  }

  async sendInvitationEmail(email: string, fullName: string, organizationName: string, invitationToken: string): Promise<void> {
    return this.provider.sendInvitationEmail(email, fullName, organizationName, invitationToken);
  }
}
