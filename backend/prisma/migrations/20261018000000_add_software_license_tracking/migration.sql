ALTER TABLE "User"
ADD COLUMN "microsoft365LicenseAssigned" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Asset"
ADD COLUMN "windowsEdition" TEXT,
ADD COLUMN "windowsLicenseAssigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "antivirusProduct" TEXT;

UPDATE "Asset"
SET
  "windowsEdition" = 'Windows 11 Pro',
  "windowsLicenseAssigned" = true
WHERE "deletedAt" IS NULL
  AND "operatingSystem" ILIKE '%Windows 11 Pro%';
