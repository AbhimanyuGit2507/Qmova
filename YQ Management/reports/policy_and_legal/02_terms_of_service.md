# Terms of Service (`/terms`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/terms/index.tsx`
  - MDX Content: `frontend/content/docs/legal/terms-of-service.mdx`
  - Backend Service: `backend/src/policies/policies.service.ts`
- **Route Path**: `/terms`
- **Target Audience**: Business owners, practice managers, legal counsel, and platform subscribers.
- **Key Dependencies**: React, Next.js (`GetStaticProps`), `next-mdx-remote`, `MarketingLayout`, `MDXComponents`, `lib/docs.ts`.

---

## 2. Frontend Architecture & Contract Presentation
- **MDX Typography Structure**: Rendered via `MarketingLayout` with responsive dark typography (`prose prose-invert prose-indigo max-w-4xl mx-auto`).
- **Key Contractual Clauses**:
  1. **Subscription Terms & Quotas**: Sets rules governing monthly token limits, allowed staff accounts, location caps, and automatic renewal billing cycles.
  2. **Acceptable Use Policy (AUP)**: Prohibits using the platform for unsolicited spam marketing over WhatsApp/SMS, illegal lotteries, or harassment.
  3. **Multi-Tenant Service Availability & SLAs**: Defines service level targets (99.9% target uptime), planned maintenance windows, and force majeure limitations.
  4. **Payment Gateway Responsibility**: Clarifies that disputes, chargebacks, and transaction fees arising through connected Stripe or Paystack accounts are governed by merchant terms with those respective gateways.
  5. **Limitation of Liability & Indemnification**: Protects Qmova against consequential damages resulting from third-party network outages (e.g. Meta WhatsApp API downtime).

---

## 3. Backend Integration & Contract Enforcement
- **Registration Gate**: Self-service registration (`/register`) requires explicit checkbox consent linked to this document before `POST /auth/register` succeeds.
- **Acceptance Tracking**: Backed by `POST /policies/accept` which writes a `PolicyAcceptance` row with `policyType = 'TERMS_OF_SERVICE'` alongside client IP and timestamp.
- **Contract Enforcement**: In the event of AUP violations, Super Admin can suspend tenants directly from `/super-admin/tenants/[id]`.

---

## 4. Architecture & System Design
- **Deterministic Static Rendering**: Pre-rendered via `getStaticProps` from markdown content for zero latency and high crawler accessibility.
- **Immutable Acceptance Record**: Acceptance records cannot be modified via API, ensuring valid legal evidentiary weight during commercial disputes.

---

## 5. Business Abstraction & Value Proposition
- **Commercial Risk Shield**: Defines the legal operating boundary between Qmova as software provider and the tenant as independent service operator.
- **Billing Enforcement**: Legally establishes subscription payment obligations, proration rules, and debt recovery mechanisms for past-due accounts.

