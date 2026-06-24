-- CreateTable
CREATE TABLE "LaunchLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "launchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaunchLog_pkey" PRIMARY KEY ("id")
);
