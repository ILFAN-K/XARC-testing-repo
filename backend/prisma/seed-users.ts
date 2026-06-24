import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up obsolete users...');

  // Delete all users to start fresh, but do not delete all Organizations to avoid FK constraint errors with Devices
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Get or Create Organization
  let org = await prisma.organization.findUnique({ where: { id: 'org_demo' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: 'org_demo',
        name: 'XR Demo',
        licenseQuota: 500,
      },
    });
    console.log('Created Organization:', org.name);
  } else {
    console.log('Using existing Organization:', org.name);
  }

  // 2. Create Users
  await prisma.user.create({
    data: {
      email: 'admin@xarc.com',
      fullName: 'XR Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      organizationId: org.id,
      firebaseUid: 'mock-firebase-uid-admin',
    },
  });
  console.log('Created Admin: admin@xarc.com');

  await prisma.user.create({
    data: {
      email: 'manager@xarc.com',
      fullName: 'XR Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
      organizationId: org.id,
    },
  });
  console.log('Created Manager: manager@xarc.com');

  await prisma.user.create({
    data: {
      email: 'user1@xarc.com',
      fullName: 'Test User 1',
      role: 'USER',
      status: 'ACTIVE',
      organizationId: org.id,
    },
  });
  console.log('Created User: user1@xarc.com');

  await prisma.user.create({
    data: {
      email: 'user2@xarc.com',
      fullName: 'Test User 2',
      role: 'USER',
      status: 'PENDING_INVITATION',
      organizationId: org.id,
    },
  });
  console.log('Created User: user2@xarc.com');

  console.log('Database cleaned and seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
