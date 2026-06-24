import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceCommandWatchdogService {
  private readonly logger = new Logger(DeviceCommandWatchdogService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('Running Command Watchdog to clean up stalled commands...');

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    try {
      const stalledCommands = await this.prisma.deviceCommand.findMany({
        where: {
          status: { in: ['QUEUED', 'SENT', 'RECEIVED', 'EXECUTING'] },
          createdAt: { lt: fifteenMinutesAgo },
          type: 'INSTALL_AGGREGATOR', // Currently focused on INSTALL_AGGREGATOR, but can expand
        },
      });

      if (stalledCommands.length > 0) {
        this.logger.warn(`Found ${stalledCommands.length} stalled INSTALL_AGGREGATOR commands. Failing them...`);

        const result = await this.prisma.deviceCommand.updateMany({
          where: {
            id: { in: stalledCommands.map(cmd => cmd.id) }
          },
          data: {
            status: 'FAILED',
            failureReason: 'Installation Timeout (Exceeded 15 minutes)',
            completedAt: new Date(),
          },
        });

        this.logger.log(`Successfully timed out ${result.count} stalled commands.`);
      }
    } catch (error) {
      this.logger.error('Failed to run watchdog cleanup:', error);
    }
  }
}
