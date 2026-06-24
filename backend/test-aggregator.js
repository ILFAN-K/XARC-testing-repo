const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const devices = await prisma.device.findMany({
    orderBy: { discoveredAt: 'desc' },
    select: {
      deviceId: true,
      aggregatorInstalled: true,
      aggregatorVersion: true,
      aggregatorVerifiedAt: true,
      aggregatorLastSeen: true
    }
  });

  console.log("Raw Database Devices:");
  console.log(JSON.stringify(devices, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
