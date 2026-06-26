import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnModuleDestroy, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DevicePersistenceService } from '../device-persistence/device-persistence.service';

const wsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

@WebSocketGateway({
  cors: {
    origin: wsOrigins,
    credentials: true,
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(AppGateway.name);
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly devicePersistenceService: DevicePersistenceService,
  ) {}

  @WebSocketServer()
  server!: Server;

  // Primary map: deviceId → socketId
  private connectedDevices = new Map<string, string>();
  // Reverse map: socketId → deviceId (O(1) disconnect lookup)
  private socketToDevice = new Map<string, string>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Heartbeat timeout detection: every 30 seconds, mark stale devices OFFLINE
    this.heartbeatInterval = setInterval(async () => {
      try {
        const result = await this.devicePersistenceService.markStaleDevicesOffline(60);
        if (result.count > 0) {
          this.logger.log(`Heartbeat timeout: marked ${result.count} stale device(s) OFFLINE`);
        }
      } catch (error) {
        this.logger.error('Heartbeat timeout check failed:', error);
      }
    }, 30_000);
  }

  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleConnection(client: Socket) {
    const agentKey = client.handshake.auth?.agentKey || client.handshake.headers?.['x-agent-key'];
    const validKey = process.env.AGENT_SECRET_KEY;
    
    if (!validKey) {
      this.logger.error(`AGENT_SECRET_KEY is not configured in production environment! Rejecting all connections.`);
      client.disconnect(true);
      return;
    }

    if (agentKey !== validKey) {
      this.logger.warn(`Unauthorized agent connection attempt from ${client.id}`);
      client.disconnect(true);
      return;
    }
    this.logger.log(`Agent Connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Agent Disconnected: ${client.id}`);

    // O(1) lookup using reverse map
    const deviceId = this.socketToDevice.get(client.id);
    if (deviceId) {
      // Only mark offline if this socket is still the active one for this device
      const currentSocket = this.connectedDevices.get(deviceId);
      if (currentSocket === client.id) {
        await this.devicePersistenceService.markDeviceOffline(deviceId);
        this.connectedDevices.delete(deviceId);
        this.logger.log(`Device ${deviceId} marked OFFLINE`);
      }
      this.socketToDevice.delete(client.id);
    }
  }

  @SubscribeMessage('register-device')
  async handleRegisterDevice(client: Socket, payload: any) {
    const deviceId = payload.DeviceId;
    const machineName = payload.MachineName;
    const agentVersion = payload.AgentVersion || 'unknown';
    const ip = payload.IPAddress || 'unknown';

    this.logger.verbose(`[Register] Full payload: ${JSON.stringify(payload)}`);

    // Duplicate connection guard: disconnect old socket if same device reconnects
    const existingSocketId = this.connectedDevices.get(deviceId);
    if (existingSocketId && existingSocketId !== client.id) {
      const existingSocket = this.server.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        this.logger.log(`[Register] Duplicate connection for ${deviceId}: disconnecting old socket`);
        await this.devicePersistenceService.logIdentityEvent('DUPLICATE_DEVICE_CONNECTION', deviceId, {
          oldSocketId: existingSocketId,
          newSocketId: client.id,
        });
        this.socketToDevice.delete(existingSocketId);
        existingSocket.disconnect(true);
      }
    }

    // Update maps
    this.connectedDevices.set(deviceId, client.id);
    this.socketToDevice.set(client.id, deviceId);

    // Persist with extended metadata (backward-compatible: fields are optional)
    await this.devicePersistenceService.registerOrUpdateDevice(
      deviceId,
      machineName,
      {
        os: payload.OS || undefined,
        ipAddress: payload.IPAddress || undefined,
        primaryMacAddress: payload.PrimaryMacAddress || undefined,
        agentVersion: payload.AgentVersion || undefined,
        hardwareUuid: payload.HardwareUuid || undefined,
        networkInterfaces: payload.NetworkInterfaces || undefined,
        aggregatorInstalled: payload.AggregatorInstalled,
        aggregatorVersion: payload.AggregatorVersion || undefined,
        aggregatorRunning: payload.AggregatorRunning,
      },
    );

    this.logger.log(`[Register] ${deviceId} (${machineName}) connected — Agent v${agentVersion}, IP ${ip}`);
    return { success: true };
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(client: Socket, payload: any) {
    const deviceId = payload.DeviceId;

    // Self-healing: if the gateway restarted but the agent is still sending heartbeats, remap it.
    if (deviceId && !this.connectedDevices.has(deviceId)) {
      this.connectedDevices.set(deviceId, client.id);
      this.socketToDevice.set(client.id, deviceId);
      this.logger.log(`[Heartbeat] Self-healed connection mapping for ${deviceId}`);
    }

    if (deviceId) {
      await this.devicePersistenceService.updateHeartbeat(
        deviceId,
        payload.IPAddress || undefined,
        payload.PrimaryMacAddress || undefined,
        payload.NetworkInterfaces || undefined,
        payload.AggregatorInstalled,
        payload.AggregatorVersion || undefined,
        payload.AggregatorRunning
      );
    }
    
    return { success: true };
  }

  public sendLaunchCommand(
    deviceId: string,
    module: string,
    commandId: string,
    userId?: string,
  ) {
    const socketId =
      this.connectedDevices.get(
        deviceId,
      );

    if (!socketId) {
      throw new Error(
        `Device ${deviceId} is offline`,
      );
    }

    this.server
      .to(socketId)
      .emit(
        'launch-module',
        {
          module,
          commandId,
          ...(userId ? { userId } : {}),
        },
      );

    this.logger.log(
      `Launch command sent to ${deviceId}`,
    );
  }

  public sendInstallAggregatorCommand(deviceId: string, commandId: string, payload: any) {
    const socketId = this.connectedDevices.get(deviceId);
    if (!socketId) {
      throw new Error(`Device ${deviceId} is offline`);
    }

    this.server.to(socketId).emit('install-aggregator', { commandId, ...payload });
    this.logger.log(`Install Aggregator command sent to ${deviceId}`);
  }

  public sendRestartCommand(deviceId: string) {
    const socketId = this.connectedDevices.get(deviceId);
    if (!socketId) {
      throw new Error(`Device ${deviceId} is offline`);
    }

    this.server.to(socketId).emit('restart-agent', {});
    this.logger.log(`Restart command sent to ${deviceId}`);
  }

  public sendLaunchCommandToAll(module: string, userId?: string) {
    this.server.emit('launch-module', { module, ...(userId ? { userId } : {}) });
    this.logger.log(`Launch command sent to all devices for module ${module}`);
  }

  public sendLaunchCommandToMultiple(
    deviceIds: string[],
    module: string,
    userId?: string,
  ) {
    for (const deviceId of deviceIds) {
      const socketId = this.connectedDevices.get(deviceId);
      if (!socketId) {
        this.logger.log(`Device ${deviceId} is offline, skipping`);
        continue;
      }
      this.server.to(socketId).emit('launch-module', { module, ...(userId ? { userId } : {}) });
      this.logger.log(`Launch command sent to ${deviceId}`);
    }
  }

  public getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices.keys());
  }

  public isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  private static readonly VALID_COMMAND_STATUSES = ['RECEIVED', 'EXECUTING', 'COMPLETED', 'FAILED'];

  @SubscribeMessage('command-status')
  async handleCommandStatus(
    client: Socket,
    payload: any,
  ) {
    const deviceId = this.socketToDevice.get(client.id) || 'unknown';
    const status = payload.Status;
    const commandId = payload.CommandId;

    this.logger.log(`[Command] ${deviceId} — ${commandId?.substring(0, 8)}… → ${status}${payload.Message ? ` (${payload.Message})` : ''}`);

    if (!AppGateway.VALID_COMMAND_STATUSES.includes(status)) {
      this.logger.warn(`[Command] Invalid status received: ${status}`);
      return { success: false, message: `Invalid status. Must be one of: ${AppGateway.VALID_COMMAND_STATUSES.join(', ')}` };
    }

    await this.devicePersistenceService
      .updateCommandStatus(
        commandId,
        status,
        payload.Message,
      );

    return {
      success: true,
    };
  }
}