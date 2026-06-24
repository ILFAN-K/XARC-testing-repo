"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const health_controller_1 = require("./health/health.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const gateway_module_1 = require("./gateway/gateway.module");
const devices_module_1 = require("./devices/devices.module");
const device_persistence_module_1 = require("./device-persistence/device-persistence.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const audit_module_1 = require("./audit/audit.module");
const modules_module_1 = require("./modules/modules.module");
const email_module_1 = require("./email/email.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            gateway_module_1.GatewayModule,
            devices_module_1.DevicesModule,
            device_persistence_module_1.DevicePersistenceModule,
            dashboard_module_1.DashboardModule,
            audit_module_1.AuditModule,
            modules_module_1.ModulesModule,
            email_module_1.EmailModule,
        ],
        controllers: [
            app_controller_1.AppController,
            health_controller_1.HealthController,
        ],
        providers: [
            app_service_1.AppService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map