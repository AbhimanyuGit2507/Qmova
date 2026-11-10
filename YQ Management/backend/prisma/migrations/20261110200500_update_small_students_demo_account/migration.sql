-- 1. Update the Tenant with Small Students details, branding, and contact info
UPDATE "Tenant"
SET 
    "name" = 'Small Students Crèche & Preschool',
    "supportEmail" = 'smallstudentspreschool@gmail.com',
    "supportPhone" = '+27 76 078 0649',
    "branding" = '{
        "logoUrl": "https://smallstudents.co.za/data/CompanyImage/Logo/_CompanyLogo.png",
        "primaryColor": "#1fb6ff",
        "accentColor": "#ef0000",
        "companyName": "Small Students Crèche & Preschool",
        "website": "https://smallstudents.co.za"
    }'::jsonb,
    "customerExperience" = '{
        "enableWaitlist": true,
        "autoCallNext": false,
        "language": "en",
        "theme": "school",
        "bannerNotice": "Welcome to Small Students Preschool – 2026 Annual Concert & Catering Portal"
    }'::jsonb
WHERE "subdomain" = 'school-events';

-- 2. Update the Location with physical campus details in Pretoria
UPDATE "Location"
SET 
    "name" = 'Small Students Campus (Theresa Park)',
    "address" = '95 Rooihartbees Avenue, Theresa Park',
    "city" = 'Pretoria',
    "timezone" = 'Africa/Johannesburg',
    "businessHours" = '{
        "monday": {"open": "06:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "06:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "06:00", "close": "18:00", "closed": false},
        "thursday": {"open": "06:00", "close": "18:00", "closed": false},
        "friday": {"open": "06:00", "close": "18:00", "closed": false},
        "saturday": {"open": "08:00", "close": "17:00", "closed": true},
        "sunday": {"open": "08:00", "close": "17:00", "closed": true}
    }'::jsonb
WHERE "tenantId" IN (SELECT id FROM "Tenant" WHERE "subdomain" = 'school-events');

-- 3. Upsert / Update User Account with new password and details
-- Password is 'SmallStudents#Pretoria2026' -> $2b$10$QLfpUFdQ4gRqZLicPMjri.CUo1PW4a4fzjl7IvznhLTP4ro6aiFo.
DO $$
DECLARE
    v_tenant_id TEXT;
    v_password_hash TEXT := '$2b$10$QLfpUFdQ4gRqZLicPMjri.CUo1PW4a4fzjl7IvznhLTP4ro6aiFo.';
BEGIN
    SELECT id INTO v_tenant_id FROM "Tenant" WHERE "subdomain" = 'school-events' LIMIT 1;
    
    IF v_tenant_id IS NOT NULL THEN
        -- If old demo user exists, update it to smallstudentspreschool@gmail.com
        IF EXISTS (SELECT 1 FROM "User" WHERE email = 'events@schooldemo.co.za') THEN
            UPDATE "User"
            SET 
                email = 'smallstudentspreschool@gmail.com',
                password = v_password_hash,
                name = 'Sonette (Principal - Small Students)',
                phone = '+27 76 078 0649',
                role = 'OWNER',
                "tenantId" = v_tenant_id
            WHERE email = 'events@schooldemo.co.za';
        ELSIF EXISTS (SELECT 1 FROM "User" WHERE email = 'smallstudentspreschool@gmail.com') THEN
            UPDATE "User"
            SET 
                password = v_password_hash,
                name = 'Sonette (Principal - Small Students)',
                phone = '+27 76 078 0649',
                role = 'OWNER',
                "tenantId" = v_tenant_id
            WHERE email = 'smallstudentspreschool@gmail.com';
        ELSE
            INSERT INTO "User" (
                id, 
                email, 
                password, 
                name, 
                phone, 
                role, 
                "tenantId", 
                "allowedLocationIds", 
                "allowedPages", 
                "allowedServiceIds", 
                skills
            ) VALUES (
                gen_random_uuid()::text,
                'smallstudentspreschool@gmail.com',
                v_password_hash,
                'Sonette (Principal - Small Students)',
                '+27 76 078 0649',
                'OWNER',
                v_tenant_id,
                ARRAY[]::text[],
                ARRAY[]::text[],
                ARRAY[]::text[],
                ARRAY[]::text[]
            );
        END IF;

        -- Also ensure events@yqbuddy.com is updated with the same password for admin pair access
        UPDATE "User"
        SET password = v_password_hash
        WHERE email = 'events@yqbuddy.com';
    END IF;
END $$;

