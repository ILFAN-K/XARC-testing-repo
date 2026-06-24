const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fetch = require('node-fetch');
const { io } = require("socket.io-client");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Initialize Firebase Client (Frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCxKKCmPIaEexHCHCV9DEVdVksLSauqx5U",
  authDomain: "xarc-adfdd.firebaseapp.com",
  projectId: "xarc-adfdd"
};
const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);

async function fetchApi(path, token, method='GET', body=null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  
  const res = await fetch(`http://localhost:3001${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; } 
  catch(e) { return { status: res.status, data: text }; }
}

async function run() {
  console.log("=== XR LAUNCH WORKFLOW END-TO-END TEST ===");
  const password = "SecurePassword123!";
  const abcCred = await signInWithEmailAndPassword(clientAuth, 'admin@abc.xarc.com', password);
  const token = await abcCred.user.getIdToken();
  const userId = "abc-admin-postgesql-id"; // We will look this up
  
  const pgUser = await prisma.user.findFirst({ where: { email: 'admin@abc.xarc.com' } });

  // 1. Setup a Test Module and License
  const module = await prisma.module.findFirst();
  if (!module) {
    throw new Error("No modules found in DB to test!");
  }

  // 2. Connect Fake Windows Agent
  const socket = io("ws://localhost:3001", {
    auth: { agentKey: "xarc-production-agent-secret-key-12345" },
    reconnection: false
  });

  socket.on("connect", () => {
    console.log("✅ Windows Agent connected successfully via WebSocket");
    socket.emit("register-device", {
      DeviceId: "test-xr-device-001",
      MachineName: "XR-SIM-01",
      OS: "Windows 11",
      IPAddress: "192.168.1.100",
      AgentVersion: "2.0.0"
    });
  });

  await new Promise(r => setTimeout(r, 2000)); // wait for registration

  // 3. License the device
  const device = await prisma.device.findUnique({ where: { deviceId: 'test-xr-device-001' } });
  if (!device) throw new Error("Device didn't register!");

  // **NEW STEP**: The device starts as "Discovered" (isRegistered=false).
  // We must hit the register API to accept it.
  console.log("✅ Registering device via API...");
  await fetchApi('/devices/register', token, 'POST', {
    deviceId: device.deviceId,
    friendlyName: "XR Test Simulator Lab 1"
  });

  // Manually ensure it has an Active license
  await prisma.systemLicense.upsert({
    where: { 
      deviceId_moduleName: { deviceId: device.id, moduleName: module.name }
    },
    update: { status: 'Active' },
    create: {
      deviceId: device.id,
      moduleName: module.name,
      status: 'Active',
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  // 5. Windows Agent listens for command (MUST DO THIS BEFORE API CALL)
  socket.on("launch-module", (payload) => {
    console.log(`✅ Windows Agent received command! Payload:`, payload);

    // 6. Windows Agent acknowledges launch success
    console.log("✅ Windows Agent acknowledging launch success...");
    socket.emit("command-status", {
      CommandId: payload.commandId,
      Status: "COMPLETED",
      Message: "XR App started successfully"
    });
  });

  // 4. Launch Request from Frontend API
  console.log("✅ Dispatching Launch Request to Backend...");
  const launchRes = await fetchApi('/devices/launch', token, 'POST', {
    deviceId: "test-xr-device-001",
    moduleId: module.id,
    userId: pgUser.id
  });

  if (launchRes.status !== 201) {
    console.error("Launch failed:", launchRes);
    process.exit(1);
  }
  
  console.log(`✅ Backend successfully queued launch command`);

  await new Promise(r => setTimeout(r, 2000)); // wait for status process

  // 7. Verify Database state
  const cmd = await prisma.deviceCommand.findFirst({
    where: { deviceId: device.id, type: 'LAUNCH_MODULE' },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`✅ Final Command Status in PostgreSQL: ${cmd.status}`);

  if (cmd.status === "COMPLETED") {
    console.log("\n🚀 END-TO-END WORKFLOW SUCCESSFUL!");
  } else {
    console.error("\n❌ END-TO-END WORKFLOW FAILED!", cmd);
  }
  
  process.exit(0);
}

run().catch(console.error);
