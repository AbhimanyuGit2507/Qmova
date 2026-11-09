# Subscription Billing & Plan Quotas (`/dashboard/settings/billing`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/billing.tsx`
- **Supporting Component**: `frontend/src/components/settings/billing.tsx`
- **Route Path**: `/dashboard/settings/billing`
- **Target Audience**: Tenant owners and finance administrators managing the SaaS subscription, payment methods, invoice downloads, and usage meters.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, `usePlan`, Sonner `toast`, `ConfirmModal`.

---

## 2. Frontend Architecture & Billing Dashboard
- **Active Subscription Status Banner**:
  - Displays current plan name (e.g. `Standard Plan` or `Premium Plan`).
  - Status indicator: `ACTIVE` (Emerald), `TRIAL` (Sky), `PAST_DUE` (Amber), `CANCELLED` (Zinc).
  - Next billing date and renewal price in local currency (ZAR).
  - "Upgrade / Change Plan" modal triggering immediate plan migration with prorated invoice previews.
  - "Cancel Subscription" button opening `ConfirmModal` explaining that cancellation takes effect at the end of the current paid billing period.
- **Real-Time Quota Usage Gauges**:
  - **Tokens / Monthly Visits**: Visual progress bar showing used tokens vs. plan quota (e.g. `428 / 1,000 Visits (42.8%)`).
  - **Locations**: Active branches vs. limit (e.g. `2 / 3 Locations`).
  - **Services**: Active services vs. limit (e.g. `4 / 5 Services`).
  - **Staff Seats**: Platform and provider seats vs. limit (e.g. `6 / 10 Staff`).
- **Official Invoice History Ledger**:
  - Table of historical SaaS subscription billing receipts (`Invoice` entity).
  - Columns: Invoice Number, Date, Amount (ZAR), Payment Method, Status (`PAID`), and Download PDF button.

---

## 3. Backend Integration & Invoicing Pipeline
- **API Endpoints**:
  - `GET /billing/subscriptions` (`backend/src/subscription/subscription.controller.ts`).
  - `POST /billing/subscriptions/change-plan` (Executes plan upgrade or downgrade).
  - `POST /billing/subscriptions/cancel` (Marks `cancelAtPeriodEnd = true`).
  - `GET /billing/invoices` (`backend/src/billing/billing.controller.ts`).
  - `GET /billing/invoices/:id/pdf` (Generates official downloadable PDF invoice).
- **Payment Provider Gateway**:
  Backed by Ozow direct bank EFT and card payment providers (`OzowProvider`), generating unique redirect payment URLs (`POST /billing/create-charge`).

---

## 4. Architecture & System Design
- **Graceful Past-Due Handling**: If a recurring charge fails, subscription status transitions to `PAST_DUE` with a 3-day grace period. Platform displays a warning banner without immediately shutting down live physical lobby queues.
- **Quota Guarding Middleware**: Quota usage counters are computed dynamically or cached in `TenantUsage` records, allowing instantaneous check-ins without blocking on heavy historical count queries.

---

## 5. Business Abstraction & Value Proposition
- **Predictable ARR / MRR Collection**: Automates software billing collections and provides self-service plan upgrades when customer business volume expands.
- **Frictionless Compliance & Accounting**: Provides automated, VAT-compliant tax invoices that corporate finance departments can download directly for monthly bookkeeping.

