const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const commands = await prisma.deviceCommand.findMany({
    where: { type: 'INSTALL_AGGREGATOR' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log("Latest INSTALL_AGGREGATOR Commands:");
  console.log(JSON.stringify(commands, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
