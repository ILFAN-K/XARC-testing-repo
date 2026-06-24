const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devices = await prisma.device.findMany();
  console.log("Current DB Devices:");
  devices.forEach(d => {
    console.log(`- ${d.deviceId}: isRegistered=${d.isRegistered}`);
  });
}

main().finally(() => prisma.$disconnect());
