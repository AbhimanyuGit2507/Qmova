# Super Admin Command Center (`/super-admin`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/index.tsx`
- **Route Path**: `/super-admin`
- **Target Audience**: Platform Super Administrators and SaaS founders overseeing global platform metrics, multi-tenant health, and infrastructure status.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Lucide Icons (`Building2`, `CreditCard`, `Users`, `Activity`, `ArrowUpRight`).

---

## 2. Frontend Architecture & God-Mode Dashboard
- **Executive Platform KPI Cards**:
  - **Total Businesses**: Count of all registered tenant organizations globally (`totalTenants`).
  - **Active Queues**: Total queues currently in `ACTIVE` state across all clients (`activeQueues`).
  - **Total Customers Served**: Aggregate historical count of completed visits across all tenants (`totalCustomersServed`).
  - **Total Platform Revenue (ZAR)**: Cumulative gross revenue collected through SaaS subscriptions and platform transaction fees (`totalRevenue`).
- **Quick Platform Actions Matrix**:
  - Jump to Tenant Directory (`/super-admin/tenants`).
  - Launch System Logs & Trace Inspection (`/super-admin/system-logs`).
  - Configure Global Pricing Tiers (`/super-admin/pricing`).
  - Test Messaging Infrastructure (`/super-admin/communication`).
  - Toggle System Service Flags (`/super-admin/system-control`).

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /super-admin/metrics` (`backend/src/super-admin/super-admin.controller.ts`).
- **Backend Execution Flow (`getGlobalMetrics`)**:
  Executes high-speed parallel count queries across PostgreSQL:
  ```typescript
  const [totalTenants, activeQueues, totalCustomersServed, totalRevenue] = await Promise.all([
    this.prisma.tenant.count(),
    this.prisma.queue.count({ where: { status: 'ACTIVE' } }),
    this.prisma.visit.count({ where: { currentState: 'COMPLETED' } }),
    this.prisma.transaction.aggregate({ _sum: { amount: true } }),
  ]);
  ```
- **RBAC Enforcement**:
  Guarded by `checkSuperAdmin(req)`:
  ```typescript
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new UnauthorizedException('Access denied. Super Admin only.');
  }
  ```

---

## 4. Architecture & System Design
- **Subdomain Middleware Gatekeeper**:
  Requests to `/super-admin/*` are verified at the Next.js edge middleware. If the authenticated user does not match the configured `SUPER_ADMIN_EMAIL` or hold `role === 'SUPER_ADMIN'`, the edge middleware blocks access and redirects to `/dashboard`.
- **System Resource Isolation**:
  Super admin telemetry queries bypass tenant isolation filters to compute true global multi-tenant aggregates.

---

## 5. Business Abstraction & Value Proposition
- **Platform Health Monitoring**: Provides the SaaS leadership team with a bird's-eye view of platform adoption, transaction volume velocity, and infrastructure stability.
- **Operational Interventions**: Immediate visibility into platform-wide disruptions or billing drop-offs allows founders to intervene before customer churn occurs.

