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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const device_persistence_service_1 = require("../device-persistence/device-persistence.service");
let AppGateway = class AppGateway {
    constructor(devicePersistenceService) {
        this.devicePersistenceService = devicePersistenceService;
        // Primary map: deviceId → socketId
        this.connectedDevices = new Map();
        // Reverse map: socketId → deviceId (O(1) disconnect lookup)
        this.socketToDevice = new Map();
    }
    afterInit(server) {
        console.log('WebSocket Gateway initialized');
        // Heartbeat timeout detection: every 30 seconds, mark stale devices OFFLINE
        setInterval(async () => {
            try {
                const result = await this.devicePersistenceService.markStaleDevicesOffline(60);
                if (result.count > 0) {
                    console.log(`Heartbeat timeout: marked ${result.count} stale device(s) OFFLINE`);
                }
            }
            catch (error) {
                console.error('Heartbeat timeout check failed:', error);
            }
        }, 30000);
    }
    handleConnection(client) {
        const agentKey = client.handshake.auth?.agentKey || client.handshake.headers?.['x-agent-key'];
        const validKey = process.env.AGENT_SECRET_KEY;
        if (!validKey) {
            console.error(`AGENT_SECRET_KEY is not configured in production environment! Rejecting all connections.`);
            client.disconnect(true);
            return;
        }
        if (agentKey !== validKey) {
            console.warn(`Unauthorized agent connection attempt from ${client.id}`);
            client.disconnect(true);
            return;
        }
        console.log(`Agent Connected: ${client.id}`);
    }
    async handleDisconnect(client) {
        console.log(`Agent Disconnected: ${client.id}`);
        // O(1) lookup using reverse map
        const deviceId = this.socketToDevice.get(client.id);
        if (deviceId) {
            // Only mark offline if this socket is still the active one for this device
            const currentSocket = this.connectedDevices.get(deviceId);
            if (currentSocket === client.id) {
                await this.devicePersistenceService.markDeviceOffline(deviceId);
                this.connectedDevices.delete(deviceId);
                console.log(`Device ${deviceId} marked OFFLINE`);
            }
            this.socketToDevice.delete(client.id);
        }
    }
    async handleRegisterDevice(client, payload) {
        const deviceId = payload.DeviceId;
        const machineName = payload.MachineName;
        console.log('REGISTER PAYLOAD:', JSON.stringify(payload, null, 2));
        // Duplicate connection guard: disconnect old socket if same device reconnects
        const existingSocketId = this.connectedDevices.get(deviceId);
        if (existingSocketId && existingSocketId !== client.id) {
            const existingSocket = this.server.sockets.sockets.get(existingSocketId);
            if (existingSocket) {
                console.log(`Duplicate connection for ${deviceId}: disconnecting old socket ${existingSocketId}`);
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
        await this.devicePersistenceService.registerOrUpdateDevice(deviceId, machineName, {
            os: payload.OS || undefined,
            ipAddress: payload.IPAddress || undefined,
            primaryMacAddress: payload.PrimaryMacAddress || undefined,
            agentVersion: payload.AgentVersion || undefined,
            hardwareUuid: payload.HardwareUuid || undefined,
            networkInterfaces: payload.NetworkInterfaces || undefined,
            aggregatorInstalled: payload.AggregatorInstalled,
            aggregatorVersion: payload.AggregatorVersion || undefined,
            aggregatorRunning: payload.AggregatorRunning,
        });
        console.log(`Agent Connected: ${deviceId} (${machineName})`);
        return { success: true };
    }
    async handleHeartbeat(client, payload) {
        const deviceId = payload.DeviceId;
        console.log('HEARTBEAT PAYLOAD:', JSON.stringify(payload, null, 2));
        // Self-healing: if the gateway restarted but the agent is still sending heartbeats, remap it.
        if (deviceId && !this.connectedDevices.has(deviceId)) {
            this.connectedDevices.set(deviceId, client.id);
            this.socketToDevice.set(client.id, deviceId);
            console.log(`Self-healed connection mapping for device: ${deviceId}`);
        }
        if (deviceId) {
            await this.devicePersistenceService.updateHeartbeat(deviceId, payload.IPAddress || undefined, payload.PrimaryMacAddress || undefined, payload.NetworkInterfaces || undefined, payload.AggregatorInstalled, payload.AggregatorVersion || undefined, payload.AggregatorRunning);
        }
        return { success: true };
    }
    sendLaunchCommand(deviceId, module, commandId, userId) {
        const socketId = this.connectedDevices.get(deviceId);
        if (!socketId) {
            throw new Error(`Device ${deviceId} is offline`);
        }
        this.server
            .to(socketId)
            .emit('launch-module', {
            module,
            commandId,
            ...(userId ? { userId } : {}),
        });
        console.log(`Launch command sent to ${deviceId}`);
    }
    sendInstallAggregatorCommand(deviceId, commandId, payload) {
        const socketId = this.connectedDevices.get(deviceId);
        if (!socketId) {
            throw new Error(`Device ${deviceId} is offline`);
        }
        this.server.to(socketId).emit('install-aggregator', { commandId, ...payload });
        console.log(`Install Aggregator command sent to ${deviceId}`);
    }
    sendRestartCommand(deviceId) {
        const socketId = this.connectedDevices.get(deviceId);
        if (!socketId) {
            throw new Error(`Device ${deviceId} is offline`);
        }
        this.server.to(socketId).emit('restart-agent', {});
        console.log(`Restart command sent to ${deviceId}`);
    }
    sendLaunchCommandToAll(module, userId) {
        this.server.emit('launch-module', { module, ...(userId ? { userId } : {}) });
        console.log(`Launch command sent to all devices for module ${module}`);
    }
    sendLaunchCommandToMultiple(deviceIds, module, userId) {
        for (const deviceId of deviceIds) {
            const socketId = this.connectedDevices.get(deviceId);
            if (!socketId) {
                console.log(`Device ${deviceId} is offline, skipping`);
                continue;
            }
            this.server.to(socketId).emit('launch-module', { module, ...(userId ? { userId } : {}) });
            console.log(`Launch command sent to ${deviceId}`);
        }
    }
    getConnectedDevices() {
        return Array.from(this.connectedDevices.keys());
    }
    isDeviceConnected(deviceId) {
        return this.connectedDevices.has(deviceId);
    }
    async handleCommandStatus(client, payload) {
        console.log('Command Status:', payload);
        await this.devicePersistenceService
            .updateCommandStatus(payload.CommandId, payload.Status, payload.Message);
        return {
            success: true,
        };
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('register-device'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleRegisterDevice", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('command-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleCommandStatus", null);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [device_persistence_service_1.DevicePersistenceService])
], AppGateway);
//# sourceMappingURL=app.gateway.js.map