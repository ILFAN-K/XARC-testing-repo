const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const user = await p.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, isDeleted: false, status: 'ACTIVE' },
  });
  console.log('User:', user?.email, 'organizationId:', user?.organizationId);
  
  if (user?.organizationId) {
    const org = await p.organization.findUnique({ where: { id: user.organizationId } });
    console.log('Org by id:', org);
  }
  
  const allOrgs = await p.organization.findMany({ select: { id: true, orgId: true, name: true } });
  console.log('All orgs:', JSON.stringify(allOrgs, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());
