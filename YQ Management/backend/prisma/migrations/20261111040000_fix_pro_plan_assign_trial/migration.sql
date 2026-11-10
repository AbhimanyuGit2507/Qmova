-- Migration: Extend yqbuddy subscription + fix Pro Plan
-- Part 1: Extend the yqbuddy (YQ Queue HQ) tenant subscription to prevent expiry
-- The subscription was expiring, putting the account in Read-Only mode

-- Extend yqbuddy subscription period by 90 days from now
UPDATE "Subscription"
SET
  "status" = 'ACTIVE',
  "currentPeriodStart" = NOW(),
  "currentPeriodEnd" = NOW() + INTERVAL '90 days',
  "renewalDate" = NOW() + INTERVAL '90 days',
  "nextBillingDate" = NOW() + INTERVAL '90 days',
  "cancelAtPeriodEnd" = false,
  "updatedAt" = NOW()
WHERE "tenantId" = (
  SELECT id FROM "Tenant" WHERE subdomain = 'yqbuddy'
);

-- Part 2: Fix Pro Plan — deactivate it and reassign any tenants on it to Trial
-- Reassign subscriptions on Pro Plan to Trial
UPDATE "Subscription" s
SET
  "planId" = (
    SELECT id FROM "Plan" WHERE type = 'TRIAL' ORDER BY "createdAt" ASC LIMIT 1
  ),
  "status" = 'TRIAL',
  "trialStartDate" = COALESCE(s."trialStartDate", NOW()),
  "trialEndDate" = NOW() + INTERVAL '30 days',
  "currentPeriodStart" = NOW(),
  "currentPeriodEnd" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW(),
  "metadata" = jsonb_set(
    COALESCE(s."metadata", '{}'::jsonb),
    '{reassignedFromProPlan}',
    'true'::jsonb
  )
WHERE s."planId" IN (
  SELECT id FROM "Plan"
  WHERE
    (name ILIKE '%pro%' AND name NOT ILIKE '%premium%' AND name NOT ILIKE '%enterprise%')
    OR (price > 0 AND price < 500 AND currency = 'USD')
);

-- Deactivate the Pro Plan
UPDATE "Plan"
SET
  active = false,
  "updatedAt" = NOW()
WHERE
  (name ILIKE '%pro%' AND name NOT ILIKE '%premium%' AND name NOT ILIKE '%enterprise%')
  OR (price > 0 AND price < 500 AND currency = 'USD');
