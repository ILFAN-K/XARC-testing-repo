import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomeMessage() {
    return {
      message: 'XARC Nexus Hub backend is online.',
      timestamp: new Date().toISOString()
    };
  }
}
