-- Delete dummy demo visits created by the demo script
DELETE FROM "VisitStep" WHERE "visitId" IN (
    SELECT id FROM "Visit" WHERE "accessToken" LIKE 'demo-%' 
    OR "displayId" IN ('C-101', 'C-102', 'C-103', 'C-104', 'C-105', 'C-106')
);

DELETE FROM "Visit" WHERE "accessToken" LIKE 'demo-%' 
OR "displayId" IN ('C-101', 'C-102', 'C-103', 'C-104', 'C-105', 'C-106');

-- Delete dummy customers with fake example.com emails created for the demo
DELETE FROM "Customer" WHERE email IN (
    'ntolo.family@example.com',
    'jenkins.family@example.com',
    'ndlovu.family@example.com',
    'vandermerwe@example.com',
    'patel.family@example.com'
) OR email LIKE '%@example.com';
