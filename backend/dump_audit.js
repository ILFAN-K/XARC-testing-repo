const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const auditLogs = await prisma.auditLog.findMany();
  console.log("Audit Logs:", JSON.stringify(auditLogs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
