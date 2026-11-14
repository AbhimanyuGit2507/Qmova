-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Service_tenantId_isArchived_idx" ON "Service"("tenantId", "isArchived");

-- Update any existing dummy 'Archived Services' rows to be flagged as archived
UPDATE "Service" SET "isArchived" = true WHERE name ILIKE '%Archived Services%';
