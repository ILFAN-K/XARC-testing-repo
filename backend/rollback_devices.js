const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting device rollback to Option B (Discovery Queue)...');
  
  // Revert dev-1
  await prisma.device.update({
    where: { deviceId: 'dev-1' },
    data: {
      isRegistered: false,
      friendlyName: null,
      registeredAt: null
    }
  });
  console.log('Reverted dev-1');

  // Revert dev-2
  await prisma.device.update({
    where: { deviceId: 'dev-2' },
    data: {
      isRegistered: false,
      friendlyName: null,
      registeredAt: null
    }
  });
  console.log('Reverted dev-2');

  // Revert DEV-427195DA
  await prisma.device.update({
    where: { deviceId: 'DEV-427195DA' },
    data: {
      isRegistered: false,
      friendlyName: null,
      registeredAt: null
    }
  });
  console.log('Reverted DEV-427195DA');

  console.log('Rollback complete! All 3 devices are back in the Discovery queue.');
}

main()
  .catch(e => {
    console.error('Rollback failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
