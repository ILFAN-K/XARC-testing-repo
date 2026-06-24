import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          performedBy: params.performedBy ?? null,
          metadata: params.metadata ?? undefined,
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (error) {
      // Audit logging must never block the primary operation
      console.error('Audit log failed:', error);
    }
  }

  async getByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getByPerformer(performedBy: string) {
    return this.prisma.auditLog.findMany({
      where: { performedBy },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
