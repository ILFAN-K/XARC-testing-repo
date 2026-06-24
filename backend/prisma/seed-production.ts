import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning database...');

  // Delete in dependency order
  await prisma.deviceCommand.deleteMany({});
  await prisma.usageMetric.deleteMany({});
  await prisma.systemLicense.deleteMany({});
  await prisma.launchLog.deleteMany({});
  await prisma.dashboardSnapshot.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('✅ Database cleaned');

  // Create Organizations
  const orgABC = await prisma.organization.create({
    data: {
      orgId: 'ORG-ABC-001',
      name: 'ABC Organization',
      licenseQuota: 100,
    },
  });

  const orgXYZ = await prisma.organization.create({
    data: {
      orgId: 'ORG-XYZ-001',
      name: 'XYZ Organization',
      licenseQuota: 100,
    },
  });

  console.log(`✅ Organizations: ${orgABC.orgId}, ${orgXYZ.orgId}`);

  // Create Users (without Firebase - they'll sync on first login)
  const users = [
    { customUserId: 'ABC-ADMIN-0001', email: 'admin@abc.xarc.com', fullName: 'ABC Admin', role: 'ADMIN', orgId: orgABC.orgId },
    { customUserId: 'ABC-INSTRUCTOR-0001', email: 'instructor@abc.xarc.com', fullName: 'ABC Instructor', role: 'INSTRUCTOR', orgId: orgABC.orgId },
    { customUserId: 'ABC-TRAINEE-0001', email: 'trainee1@abc.xarc.com', fullName: 'ABC Trainee 1', role: 'TRAINEE', orgId: orgABC.orgId },
    { customUserId: 'ABC-TRAINEE-0002', email: 'trainee2@abc.xarc.com', fullName: 'ABC Trainee 2', role: 'TRAINEE', orgId: orgABC.orgId },
    { customUserId: 'XYZ-ADMIN-0001', email: 'admin@xyz.xarc.com', fullName: 'XYZ Admin', role: 'ADMIN', orgId: orgXYZ.orgId },
    { customUserId: 'XYZ-INSTRUCTOR-0001', email: 'instructor@xyz.xarc.com', fullName: 'XYZ Instructor', role: 'INSTRUCTOR', orgId: orgXYZ.orgId },
    { customUserId: 'XYZ-TRAINEE-0001', email: 'trainee1@xyz.xarc.com', fullName: 'XYZ Trainee 1', role: 'TRAINEE', orgId: orgXYZ.orgId },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        customUserId: u.customUserId,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        status: 'ACTIVE',
        organizationId: u.orgId,
      },
    });
  }
  console.log(`✅ ${users.length} users created`);

  // Create Modules (global)
  const modules = await Promise.all([
    prisma.module.create({ data: { name: 'Fire Safety VR', description: 'Comprehensive fire safety and extinguisher training.', category: 'Safety', version: '1.2.0' } }),
    prisma.module.create({ data: { name: 'Electrical Safety', description: 'High voltage electrical hazard awareness.', category: 'Safety', version: '1.0.5' } }),
    prisma.module.create({ data: { name: 'Forklift Simulator', description: 'Forklift operation and certification simulator.', category: 'Operations', version: '2.1.0' } }),
    prisma.module.create({ data: { name: 'Maintenance Guide', description: 'AR overlays for standard machine maintenance.', category: 'Maintenance', version: '1.5.0' } }),
  ]);
  console.log(`✅ ${modules.length} modules created`);

  // Create Devices for ABC
  const abcDevices = [
    { deviceId: 'abc-dev-001', machineName: 'ABC-SERVER-01', friendlyName: 'ABC Main Controller', orgId: orgABC.orgId },
    { deviceId: 'abc-dev-002', machineName: 'ABC-NODE-02', friendlyName: 'ABC Training Station', orgId: orgABC.orgId },
    { deviceId: 'abc-dev-003', machineName: 'ABC-NODE-03', friendlyName: 'ABC Safety Lab', orgId: orgABC.orgId },
  ];

  // Create Devices for XYZ
  const xyzDevices = [
    { deviceId: 'xyz-dev-001', machineName: 'XYZ-SERVER-01', friendlyName: 'XYZ Main Controller', orgId: orgXYZ.orgId },
    { deviceId: 'xyz-dev-002', machineName: 'XYZ-NODE-02', friendlyName: 'XYZ Sim Room', orgId: orgXYZ.orgId },
  ];

  const allDeviceRecords = [];
  for (const d of [...abcDevices, ...xyzDevices]) {
    const device = await prisma.device.create({
      data: {
        deviceId: d.deviceId,
        machineName: d.machineName,
        friendlyName: d.friendlyName,
        status: 'OFFLINE',
        isRegistered: true,
        registeredAt: new Date(),
        organizationId: d.orgId,
        healthScore: 80 + Math.floor(Math.random() * 20),
      },
    });
    allDeviceRecords.push(device);
  }
  console.log(`✅ ${allDeviceRecords.length} devices created`);

  // Create Licenses
  const abcDbDevices = allDeviceRecords.filter(d => d.deviceId.startsWith('abc-'));
  const xyzDbDevices = allDeviceRecords.filter(d => d.deviceId.startsWith('xyz-'));

  for (const device of abcDbDevices) {
    await prisma.systemLicense.create({
      data: {
        deviceId: device.id,
        moduleName: 'Fire Safety VR',
        status: 'Active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }
  for (const device of xyzDbDevices) {
    await prisma.systemLicense.create({
      data: {
        deviceId: device.id,
        moduleName: 'Forklift Simulator',
        status: 'Active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ Licenses created');

  // Create Usage Metrics (last 14 days)
  for (const device of allDeviceRecords) {
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      await prisma.usageMetric.create({
        data: {
          deviceId: device.id,
          moduleName: device.deviceId.startsWith('abc-') ? 'Fire Safety VR' : 'Forklift Simulator',
          usageHours: Math.floor(Math.random() * 8) + 2,
          efficiency: Math.floor(Math.random() * 25) + 70,
          cpuUsage: Math.random() * 40 + 20,
          memoryUsage: Math.random() * 30 + 40,
          diskUsage: Math.random() * 20 + 30,
          metricDate: d,
        },
      });
    }
  }
  console.log('✅ Usage metrics created');

  // Create Launch Logs
  for (const device of allDeviceRecords) {
    const orgId = device.organizationId;
    for (let i = 0; i < 5; i++) {
      await prisma.launchLog.create({
        data: {
          deviceId: device.deviceId,
          module: device.deviceId.startsWith('abc-') ? 'Fire Safety VR' : 'Forklift Simulator',
          status: 'SUCCESS',
          organizationId: orgId,
        },
      });
    }
  }
  console.log('✅ Launch logs created');

  console.log('\n🎉 Production seed complete!');
  console.log('\nTest Accounts (create in Firebase or use AUTH_BYPASS=true):');
  for (const u of users) {
    console.log(`  ${u.customUserId} | ${u.email} | ${u.role}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
