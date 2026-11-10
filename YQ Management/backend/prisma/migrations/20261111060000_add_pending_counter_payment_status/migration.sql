-- Migration: Phase 1 — Add PENDING_COUNTER to BookingPaymentStatus enum
-- This properly tracks counter payment debts as a queryable state

-- Step 1: Add new value to the enum
ALTER TYPE "BookingPaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING_COUNTER';

-- Step 2: Update existing PENDING offline payment records to use the new state
-- (payments with method CASH/OFFLINE that are still awaiting counter collection)
UPDATE "BookingPayment"
SET status = 'PENDING_COUNTER', "updatedAt" = NOW()
WHERE 
  status = 'PENDING'
  AND (
    method = 'CASH'
    OR "stripePaymentMethodType" = 'OFFLINE'
    OR description ILIKE '%counter%'
  );

-- Step 3: Also fix the specific test visit's cancelled payment to pending_counter
-- (and any similar cases where CANCELLED was used for counter payments)
UPDATE "BookingPayment"
SET status = 'PENDING_COUNTER', "updatedAt" = NOW()
WHERE 
  status = 'CANCELLED'
  AND description ILIKE '%counter%'
  AND method = 'CASH';

