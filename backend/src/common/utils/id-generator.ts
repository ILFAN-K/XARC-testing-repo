import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generate organization ID in format: ORG-{FIRST3}-{SEQ}
 * Example: ORG-ABC-001
 */
export async function generateOrgId(orgName: string, prisma: any): Promise<string> {
  const prefix = orgName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
  const pattern = `ORG-${prefix}-%`;
  
  const existing = await prisma.$queryRaw`
    SELECT "orgId" FROM "Organization" 
    WHERE "orgId" LIKE ${pattern}
    ORDER BY "orgId" DESC
    LIMIT 1
  `;
  
  let seq = 1;
  if (existing && (existing as any[]).length > 0) {
    const lastId = (existing as any[])[0].orgId as string;
    const lastSeq = parseInt(lastId.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }
  
  return `ORG-${prefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * Generate user ID in format: {ORGCODE}-{ROLE}-{SEQ}
 * Example: ABC-ADMIN-0001
 */
export async function generateUserId(orgCode: string, role: string, prisma: any): Promise<string> {
  const prefix = `${orgCode}-${role}-`;
  const pattern = `${prefix}%`;
  
  const existing = await prisma.$queryRaw`
    SELECT "customUserId" FROM "User" 
    WHERE "customUserId" LIKE ${pattern}
    ORDER BY "customUserId" DESC
    LIMIT 1
  `;
  
  let seq = 1;
  if (existing && (existing as any[]).length > 0) {
    const lastId = (existing as any[])[0].customUserId as string;
    const lastSeq = parseInt(lastId.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }
  
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Extract 3-letter org code from organization name
 */
export function extractOrgCode(orgName: string): string {
  return orgName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
}
