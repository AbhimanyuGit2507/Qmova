# Backend Module Audit: Tenant & Multi-Tenancy Context Engine

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/tenant/` (`tenant.controller.ts`, `tenant.service.ts`, `tenant-context.middleware.ts`)
  - `backend/src/location/` (`location.controller.ts`, `location.service.ts`)
  - `backend/src/onboarding/` (`onboarding.controller.ts`, `onboarding.service.ts`)
- **Core Entities Managed**: `Tenant`, `Location`, `OperatingMode` enum.
- **Architectural Scope**: Multi-tenant namespace resolution, subdomain parsing, tenant branding tokens, branch location hierarchy, and multi-location atomic provisioning.

---

## 2. API Controllers & Routing Endpoints
- **`TenantController` (`/tenant`)**:
  - `GET /tenant/me`: Authenticated tenant profile, operational hours, and theme tokens.
  - `PATCH /tenant/me`: Updates workspace name, custom subdomain, logo, and brand color.
  - `GET /tenant/public/:subdomain`: Public endpoint returning non-sensitive branding metadata.
- **`LocationController` (`/location`)**:
  - `GET /location`: Lists all physical branches for tenant.
  - `POST /location`: Provisions new location with physical address, coordinates, and timezone.
  - `PATCH /location/:id`: Updates location hours and operating parameters.
- **`OnboardingController` (`/onboarding`)**:
  - `GET /onboarding/check-plan-fit`: Pre-flight check verifying resource scale against plan limits.
  - `POST /onboarding/provision-multi`: Atomically provisions multiple locations, services, and queues.

---

## 3. Middleware & Tenant Isolation Architecture
- **`TenantContextMiddleware`**:
  Intercepts every incoming HTTP request:
  1. Inspects `host` header and `x-tenant-subdomain` header.
  2. Bypasses reserved platform prefixes (`api`, `app`, `www`, `evo`, `qmova`).
  3. Queries Redis cache (`cache:tenant:subdomain:{subdomain}`) or PostgreSQL `Tenant` table.
  4. Injects `req.tenant` context for public endpoints.
- **Cross-Tenant Mutation Defense**:
  Protected controllers explicitly inject `where: { tenantId: req.user.tenantId }` on all Prisma database queries, guaranteeing that users can never access or modify another organization's records.

---

## 4. Architecture & Data Integrity
- **Timezone Normalization**: Every `Location` stores an explicit IANA timezone string (e.g. `Africa/Johannesburg`). All token sequencing, business hours checks, and appointment availability calculations execute in the location's native timezone.

---

## 5. Business Abstraction & Value Proposition
- **Multi-Branch Enterprise Scaling**: Supports organizations scaling from a single boutique shop to a national healthcare network with 50+ branches under a single unified enterprise billing account.
- **True White-Label Branding**: Allows businesses to present a completely native branded experience to their customers.

