import { Module } from '@nestjs/common';

import { AppGateway } from './app.gateway';
import { DevicePersistenceModule } from '../device-persistence/device-persistence.module';

@Module({
  imports: [
    DevicePersistenceModule,
  ],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}