const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.module.createMany({
    data: [
      {
        name: 'Fire Safety VR',
        description: 'Comprehensive fire safety and extinguisher training.',
        category: 'Safety',
        version: '1.2.0',
      },
      {
        name: 'Electrical Safety',
        description: 'High voltage electrical hazard awareness.',
        category: 'Safety',
        version: '1.0.5',
      },
      {
        name: 'Forklift Simulator',
        description: 'Forklift operation and certification simulator.',
        category: 'Operations',
        version: '2.1.0',
      },
      {
        name: 'Maintenance Guide',
        description: 'AR overlays for standard machine maintenance.',
        category: 'Maintenance',
        version: '1.5.0',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Modules seeded!');
}

main().finally(() => prisma.$disconnect());
