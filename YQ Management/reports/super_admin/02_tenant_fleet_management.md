# Global Tenant Fleet Management (`/super-admin/tenants`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/super-admin/tenants/index.tsx` (Tenant Directory & Fleet Roster)
  - `frontend/src/pages/super-admin/tenants/[id].tsx` (Tenant Detail, Quotas & Impersonation)
- **Route Paths**: `/super-admin/tenants`, `/super-admin/tenants/[id]`
- **Target Audience**: Platform Super Administrators managing tenant accounts, subscription overrides, and customer support interventions.
- **Key Dependencies**: React (`useState`), Next.js (`useRouter`, `Link`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Building2`, `Search`, `Trash2`, `CreditCard`, `Filter`, `ArrowUpRight`).

---

## 2. Frontend Architecture & Fleet Management Console
- **Tenant Directory Index (`/tenants`)**:
  - Filter by Subscription Status: `ALL`, `ACTIVE`, `TRIAL`, `EXPIRED`, `CANCELLED`.
  - Sort by: `joined` (Registration date), `name`, `queues` count, `users` count.
  - Search Bar: Real-time fuzzy filtering across tenant names and subdomains.
  - Table Columns: Company Name, Subdomain, Primary Owner Email, Active Plan Tier, Monthly Visit Count, WhatsApp Status, and Actions.
  - One-click deletion with double-confirmation modal (`ConfirmModal`).
- **Tenant Deep-Dive & Control Panel (`/tenants/[id]`)**:
  - **Account Masquerade / Impersonation**: Generates a temporary administrative login token allowing Super Admin to jump directly into the tenant's live dashboard for hands-on troubleshooting.
  - **Manual Subscription Override**:
    - Assign any Plan tier (including custom Enterprise tiers).
    - Toggle `isFree = true` for complimentary partner accounts.
    - Set custom subscription expiration dates.
    - Extend trial by N days (`extendSubscription`).
  - **Quota Synchronization (`syncLimits`)**: Forces immediate synchronization between plan limits and active operational quotas.

---

## 3. Backend Integration & Administrative Operations
- **API Endpoints**:
  - `GET /super-admin/tenants?search=...` (`backend/src/super-admin/super-admin.controller.ts`).
  - `GET /super-admin/tenants/:id`.
  - `PUT /super-admin/tenants/:id` (Updates tenant metadata).
  - `DELETE /super-admin/tenants/:id` (Hard cascade removal).
  - `POST /super-admin/tenants/:id/assign-plan`.
  - `POST /super-admin/tenants/:id/extend-subscription`.
  - `POST /super-admin/tenants/:id/sync-limits`.
- **Cascade Deletion Protocol**:
  Deleting a tenant from Super Admin executes a clean PostgreSQL cascade wiping all related `Location`, `Service`, `Queue`, `Visit`, `Staff`, `Customer`, and `OutboxEvent` records.

---

## 4. Architecture & System Design
- **Administrative Impersonation Pattern**: Issues a signed JWT containing `{ userId, tenantId, masquerade: true }`, allowing support engineers to reproduce bugs in the customer's exact environment without asking for customer passwords.
- **Audit Logging**: Every administrative modification executed in Super Admin is logged in `AuditLog` with `userId = super_admin_id`.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Deal Closing**: Enables sales leads to close bespoke enterprise contracts with custom pricing, extended 60-day trials, or grandfathered quotas with a single click.
- **Rapid Customer Support**: Eliminates multi-day support ping-pong. Platform engineers can instantly inspect a tenant's queues, WhatsApp connection, and error logs directly.

