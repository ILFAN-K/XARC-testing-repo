const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const device = await prisma.device.findUnique({ where: { deviceId: 'DEV-427195DA' } });
  console.log("DB RECORD:", JSON.stringify(device, null, 2));
}

main().finally(() => prisma.$disconnect());
