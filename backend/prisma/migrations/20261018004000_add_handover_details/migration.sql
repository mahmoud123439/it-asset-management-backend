ALTER TABLE "User"
ADD COLUMN "employeeName" TEXT,
ADD COLUMN "jobTitle" TEXT;

ALTER TABLE "AssetAssignment"
ADD COLUMN "issuedByUserId" INTEGER;

CREATE INDEX "AssetAssignment_issuedByUserId_idx"
ON "AssetAssignment"("issuedByUserId");

ALTER TABLE "AssetAssignment"
ADD CONSTRAINT "AssetAssignment_issuedByUserId_fkey"
FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
