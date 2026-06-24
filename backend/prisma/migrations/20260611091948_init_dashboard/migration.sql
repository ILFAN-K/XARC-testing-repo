-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "healthScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "licenseQuota" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SystemLicense" (
    "id" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMetric" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "moduleName" TEXT,
    "usageHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpuUsage" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "efficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "totalUsageHours" DOUBLE PRECISION NOT NULL,
    "efficiencyScore" DOUBLE PRECISION NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemLicense_deviceId_moduleName_key" ON "SystemLicense"("deviceId", "moduleName");

-- CreateIndex
CREATE INDEX "UsageMetric_deviceId_idx" ON "UsageMetric"("deviceId");

-- CreateIndex
CREATE INDEX "UsageMetric_metricDate_idx" ON "UsageMetric"("metricDate");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_snapshotDate_idx" ON "DashboardSnapshot"("snapshotDate");

-- AddForeignKey
ALTER TABLE "SystemLicense" ADD CONSTRAINT "SystemLicense_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMetric" ADD CONSTRAINT "UsageMetric_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
