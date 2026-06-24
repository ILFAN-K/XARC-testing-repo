"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrgId = generateOrgId;
exports.generateUserId = generateUserId;
exports.extractOrgCode = extractOrgCode;
/**
 * Generate organization ID in format: ORG-{FIRST3}-{SEQ}
 * Example: ORG-ABC-001
 */
async function generateOrgId(orgName, prisma) {
    const prefix = orgName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const pattern = `ORG-${prefix}-%`;
    const existing = await prisma.$queryRaw `
    SELECT "orgId" FROM "Organization" 
    WHERE "orgId" LIKE ${pattern}
    ORDER BY "orgId" DESC
    LIMIT 1
  `;
    let seq = 1;
    if (existing && existing.length > 0) {
        const lastId = existing[0].orgId;
        const lastSeq = parseInt(lastId.split('-').pop() || '0', 10);
        seq = lastSeq + 1;
    }
    return `ORG-${prefix}-${String(seq).padStart(3, '0')}`;
}
/**
 * Generate user ID in format: {ORGCODE}-{ROLE}-{SEQ}
 * Example: ABC-ADMIN-0001
 */
async function generateUserId(orgCode, role, prisma) {
    const prefix = `${orgCode}-${role}-`;
    const pattern = `${prefix}%`;
    const existing = await prisma.$queryRaw `
    SELECT "customUserId" FROM "User" 
    WHERE "customUserId" LIKE ${pattern}
    ORDER BY "customUserId" DESC
    LIMIT 1
  `;
    let seq = 1;
    if (existing && existing.length > 0) {
        const lastId = existing[0].customUserId;
        const lastSeq = parseInt(lastId.split('-').pop() || '0', 10);
        seq = lastSeq + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
}
/**
 * Extract 3-letter org code from organization name
 */
function extractOrgCode(orgName) {
    return orgName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
}
//# sourceMappingURL=id-generator.js.map