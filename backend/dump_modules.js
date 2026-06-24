const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const m = await prisma.module.findMany({ include: { assignments: true } });
  console.log(JSON.stringify(m, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
