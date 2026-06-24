import { Module } from '@nestjs/common';
import { DevicePersistenceService } from './device-persistence.service';

@Module({
  providers: [DevicePersistenceService],
  exports: [DevicePersistenceService],
})
export class DevicePersistenceModule {}