import { Module } from '@nestjs/common';

import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

import { GatewayModule } from '../gateway/gateway.module';
import { DevicePersistenceModule } from '../device-persistence/device-persistence.module';
import { UsersModule } from '../users/users.module';

import { DeviceCommandWatchdogService } from './device-command-watchdog.service';

@Module({
  imports: [
    GatewayModule,
    DevicePersistenceModule,
    UsersModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceCommandWatchdogService],
})
export class DevicesModule {}