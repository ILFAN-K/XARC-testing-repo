import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateOrgId, generateUserId, extractOrgCode } from '../src/common/utils/id-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Organization
  const orgName = 'XARC HQ';
  const orgId = await generateOrgId(orgName, prisma);
  const orgCode = extractOrgCode(orgName);

  const org = await prisma.organization.create({
    data: {
      orgId: orgId,
      name: orgName,
      licenseQuota: 150,
    },
  });

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const customUserId = await generateUserId(orgCode, 'SUPERADMIN', prisma);

  const adminUser = await prisma.user.create({
    data: {
      customUserId: customUserId,
      email: 'admin@xarc.io',
      fullName: 'System Admin',
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      organizationId: org.orgId,
    },
  });
  console.log(`Created admin user: admin@xarc.io / admin123 (ID: ${customUserId})`);

  // Create Devices
  const d1 = await prisma.device.create({
    data: {
      deviceId: 'dev-1',
      machineName: 'XARC-SERVER-01',
      friendlyName: 'Main Controller',
      status: 'ONLINE',
      healthScore: 98,
      organizationId: org.orgId,
    },
  });

  const d2 = await prisma.device.create({
    data: {
      deviceId: 'dev-2',
      machineName: 'XARC-NODE-02',
      friendlyName: 'Access Terminal',
      status: 'OFFLINE',
      healthScore: 45,
      isCritical: true,
      organizationId: org.orgId,
    },
  });

  // Create Modules (Master Data)
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        moduleId: 'MOD-001',
        name: 'Fire Safety VR',
        description: 'Comprehensive fire safety and extinguisher training.',
        iconKey: 'flame',
        category: 'Safety',
        version: '1.2.0',
        licenseType: 'Perpetual',
        purchasedLicenses: 5,
        status: 'ACTIVE',
        organizationId: org.orgId,
      },
    }),
    prisma.module.create({
      data: {
        moduleId: 'MOD-002',
        name: 'Electrical Safety',
        description: 'High voltage electrical hazard awareness.',
        iconKey: 'zap',
        category: 'Safety',
        version: '1.0.5',
        licenseType: 'Subscription',
        purchasedLicenses: 10,
        status: 'ACTIVE',
        organizationId: org.orgId,
      },
    }),
    prisma.module.create({
      data: {
        moduleId: 'MOD-003',
        name: 'Forklift Safety',
        description: 'Forklift operation and certification simulator.',
        iconKey: 'forklift',
        category: 'Operations',
        version: '2.1.0',
        licenseType: 'Perpetual',
        purchasedLicenses: 2,
        status: 'ACTIVE',
        organizationId: org.orgId,
      },
    }),
    prisma.module.create({
      data: {
        moduleId: 'MOD-004',
        name: 'VR Museum',
        description: 'Interactive exhibition space for historical artifacts.',
        iconKey: 'box',
        category: 'Education',
        version: '1.0.0',
        licenseType: 'Subscription',
        purchasedLicenses: 2,
        status: 'ACTIVE',
        organizationId: org.orgId,
      },
    }),
    prisma.module.create({
      data: {
        moduleId: 'MOD-005',
        name: 'Confined Space Training',
        description: 'Hazard identification and safety protocols for confined spaces.',
        iconKey: 'shield',
        category: 'Safety',
        version: '1.3.2',
        licenseType: 'Perpetual',
        purchasedLicenses: 8,
        status: 'ACTIVE',
        organizationId: org.orgId,
      },
    }),
  ]);

  // Create Module Assignments
  await prisma.moduleSystemAssignment.create({
    data: {
      moduleId: modules[0].id,
      deviceId: d1.id,
      assignedBy: 'system-seed',
      organizationId: org.orgId,
    }
  });

  // Create Licenses
  await prisma.systemLicense.create({
    data: {
      deviceId: d1.id,
      moduleName: 'Fire Safety VR',
      status: 'Active',
      expiresAt: new Date(Date.now() + 10000000000),
    },
  });

  await prisma.systemLicense.create({
    data: {
      deviceId: d2.id,
      moduleName: 'Access Control',
      status: 'Expired',
      expiresAt: new Date(Date.now() - 10000000000),
    },
  });

  // Create Usage Metrics (last 7 days)
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    
    await prisma.usageMetric.create({
      data: {
        deviceId: d1.id,
        moduleName: 'Orchestrator Core',
        usageHours: Math.floor(Math.random() * 10) + 10,
        efficiency: Math.floor(Math.random() * 20) + 80,
        metricDate: d,
      },
    });
  }

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
