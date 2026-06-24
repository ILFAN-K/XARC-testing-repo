import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-project',
  });
}

const prisma = new PrismaClient();

async function getOrCreateFirebaseUser(email: string) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    // Update password so we know what it is
    await admin.auth().updateUser(userRecord.uid, { password: 'Password123!' });
    return userRecord.uid;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const userRecord = await admin.auth().createUser({
        email,
        password: 'Password123!',
        emailVerified: true,
      });
      return userRecord.uid;
    }
    throw error;
  }
}

async function main() {
  console.log('Seeding Multi-Tenant Environment...');

  // 1. Delete existing data
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  
  // We won't delete all organizations to avoid breaking devices, just create or update ours
  let orgA = await prisma.organization.findFirst({ where: { name: 'ABC Manufacturing' } });
  if (!orgA) {
    orgA = await prisma.organization.create({ data: { name: 'ABC Manufacturing', licenseQuota: 100 } });
  }

  let orgB = await prisma.organization.findFirst({ where: { name: 'XYZ Industries' } });
  if (!orgB) {
    orgB = await prisma.organization.create({ data: { name: 'XYZ Industries', licenseQuota: 100 } });
  }

  console.log(`Created Orgs: [${orgA.id}] ABC, [${orgB.id}] XYZ`);

  // Define users
  const usersToCreate = [
    { email: 'admin.abc@xarc.com', role: 'ADMIN', orgId: orgA.id, name: 'Admin ABC' },
    { email: 'manager.abc@xarc.com', role: 'MANAGER', orgId: orgA.id, name: 'Manager ABC' },
    { email: 'user1.abc@xarc.com', role: 'USER', orgId: orgA.id, name: 'User 1 ABC' },
    { email: 'user2.abc@xarc.com', role: 'USER', orgId: orgA.id, name: 'User 2 ABC' },
    { email: 'admin.xyz@xarc.com', role: 'ADMIN', orgId: orgB.id, name: 'Admin XYZ' },
    { email: 'manager.xyz@xarc.com', role: 'MANAGER', orgId: orgB.id, name: 'Manager XYZ' },
    { email: 'user1.xyz@xarc.com', role: 'USER', orgId: orgB.id, name: 'User 1 XYZ' },
    { email: 'user2.xyz@xarc.com', role: 'USER', orgId: orgB.id, name: 'User 2 XYZ' },
  ];

  for (const u of usersToCreate) {
    // 1. Firebase Auth
    let firebaseUid = null;
    try {
      firebaseUid = await getOrCreateFirebaseUser(u.email);
      console.log(`Firebase setup for ${u.email} -> ${firebaseUid}`);
    } catch (err: any) {
      console.log(`Could not setup Firebase for ${u.email}: ${err.message}. Creating purely in DB.`);
      firebaseUid = `mock-${u.email}`; // Fallback if firebase admin is not fully configured
    }

    // 2. PostgreSQL
    await prisma.user.create({
      data: {
        email: u.email,
        fullName: u.name,
        role: u.role,
        status: 'ACTIVE',
        organizationId: u.orgId,
        firebaseUid,
      },
    });
    console.log(`DB setup for ${u.email}`);
  }

  console.log('Multi-Tenant Seed Complete.');
  console.log('Password for all users is: Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
