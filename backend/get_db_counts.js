const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const devices = await prisma.device.count();
  const licenses = await prisma.systemLicense.count();
  const launchLogs = await prisma.launchLog.count();
  const usageMetrics = await prisma.usageMetric.count();

  console.log(`Device count: ${devices}`);
  console.log(`SystemLicense count: ${licenses}`);
  console.log(`LaunchLog count: ${launchLogs}`);
  console.log(`UsageMetric count: ${usageMetrics}`);
}

main().finally(() => prisma.$disconnect());
