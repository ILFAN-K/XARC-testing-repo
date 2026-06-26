import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness probe — confirms the process is running. */
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'xarc-nexus-hub-backend',
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness probe — confirms all dependencies are reachable. */
  @Get('ready')
  async getReadiness() {
    const checks: Record<string, string> = {};

    // Database connectivity check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      service: 'xarc-nexus-hub-backend',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
