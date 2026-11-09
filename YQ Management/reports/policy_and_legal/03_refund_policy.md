# Refund Policy (`/refund-policy`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/refund-policy/index.tsx`
  - MDX Content: `frontend/content/docs/legal/refund-policy.mdx`
  - Backend Controller: `backend/src/policies/policies.controller.ts`
- **Route Path**: `/refund-policy`
- **Target Audience**: Subscribers evaluating cancellation rights, billing disputants, and consumer protection regulators.
- **Key Dependencies**: React, Next.js (`GetStaticProps`), `next-mdx-remote`, `MarketingLayout`, `MDXComponents`, `lib/docs.ts`.

---

## 2. Frontend Architecture & Policy Structure
- **Rendering Stack**: Leverages MDXRemote with rehype plugins inside `MarketingLayout`, styled via Tailwind Typography.
- **Core Policy Framework**:
  1. **14-Day Free Evaluation Window**: Emphasizes that all tenants receive full access during their initial 14-day trial without requiring credit card upfront commitments.
  2. **Subscription Cancellations**: Details how canceling an active plan stops future billing at the conclusion of the current billing cycle (`cancelAtPeriodEnd = true`), preserving access until the paid period expires.
  3. **Proration & Refund Discretion**: Explains that monthly subscription fees are generally non-refundable once an invoice is settled, with exceptions for documented platform outages exceeding SLA thresholds.
  4. **Customer Service / Appointment Refunds**: Distinguishes platform SaaS subscription fees from consumer payments made to tenants (e.g. clinic deposits or salon prepayments), clarifying that customer appointment refunds are governed by the individual merchant's refund policy.

---

## 3. Backend Integration & Automated Deferred Cancellation
- **Subscription Lifecycle Engine**: When a tenant requests cancellation in `/dashboard/settings/billing`, the backend marks the subscription:
  ```typescript
  update: {
    cancelAtPeriodEnd: true,
  }
  ```
- **Automated Cron Sweep**: `handleDeferredCancellations` in `TasksService` runs daily at midnight (`EVERY_DAY_AT_MIDNIGHT`), queries subscriptions where `cancelAtPeriodEnd = true` and `currentPeriodEnd <= now()`, updates status to `CANCELLED`, and sends confirmation emails.

---

## 4. Architecture & System Design
- **Consumer Protection Alignment**: Complies with South African Consumer Protection Act (CPA) Section 14 provisions regarding fixed-term agreements and cancellation notices.
- **Edge Cacheable**: Static export served from CDN edge cache with zero server execution overhead.

---

## 5. Business Abstraction & Value Proposition
- **Churn Management**: Reduces chargeback disputes and merchant gateway fines by providing clear, unambiguous refund criteria.
- **Consumer Trust**: Promotes customer confidence by establishing upfront transparency on trial periods and cancellation terms.

