# Platform Analytics & Multi-Tenant BI (`/super-admin/analytics`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/analytics/index.tsx`
- **Route Path**: `/super-admin/analytics`
- **Target Audience**: Platform Super Administrators, SaaS executives, and investors analyzing macro business health and cross-tenant platform usage.
- **Key Dependencies**: React, `SuperAdminLayout`, TanStack Query, `fetchApi`, Lucide Icons (`BarChart3`, `TrendingUp`, `Users`, `CreditCard`, `Layers`, `Activity`, `Calendar`).

---

## 2. Frontend Architecture & Macro Intelligence
- **Platform Executive Scorecards**:
  - **Monthly Recurring Revenue (MRR)**: Real-time calculation of active subscription value in ZAR.
  - **Annual Run Rate (ARR)**: Project annual SaaS revenue.
  - **Net Customer Growth Rate**: Month-over-month new registrations vs. cancellations.
  - **Cross-Platform Queue Volume**: Total queue tokens generated across all businesses this month.
  - **Average Platform Wait Time**: Global aggregate wait time across all locations.
- **Cross-Vertical Distribution Breakdown**:
  - Pie/Bar distribution showing market penetration across target industries: Healthcare (42%), Food & Beverage (24%), Salons & Spas (18%), Civic & Corporate (16%).
- **Plan Tier Distribution**:
  - Proportion of customer base on Starter (Free Trial) vs. Standard (R499) vs. Premium (R1,499) vs. Enterprise.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /super-admin/analytics` (`backend/src/super-admin/super-admin.controller.ts`).
  - `GET /super-admin/transactions` (Recent platform payment events).
- **Backend Analytics Engine (`getPlatformAnalytics`)**:
  Aggregates cross-tenant data across `Subscription`, `Plan`, `Visit`, and `Tenant` tables:
  ```typescript
  const activeSubscriptions = await this.prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true },
  });
  const mrr = activeSubscriptions.reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);
  ```

---

## 4. Architecture & System Design
- **Analytical Read Replicas & Caching**: Super Admin analytics queries are cached in Redis (`cache:super-admin:analytics`, TTL: 10 minutes) to prevent heavy multi-table aggregations from slowing down frontline tenant queue operations.
- **Time-Series Partitioning**: Analyzes data across standard 30-day, 90-day, and 12-month rolling windows.

---

## 5. Business Abstraction & Value Proposition
- **Investor & Board Reporting**: Instantly exports verifiable SaaS metrics (MRR, churn, CAC payback, LTV) for investment rounds and strategic reviews.
- **Feature Prioritization**: Reveals which industry verticals drive the highest usage velocity, directing product engineering resources where commercial returns are greatest.

