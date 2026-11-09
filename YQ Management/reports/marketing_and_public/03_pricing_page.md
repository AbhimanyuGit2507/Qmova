# Pricing Page (`/pricing`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/pricing/index.tsx`
- **Route Path**: `/pricing`
- **Target Audience**: Business owners, procurement evaluators, practice managers evaluating cost, plan limits, and upgrade paths.
- **Key Dependencies**: React (`useState`), Next.js (`GetServerSideProps`, `Head`, `Link`), Framer Motion, Lucide Icons (`CheckCircle2`), `useAuth`, `Logo`, `Footer`.

---

## 2. Frontend Architecture & UI/UX Audit
- **State Management**:
  - `isYearly` (boolean): Controls billing frequency toggle (Monthly vs. Annual with 2 months free discount).
  - Dynamically recalculates monthly equivalent pricing when Annual toggle is activated.
- **Pricing Cards Matrix**:
  - Displays 3 primary tiers: **Starter (14-Day Free Trial)**, **Standard Plan (R499/mo)**, and **Premium Plan (R1,499/mo)**, followed by a dedicated Enterprise custom tier banner.
  - Highlights feature checklists (WhatsApp bots, two-way chat, custom branding, SLA policies, multi-location support).
  - Explicit quota counters: Maximum tokens/visits per month, allowed staff seats, and supported physical branch locations.
- **Resilience Fallback**: If backend API is unreachable during SSR, code contains deterministic fallback plan defaults in South African Rand (ZAR) ensuring the pricing page never crashes for public visitors.

---

## 3. Backend Integration & Data Flow
- **SSR Endpoint**: `getServerSideProps` executes an HTTP request to `GET /public/plans` (`PublicPlansController`).
- **Data Serialization**:
  ```typescript
  const res = await fetch(`${backendUrl}/public/plans`);
  if (res.ok) {
    plans = await res.json();
    plans.sort((a, b) => a.price - b.price);
  }
  ```
- **Prisma Entity Mapping**: Directly queries the `Plan` table where `isActive = true` and `isPublic = true`.

---

## 4. Architecture & System Design
- **Super Admin Dynamic Control**: Plans displayed on `/pricing` are not hardcoded static text; they are actively managed by the platform owner through the Super Admin portal (`/super-admin/pricing`), allowing real-time price adjustments, promotional discounts, and quota updates without code redeployment.
- **SSR Caching**: Compatible with CDN stale-while-revalidate headers (`s-maxage=300`) to minimize database query pressure during high marketing campaign traffic.

---

## 5. Business Abstraction & Value Proposition
- **Self-Serve Conversion Engine**: Eliminates pricing friction for small-to-medium businesses (SMBs) with immediate 14-day trial signup, while routing large healthcare systems and retail chains to enterprise custom demo requests (`/book-demo`).
- **Expansion Mechanics**: Clearly articulates upgrade thresholds (hitting token limits, needing multi-branch support, or requiring white-label branding removal), incentivizing natural organic account expansion.

