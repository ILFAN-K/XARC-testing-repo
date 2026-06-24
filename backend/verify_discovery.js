const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

async function main() {
  console.log("=== 1. VERIFYING DEVICE STATE ===");
  const devices = await prisma.device.findMany({
    where: {
      deviceId: { in: ['dev-1', 'dev-2', 'DEV-427195DA'] }
    }
  });

  devices.forEach(d => {
    console.log(`Device: ${d.deviceId}`);
    console.log(`  - isRegistered: ${d.isRegistered}`);
    console.log(`  - status: ${d.status}`);
    console.log(`  - lastSeen: ${d.lastSeen}`);
    console.log(`  - organizationId: ${d.organizationId}`);
  });

  console.log("\n=== 2. VERIFYING RAW DB DISCOVERY QUERY ===");
  const rawDbCount = await prisma.device.count({
    where: { isRegistered: false, isDisabled: false, status: 'ONLINE' }
  });
  console.log(`Raw Discovered devices from DB (isRegistered=false, status=ONLINE): ${rawDbCount}`);

  console.log("\n=== 3. VERIFYING FINAL FILTERED RESULT VIA API ===");
  
  return new Promise((resolve) => {
    http.get('http://localhost:3001/devices/discovered', (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', async () => {
        const discovered = JSON.parse(data);
        console.log(`Final filtered result count (API): ${discovered.length}`);
        resolve();
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
      resolve();
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
