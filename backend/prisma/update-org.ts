import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.organization.update({ where: { id: 'org_demo' }, data: { name: 'XR Demo' } });
  console.log('Updated Org Name');
}

main().catch(console.error).finally(() => prisma.$disconnect());
