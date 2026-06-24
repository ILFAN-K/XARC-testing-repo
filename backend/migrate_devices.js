const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting device migration...');
  
  // 1. Fetch all devices that are currently unregistered
  const unregisteredDevices = await prisma.device.findMany({
    where: { isRegistered: false }
  });

  console.log(`Found ${unregisteredDevices.length} unregistered devices to migrate.`);

  // 2. Fetch default organization if we need to fix any null organizationIds (though schema requires it, just in case)
  const defaultOrg = await prisma.organization.findFirst({
    orderBy: { name: 'asc' }
  });

  if (!defaultOrg) {
    throw new Error('No organization found in database to map to.');
  }

  // 3. Update each device safely
  for (const device of unregisteredDevices) {
    console.log(`Migrating device: ${device.deviceId}...`);
    
    await prisma.device.update({
      where: { id: device.id },
      data: {
        isRegistered: true,
        // If friendlyName doesn't exist, fallback to machineName
        friendlyName: device.friendlyName || device.machineName,
        // Set registeredAt if null
        registeredAt: device.registeredAt || new Date(),
        // Ensure organizationId is mapped correctly (schema strictly enforces it, but satisfying requirements)
        organizationId: device.organizationId || defaultOrg.orgId
      }
    });
    
    console.log(`  -> Device ${device.deviceId} mapped successfully (Friendly Name: ${device.friendlyName || device.machineName}).`);
  }

  console.log('Migration complete! All devices are now safely registered.');
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
