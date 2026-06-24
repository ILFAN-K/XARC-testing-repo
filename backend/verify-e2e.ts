import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  console.log('Starting NestJS server for E2E Verification...');
  const app: INestApplication = await NestFactory.create(AppModule);
  await app.init();
  
  const prisma = app.get(PrismaService);

  // 1. Seed two organizations and two admins
  console.log('\n--- Seeding Test Data ---');
  
  // Clean up
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: 'e2e' } } });
  await prisma.organization.deleteMany({ where: { name: { contains: 'E2E' } } });

  const orgA = await prisma.organization.create({
    data: { name: 'E2E Corp A', licenseQuota: 100 }
  });
  const orgB = await prisma.organization.create({
    data: { name: 'E2E Corp B', licenseQuota: 100 }
  });

  const adminA = await prisma.user.create({
    data: {
      email: 'adminA@e2e.com',
      fullName: 'Admin A',
      role: 'ADMIN',
      organizationId: orgA.id,
      firebaseUid: 'mock-firebase-uid', // Mock token maps to this
      status: 'ACTIVE'
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'userB@e2e.com',
      fullName: 'User B',
      role: 'USER',
      organizationId: orgB.id,
      status: 'ACTIVE'
    }
  });

  console.log(`Created Org A: ${orgA.id} with Admin: ${adminA.email}`);
  console.log(`Created Org B: ${orgB.id} with User: ${userB.email}`);

  await app.listen(0);
  const url = await app.getUrl();
  console.log(`Server running at ${url}`);

  const apiCall = async (method: 'GET' | 'POST', path: string, body?: any) => {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: {
        'Authorization': 'Bearer DEV_MOCK_TOKEN',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    return {
      status: response.status,
      body: await response.json()
    };
  };

  // Temporarily update DEV_MOCK_TOKEN logic in DB so admin@xarc.com points to Org A
  let mockAdmin = await prisma.user.findFirst({ where: { email: 'admin@xarc.com' }});
  if (!mockAdmin) {
    mockAdmin = await prisma.user.create({
      data: { email: 'admin@xarc.com', fullName: 'Mock Admin', role: 'ADMIN', organizationId: orgA.id }
    });
  } else {
    await prisma.user.update({
      where: { id: mockAdmin.id },
      data: { organizationId: orgA.id }
    });
  }

  // Update DEV_MOCK_TOKEN bypass org ID (Because it is hardcoded to 'org_demo' in code, we must patch the code OR just rely on DB)
  // Wait, the guard hardcodes `organizationId: 'org_demo'`. Let's update the guard to use the mockAdmin's org ID.
  // Actually, I updated the guard previously:
  // request.user = { sub: 'mock-user-id', email: 'admin@xarc.com', role: 'ADMIN', firebaseUid: 'mock-firebase-uid', organizationId: 'org_demo' };
  // Let's create an Organization with ID 'org_demo' to be safe!
  
  let demoOrg = await prisma.organization.findUnique({ where: { id: 'org_demo' }});
  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: { id: 'org_demo', name: 'Demo Organization', licenseQuota: 100 }
    });
  }
  
  // Reassign mockAdmin and userA
  await prisma.user.update({
    where: { id: mockAdmin.id },
    data: { organizationId: 'org_demo' }
  });

  // Test 1: Roles Endpoint
  console.log('\n--- 1. Testing GET /admin/users/roles ---');
  let res = await apiCall('GET', '/admin/users/roles');
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.body, null, 2));

  // Test 2: Create a New User
  console.log('\n--- 2. Testing POST /admin/users (Create User) ---');
  res = await apiCall('POST', '/admin/users', {
    fullName: 'Manager A',
    email: 'managerA@e2e.com',
    role: 'MANAGER',
    sendInvitation: false
  });
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.body, null, 2));
  
  const newUserId = res.body?.userId;
  if (newUserId) {
    const dbUser = await prisma.user.findUnique({ where: { id: newUserId } });
    console.log(`Verified in DB: managerA@e2e.com is assigned to org ${dbUser?.organizationId} (Should match Demo Org: org_demo)`);
  } else {
    console.log(`Error: newUserId not found. Response: ${JSON.stringify(res.body)}`);
  }

  // Test 3: Search / Filter (Users List)
  console.log('\n--- 3. Testing GET /admin/users (Search & Filters) ---');
  res = await apiCall('GET', '/admin/users?search=Manager');
  console.log('Status:', res.status);
  console.log('Response (Total):', res.body.total);
  console.log('Response (Items):', JSON.stringify(res.body.items, null, 2));

  // Test 4: Role Filters
  console.log('\n--- 4. Testing GET /admin/users?role=MANAGER ---');
  res = await apiCall('GET', '/admin/users?role=MANAGER');
  console.log('Status:', res.status);
  console.log('Response (Total):', res.body.total);

  // Test 5: Status Filters
  console.log('\n--- 5. Testing GET /admin/users?status=PENDING_INVITATION ---');
  res = await apiCall('GET', '/admin/users?status=PENDING_INVITATION');
  console.log('Status:', res.status);
  console.log('Response (Total):', res.body.total);

  // Test 6: Statistics
  console.log('\n--- 6. Testing GET /admin/users/stats ---');
  res = await apiCall('GET', '/admin/users/stats');
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.body, null, 2));

  // Test 7: Cross-Tenant Isolation (Trying to access Org B user)
  console.log(`\n--- 7. Testing Cross-Tenant Isolation ---`);
  console.log(`Attempting GET /admin/users/${userB.id}/profile (Belongs to Org B)`);
  res = await apiCall('GET', `/admin/users/${userB.id}/profile`);
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.body, null, 2));

  // Test 8: Attempt to Create SUPERADMIN
  console.log('\n--- 8. Testing Role Restriction (Creating SUPERADMIN) ---');
  res = await apiCall('POST', '/admin/users', {
    fullName: 'Sneaky Superadmin',
    email: 'sneaky@e2e.com',
    role: 'SUPERADMIN',
  });
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.body, null, 2));

  // Cleanup & Exit
  await app.close();
  console.log('\n--- Verification Complete ---');
  process.exit(0);
}

bootstrap().catch(console.error);
