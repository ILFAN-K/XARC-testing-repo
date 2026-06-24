const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const DEVICE_ID = 'MOCK-VR-AGENT-99';
const MACHINE_NAME = 'TEST-VR-HEADSET';

console.log(`Connecting to Nexus Hub at ${SERVER_URL}...`);

const socket = io(SERVER_URL, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`Connected! Socket ID: ${socket.id}`);
  
  // 1. Emit the registration payload (Discovery)
  console.log(`Emitting 'register-device' for ${MACHINE_NAME}...`);
  socket.emit('register-device', {
    DeviceId: DEVICE_ID,
    MachineName: MACHINE_NAME,
    OS: 'Windows 11 VR Edition',
    IPAddress: '192.168.1.100',
    AgentVersion: '2.0.0'
  });

  // 2. Start sending heartbeats every 10 seconds
  setInterval(() => {
    socket.emit('heartbeat', { DeviceId: DEVICE_ID });
    console.log(`[${new Date().toLocaleTimeString()}] Sent heartbeat for ${DEVICE_ID}`);
  }, 10000);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Nexus Hub');
});

socket.on('launch-module', (payload) => {
  console.log('Received launch command from Hub:', payload);
});
