import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { EmailService } from '../email/email.service';

/** Invitation tokens expire after this many hours. */
const INVITATION_EXPIRY_HOURS = 48;

/**
 * Business-logic service for the **Admin › Users Management** module.
 *
 * Handles paginated listing, statistics, user creation, profile retrieval,
 * activity history, workspace aggregation, invitation management, and
 * soft-deletion — all backed by Prisma and audit-logged via AuditService.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /** Generates a cryptographically secure invitation token. */
  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /** Returns a Date that is `INVITATION_EXPIRY_HOURS` from now. */
  private getInvitationExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + INVITATION_EXPIRY_HOURS);
    return expiry;
  }

  // ───────────────────────────────────────────────
  // 1. Paginated user listing
  // ───────────────────────────────────────────────

  /**
   * Returns a paginated, filterable, and sortable list of non-deleted users.
   *
   * - `search` matches against `fullName` or `email` (case-insensitive contains).
   * - `role` and `status` apply exact-match filters.
   * - Results are ordered by `sortBy` / `sortOrder`.
   */
  async findAll(query: GetUsersQueryDto, adminOrgId: string) {
    const { page, limit, search, role, status, sortBy, sortOrder } = query;

    const where: Record<string, any> = { isDeleted: false, organizationId: adminOrgId };

    // Free-text search across name and email
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exact-match filters
    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status as UserStatus;
    }

    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 15);
    const take = Number(limit) || 15;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined,
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ───────────────────────────────────────────────
  // 2. Dashboard statistics
  // ───────────────────────────────────────────────

  /**
   * Returns aggregate counts consumed by the admin dashboard stats cards.
   */
  async getStats(adminOrgId: string) {
    const baseWhere = { isDeleted: false, organizationId: adminOrgId };

    const [totalUsers, activeUsers, adminUsers, pendingInvitations] =
      await Promise.all([
        this.prisma.user.count({ where: baseWhere }),
        this.prisma.user.count({
          where: { ...baseWhere, status: UserStatus.ACTIVE },
        }),
        this.prisma.user.count({
          where: {
            ...baseWhere,
            role: { in: ['SUPERADMIN', 'ADMIN'] },
          },
        }),
        this.prisma.user.count({
          where: {
            ...baseWhere,
            status: UserStatus.PENDING_INVITATION,
          },
        }),
      ]);

    return { totalUsers, activeUsers, adminUsers, pendingInvitations };
  }

  // ───────────────────────────────────────────────
  // 3. Available roles (static lookup)
  // ───────────────────────────────────────────────

  /**
   * Returns the list of assignable roles.
   * Kept as a service method so controllers stay thin and the list is
   * trivially replaceable with a DB-backed lookup later.
   */
  getRoles() {
    return [
      { id: 'MANAGER', name: 'Manager' },
      { id: 'USER', name: 'User' },
    ];
  }

  // ───────────────────────────────────────────────
  // 4. Create a new user
  // ───────────────────────────────────────────────

  /**
   * Creates a new user record with `PENDING_INVITATION` status.
   *
   * @param data       Fields from the create-user DTO.
   * @param performedBy  ID of the admin performing the action (for audit).
   */
  async createUser(
    data: {
      fullName: string;
      email: string;
      role: string;
      sendInvitation?: boolean;
    },
    performedBy: string,
    adminOrgId: string,
  ) {
    if (!adminOrgId) {
      throw new ForbiddenException('Admin must be associated with an organization to create users');
    }

    if (data.role !== 'MANAGER' && data.role !== 'USER') {
      throw new BadRequestException('Role must be either MANAGER or USER');
    }
    // Uniqueness check
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email, isDeleted: false },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const now = new Date();
    const invitationToken = data.sendInvitation !== false
      ? this.generateInvitationToken()
      : undefined;

    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        status: UserStatus.PENDING_INVITATION,
        organizationId: adminOrgId,
        createdBy: performedBy,
        ...(invitationToken
          ? {
              invitationSentAt: now,
              invitationToken,
              invitationExpiresAt: this.getInvitationExpiry(),
            }
          : {}),
      },
    });

    // Audit: user created
    await this.auditService.log({
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      performedBy,
      metadata: {
        email: data.email,
        role: data.role,
        organizationId: adminOrgId,
        description: `Created user ${data.fullName} (${data.email})`,
      },
    });

    // Audit: invitation sent (if applicable)
    if (data.sendInvitation && invitationToken) {
      const org = await this.prisma.organization.findUnique({ where: { id: adminOrgId } });
      
      await this.emailService.sendInvitationEmail(
        data.email, 
        data.fullName, 
        org?.name || 'Your Organization', 
        invitationToken
      );

      await this.auditService.log({
        action: 'INVITATION_SENT',
        entityType: 'USER',
        entityId: user.id,
        performedBy,
        metadata: {
          email: data.email,
          organizationId: adminOrgId,
          description: `Invitation sent to ${data.email}`,
        },
      });
    }

    return {
      success: true,
      userId: user.id,
      ...(invitationToken ? { invitationToken } : {}),
    };
  }

  // ───────────────────────────────────────────────
  // 5. User profile
  // ───────────────────────────────────────────────

  /**
   * Returns the profile of a single non-deleted user.
   */
  async getProfile(id: string, adminOrgId: string, performedBy: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        lastActivityAt: true,
        organizationId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organizationId !== adminOrgId) {
      throw new ForbiddenException('User belongs to a different organization');
    }

    await this.auditService.log({
      action: 'PROFILE_VIEWED',
      entityType: 'USER',
      entityId: id,
      performedBy,
      metadata: { organizationId: adminOrgId },
    });

    return user;
  }

  // ───────────────────────────────────────────────
  // 6. User activity (audit log)
  // ───────────────────────────────────────────────

  /**
   * Returns a paginated activity log for a specific user, sourced from
   * the `AuditLog` table where `entityType = 'USER'`.
   */
  async getActivity(id: string, adminOrgId: string, performedBy: string, page: number = 1, limit: number = 10) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.organizationId !== adminOrgId) {
      throw new ForbiddenException('User belongs to a different organization');
    }

    await this.auditService.log({
      action: 'ACTIVITY_VIEWED',
      entityType: 'USER',
      entityId: id,
      performedBy,
      metadata: { organizationId: adminOrgId },
    });

    const where = { entityType: 'USER', entityId: id };
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const items = logs.map((log) => {
      const meta = (log.metadata ?? {}) as Record<string, any>;
      return {
        id: log.id,
        action: log.action,
        description: meta.description ?? log.action,
        createdAt: log.createdAt,
        metadata: log.metadata,
      };
    });

    return { items, total, page, limit };
  }

  // ───────────────────────────────────────────────
  // 7. User workspace (profile + activity summary)
  // ───────────────────────────────────────────────

  /**
   * Aggregates the user profile, a high-level activity summary, and the
   * ten most recent audit-log entries into a single "workspace" response.
   */
  async getWorkspace(id: string, adminOrgId: string, performedBy: string) {
    const profile = await this.getProfile(id, adminOrgId, performedBy);

    await this.auditService.log({
      action: 'WORKSPACE_OPENED',
      entityType: 'USER',
      entityId: id,
      performedBy,
      metadata: { organizationId: adminOrgId },
    });

    const activityWhere = { entityType: 'USER', entityId: id };

    const [totalActions, latestActivity, recentLogs] = await Promise.all([
      this.prisma.auditLog.count({ where: activityWhere }),
      this.prisma.auditLog.findFirst({
        where: activityWhere,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.auditLog.findMany({
        where: activityWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const recentActivities = recentLogs.map((log) => {
      const meta = (log.metadata ?? {}) as Record<string, any>;
      return {
        id: log.id,
        action: log.action,
        description: meta.description ?? log.action,
        createdAt: log.createdAt,
        metadata: log.metadata,
      };
    });

    return {
      profile,
      activitySummary: {
        totalActions,
        lastActivityAt: latestActivity?.createdAt ?? null,
      },
      recentActivities,
    };
  }

  // ───────────────────────────────────────────────
  // 8. Resend invitation
  // ───────────────────────────────────────────────

  /**
   * Re-sends the invitation email for a user whose status is still
   * `PENDING_INVITATION`.  Updates the `invitationSentAt` timestamp
   * and creates an audit entry.
   */
  async resendInvitation(id: string, performedBy: string, adminOrgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organizationId !== adminOrgId) {
      throw new ForbiddenException('User belongs to a different organization');
    }

    if (user.status !== UserStatus.PENDING_INVITATION) {
      throw new BadRequestException(
        'Invitation can only be resent to users with PENDING_INVITATION status',
      );
    }

    const newToken = this.generateInvitationToken();

    await this.prisma.user.update({
      where: { id },
      data: {
        invitationSentAt: new Date(),
        invitationToken: newToken,
        invitationExpiresAt: this.getInvitationExpiry(),
      },
    });

    await this.auditService.log({
      action: 'INVITATION_RESENT',
      entityType: 'USER',
      entityId: id,
      performedBy,
      metadata: {
        email: user.email,
        organizationId: adminOrgId,
        description: `Invitation resent to ${user.email}`,
      },
    });

    return { success: true, message: 'Invitation resent successfully' };
  }

  // ───────────────────────────────────────────────
  // 9. Soft-delete
  // ───────────────────────────────────────────────

  /**
   * Marks a user as deleted (soft-delete) and records an audit entry.
   */
  async softDelete(id: string, performedBy: string, adminOrgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organizationId !== adminOrgId) {
      throw new ForbiddenException('User belongs to a different organization');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, updatedBy: performedBy },
    });

    await this.auditService.log({
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: id,
      performedBy,
      metadata: {
        email: user.email,
        organizationId: adminOrgId,
        description: `Deleted user ${user.fullName} (${user.email})`,
      },
    });

    return { success: true, message: 'User deleted successfully' };
  }
}
