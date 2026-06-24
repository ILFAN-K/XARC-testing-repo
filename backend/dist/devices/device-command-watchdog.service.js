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
var DeviceCommandWatchdogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceCommandWatchdogService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let DeviceCommandWatchdogService = DeviceCommandWatchdogService_1 = class DeviceCommandWatchdogService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DeviceCommandWatchdogService_1.name);
    }
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
        }
        catch (error) {
            this.logger.error('Failed to run watchdog cleanup:', error);
        }
    }
};
exports.DeviceCommandWatchdogService = DeviceCommandWatchdogService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceCommandWatchdogService.prototype, "handleCron", null);
exports.DeviceCommandWatchdogService = DeviceCommandWatchdogService = DeviceCommandWatchdogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceCommandWatchdogService);
//# sourceMappingURL=device-command-watchdog.service.js.map