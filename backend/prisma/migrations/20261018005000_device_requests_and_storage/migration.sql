CREATE TYPE "DeviceRequestType" AS ENUM ('REPLACE_DEVICE', 'UPGRADE_HARDWARE', 'OTHER');
CREATE TYPE "DeviceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

ALTER TABLE "Asset"
ADD COLUMN "storageGb" INTEGER,
ADD COLUMN "storageType" TEXT;

CREATE TABLE "DeviceChangeRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assetId" INTEGER,
    "type" "DeviceRequestType" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "DeviceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNote" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeviceChangeRequest_userId_createdAt_idx" ON "DeviceChangeRequest"("userId", "createdAt");
CREATE INDEX "DeviceChangeRequest_status_createdAt_idx" ON "DeviceChangeRequest"("status", "createdAt");

ALTER TABLE "DeviceChangeRequest"
ADD CONSTRAINT "DeviceChangeRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeviceChangeRequest"
ADD CONSTRAINT "DeviceChangeRequest_assetId_fkey"
FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceChangeRequest"
ADD CONSTRAINT "DeviceChangeRequest_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
