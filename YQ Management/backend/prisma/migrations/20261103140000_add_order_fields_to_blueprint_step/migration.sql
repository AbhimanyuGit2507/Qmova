-- BlueprintStep table: Add ordering configuration columns
ALTER TABLE "BlueprintStep" ADD COLUMN IF NOT EXISTS "orderItems" JSONB;
ALTER TABLE "BlueprintStep" ADD COLUMN IF NOT EXISTS "orderMultiSelect" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BlueprintStep" ADD COLUMN IF NOT EXISTS "orderShowPrices" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BlueprintStep" ADD COLUMN IF NOT EXISTS "orderCatalogId" TEXT;

