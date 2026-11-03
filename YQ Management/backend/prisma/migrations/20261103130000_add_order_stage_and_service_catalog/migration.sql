-- StepType enum
ALTER TYPE "StepType" ADD VALUE IF NOT EXISTS 'ORDER';

-- StepEventType enum
ALTER TYPE "StepEventType" ADD VALUE IF NOT EXISTS 'ORDER_SUBMITTED';

-- Service table
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "enableCatalog" BOOLEAN NOT NULL DEFAULT false;

-- FlowStepTemplate table
ALTER TABLE "FlowStepTemplate" ADD COLUMN IF NOT EXISTS "orderItems" JSONB;
ALTER TABLE "FlowStepTemplate" ADD COLUMN IF NOT EXISTS "orderMultiSelect" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FlowStepTemplate" ADD COLUMN IF NOT EXISTS "orderShowPrices" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FlowStepTemplate" ADD COLUMN IF NOT EXISTS "orderCatalogId" TEXT;

-- VisitStep table
ALTER TABLE "VisitStep" ADD COLUMN IF NOT EXISTS "selectedItems" JSONB;

-- ServiceCatalog table
CREATE TABLE IF NOT EXISTS "ServiceCatalog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceCatalog_serviceId_key" ON "ServiceCatalog"("serviceId");
CREATE INDEX IF NOT EXISTS "ServiceCatalog_tenantId_idx" ON "ServiceCatalog"("tenantId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceCatalog_tenantId_fkey') THEN
        ALTER TABLE "ServiceCatalog" ADD CONSTRAINT "ServiceCatalog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceCatalog_serviceId_fkey') THEN
        ALTER TABLE "ServiceCatalog" ADD CONSTRAINT "ServiceCatalog_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ServiceCatalogItem table
CREATE TABLE IF NOT EXISTS "ServiceCatalogItem" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unitPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "imageUrl" TEXT,
    "maxQty" INTEGER NOT NULL DEFAULT 1,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServiceCatalogItem_catalogId_idx" ON "ServiceCatalogItem"("catalogId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceCatalogItem_catalogId_fkey') THEN
        ALTER TABLE "ServiceCatalogItem" ADD CONSTRAINT "ServiceCatalogItem_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "ServiceCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

