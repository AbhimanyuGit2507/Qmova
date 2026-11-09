# Backend Module Audit: SaaS Subscriptions, Billing & Invoicing

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/billing/` (`billing.controller.ts`, `billing.service.ts`, `enterprise-inquiry.controller.ts`)
  - `backend/src/subscription/` (`subscription.controller.ts`, `subscription.service.ts`)
  - `backend/src/plans/` (`plans.controller.ts`, `public-plans.controller.ts`, `plans.service.ts`)
  - `backend/src/invoice/` (`invoice.controller.ts`, `invoice.service.ts`)
- **Core Entities Managed**: `Plan`, `Subscription`, `Invoice`, `Transaction`, `TenantUsage`, `EnterpriseInquiry`, `SubscriptionStatus` enum.
- **Architectural Scope**: Multi-tier recurring subscriptions, quota limit enforcement (`checkLimit`), Ozow payment gateway processing, automated proration, deferred cancellations, and PDF invoice generation.

---

## 2. API Controllers & Routing Endpoints
- **`SubscriptionController` (`/billing/subscriptions`)**:
  - `GET /billing/subscriptions`: Current tenant subscription status and period metrics.
  - `POST /billing/subscriptions/change-plan`: Executes tier upgrade or downgrade.
  - `POST /billing/subscriptions/cancel`: Marks subscription to cancel at period end.
- **`PlansController` (`/billing/plans`) & `PublicPlansController` (`/public/plans`)**:
  - `GET /billing/plans`: Lists all available plans with feature entitlement flags.
  - `GET /public/plans`: Public unauthenticated plan catalog for marketing pages.
- **`BillingController` (`/billing`)**:
  - `POST /billing/create-charge`: Generates payment charge URL for subscription checkout.
  - `POST /billing/webhook`: Handles Ozow / payment gateway transaction callbacks.
  - `GET /billing/invoices`: Returns list of official billing receipts.
  - `GET /billing/invoices/:id/pdf`: Renders PDF tax invoice.
- **`EnterpriseInquiryController` (`/billing/enterprise-inquiries`)**:
  - `POST /billing/enterprise-inquiries`: Public lead capture for enterprise sales.

---

## 3. Service Layer Architecture & Quota Enforcement
- **`SubscriptionService.checkLimit()`**:
  Enforces plan quotas during runtime operations:
  ```typescript
  async checkLimit(tenantId: string, resourceType: 'visits' | 'locations' | 'services' | 'staff', currentCount: number) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
    });
    if (!sub || !sub.plan) throw new ForbiddenException('No active subscription found');

    const limit = sub.plan.limits[`max${capitalize(resourceType)}`];
    if (limit && currentCount >= limit) {
      throw new ForbiddenException(`Plan limit of ${limit} ${resourceType} exceeded. Please upgrade.`);
    }
  }
  ```
- **Automated Deferred Cancellations (`TasksService.handleDeferredCancellations`)**:
  Cron runs daily at midnight (`EVERY_DAY_AT_MIDNIGHT`). Queries subscriptions where `cancelAtPeriodEnd = true` and `currentPeriodEnd <= now()`, updating status to `CANCELLED` and sending email notifications.

---

## 4. Architecture & Data Integrity
- **Webhook Idempotency**: Payment webhook handlers verify transaction signatures and inspect the `Transaction` table. If a transaction reference has already been processed, it returns `200 OK` without duplicating subscription periods or invoices.
- **Grace Period Engine**: Provides a 3-day grace period on failed recurring payments before freezing operational write permissions.

---

## 5. Business Abstraction & Value Proposition
- **Predictable Recurring Revenue**: Powers the commercial foundation of the SaaS, automating recurring collections, plan migrations, and usage meter tracking.
- **Compliant Invoicing**: Automatically generates VAT-compliant PDF invoices, reducing administrative accounting workload for both platform operators and customer finance teams.

