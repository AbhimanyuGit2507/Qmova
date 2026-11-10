-- Migration: Final comprehensive demo data cleanup
-- Remove ALL remaining demo visits, customers, and related data
-- This catches anything the previous cleanup missed

-- Step 1: Delete visit steps for all demo visits (cascade-safe)
DELETE FROM "VisitStep" WHERE "visitId" IN (
  SELECT id FROM "Visit" WHERE 
    "accessToken" ILIKE 'demo-%'
    OR "accessToken" ILIKE '%demo%'
    OR "displayId" IN ('C-101', 'C-102', 'C-103', 'C-104', 'C-105', 'C-106', 'C-107', 'C-108')
);

-- Step 2: Delete booking payments for demo visits
DELETE FROM "BookingPayment" WHERE "visitId" IN (
  SELECT id FROM "Visit" WHERE 
    "accessToken" ILIKE 'demo-%'
    OR "accessToken" ILIKE '%demo%'
    OR "displayId" IN ('C-101', 'C-102', 'C-103', 'C-104', 'C-105', 'C-106', 'C-107', 'C-108')
);

-- Step 3: Delete the demo visits
DELETE FROM "Visit" WHERE 
  "accessToken" ILIKE 'demo-%'
  OR "accessToken" ILIKE '%demo%'
  OR "displayId" IN ('C-101', 'C-102', 'C-103', 'C-104', 'C-105', 'C-106', 'C-107', 'C-108');

-- Step 4: Delete all example.com and demo customers
DELETE FROM "Customer" WHERE 
  email ILIKE '%@example.com'
  OR email ILIKE '%demo%@%'
  OR name ILIKE '%Lethabo%Ntolo%'
  OR name ILIKE '%Sarah%Jenkins%'
  OR name ILIKE '%Sipho%Ndlovu%'
  OR name ILIKE '%Liam%Van der Merwe%'
  OR name ILIKE '%Amina%Patel%'
  OR name ILIKE '%Noah%Dlamini%';
