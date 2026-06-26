import { PrismaClient } from '@prisma/client';

/**
 * Generate organization ID in format: ORG-{FIRST3}-{SEQ}
 * Example: ORG-ABC-001
 * 
 * Uses a transaction to prevent race conditions where concurrent
 * requests could generate the same ID.
 */
export async function generateOrgId(orgName: string, prisma: PrismaClient): Promise<string> {
  const cleanName = orgName.replace(/[^A-Za-z]/g, '');
  const prefix = (cleanName.length >= 3 ? cleanName.substring(0, 3) : cleanName.padEnd(3, 'X')).toUpperCase();
  const pattern = `ORG-${prefix}-%`;
  
  return prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw`
      SELECT "orgId" FROM "Organization" 
      WHERE "orgId" LIKE ${pattern}
      ORDER BY "orgId" DESC
      LIMIT 1
      FOR UPDATE
    `;
    
    let seq = 1;
    if (existing && (existing as any[]).length > 0) {
      const lastId = (existing as any[])[0].orgId as string;
      const lastSeq = parseInt(lastId.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    
    return `ORG-${prefix}-${String(seq).padStart(3, '0')}`;
  });
}

/**
 * Generate user ID in format: {ORGCODE}-{ROLE}-{SEQ}
 * Example: ABC-ADMIN-0001
 * 
 * Uses a transaction to prevent race conditions where concurrent
 * requests could generate the same ID.
 */
export async function generateUserId(orgCode: string, role: string, prisma: PrismaClient): Promise<string> {
  const prefix = `${orgCode}-${role}-`;
  const pattern = `${prefix}%`;
  
  return prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw`
      SELECT "customUserId" FROM "User" 
      WHERE "customUserId" LIKE ${pattern}
      ORDER BY "customUserId" DESC
      LIMIT 1
      FOR UPDATE
    `;
    
    let seq = 1;
    if (existing && (existing as any[]).length > 0) {
      const lastId = (existing as any[])[0].customUserId as string;
      const lastSeq = parseInt(lastId.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    
    return `${prefix}${String(seq).padStart(4, '0')}`;
  });
}

/**
 * Extract 3-letter org code from organization name.
 * Falls back to 'XXX' if org name has fewer than 3 alpha characters.
 */
export function extractOrgCode(orgName: string): string {
  const cleanName = orgName.replace(/[^A-Za-z]/g, '');
  if (cleanName.length < 3) {
    return (cleanName + 'XXX').substring(0, 3).toUpperCase();
  }
  return cleanName.substring(0, 3).toUpperCase();
}
