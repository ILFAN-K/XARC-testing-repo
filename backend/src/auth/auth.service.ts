import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { firebaseAdmin } from '../firebase/firebase-admin';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { generateUserId, extractOrgCode } from '../common/utils/id-generator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static readonly ALLOWED_REGISTRATION_ROLES = ['ADMIN', 'INSTRUCTOR', 'TRAINEE'];
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private getRedirectPath(role: string): string {
    const paths: Record<string, string> = {
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

  async registerUser(token: string, fullName: string, organizationId: string, role?: string) {
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      const email = decodedToken.email;

      if (!email) {
        throw new UnauthorizedException({ success: false, message: 'Token does not contain an email' });
      }

      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictException({ success: false, message: 'User already exists' });
      }

      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw new BadRequestException({ success: false, message: 'Invalid organization' });
      const orgCode = extractOrgCode(org.name);
      const safeRole = role && AuthService.ALLOWED_REGISTRATION_ROLES.includes(role) ? role : 'TRAINEE';
      const customUserId = await generateUserId(orgCode, safeRole, this.prisma);

      const now = new Date();
      const user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          firebaseUid: decodedToken.uid,
          role: safeRole,
          customUserId,
          status: UserStatus.ACTIVE,
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
    } catch (error: any) {
      this.logger.error('Registration backend failure:', error);
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      throw new UnauthorizedException({ success: false, message: error.message || 'Invalid token' });
    }
  }

  async syncUser(token: string, role?: string) {
    try {
      // Verify token
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      const email = decodedToken.email;

      if (!email) {
        throw new UnauthorizedException({ success: false, message: 'Token does not contain an email' });
      }

      // Check if user already exists in Postgres
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        if (user.isDeleted) {
          throw new UnauthorizedException({ success: false, message: 'Account is deleted' });
        }
        if (user.status === UserStatus.PENDING_INVITATION) {
          // They must accept the invitation first
          throw new UnauthorizedException({ success: false, message: 'Please accept your invitation first' });
        }
        if (user.status === UserStatus.SUSPENDED) {
          throw new UnauthorizedException({ success: false, message: 'Account is suspended' });
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
      } else {
        throw new UnauthorizedException({ success: false, message: 'User not registered. Please register first.' });
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
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException({ success: false, message: 'Invalid or expired Firebase token' });
    }
  }

  async me(userId: string) {
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
      throw new UnauthorizedException({ success: false, message: 'User not found' });
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

  async validateInvitation(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { invitationToken: token },
      include: { organization: true },
    });

    if (!user || user.isDeleted) {
      throw new BadRequestException({ success: false, message: 'Invalid invitation token' });
    }

    if (user.status !== UserStatus.PENDING_INVITATION) {
      throw new BadRequestException({ success: false, message: 'Invitation has already been accepted or is no longer valid' });
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new BadRequestException({ success: false, message: 'Invitation has expired' });
    }

    return {
      success: true,
      fullName: user.fullName,
      email: user.email,
      organizationName: user.organization?.name || 'Unknown Organization',
      role: user.role,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const user = await this.prisma.user.findUnique({
      where: { invitationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException({ success: false, message: 'Invalid invitation token' });
    }

    if (user.isDeleted) {
      throw new BadRequestException({ success: false, message: 'Invalid invitation token' });
    }

    if (user.status !== UserStatus.PENDING_INVITATION) {
      throw new BadRequestException({ success: false, message: 'Invitation has already been accepted or is no longer valid' });
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new BadRequestException({ success: false, message: 'Invitation has expired' });
    }

    try {
      // Create Firebase user
      const firebaseUser = await firebaseAdmin.auth().createUser({
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
          status: UserStatus.ACTIVE,
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
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
         throw new ConflictException({ success: false, message: 'An account with this email already exists in the authentication provider.' });
      }
      throw new BadRequestException({ success: false, message: 'Failed to create account' });
    }
  }
}
