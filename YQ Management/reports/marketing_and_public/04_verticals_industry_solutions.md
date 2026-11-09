# Industry Solutions & Verticals (`/for/[vertical]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/for/[vertical].tsx`
- **Route Path**: `/for/[vertical]` (Dynamic SSG Route: `/for/clinics`, `/for/salons`, `/for/banks`, `/for/repair-shops`)
- **Target Audience**: Industry-specific buyers (medical directors, salon managers, bank branch heads, automotive workshop managers) arriving from industry-targeted search or social campaigns.
- **Key Dependencies**: React, Next.js (`GetStaticProps`, `GetStaticPaths`, `Head`, `Link`), `MarketingLayout`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Static Generation Model**: Pre-renders optimized static pages for each target industry at build time via `getStaticPaths`:
  - `clinics`: Patient flow management, HIPAA-aligned WhatsApp updates, doctor-specific queues, contactless triage.
  - `salons`: Barbershop/spa waitlist, chair utilization, automated no-show prevention, stylist tracking.
  - `banks`: Financial branch management, multi-teller routing, VIP client prioritization, FICA/KYC verification desks.
  - `repair-shops`: Automotive service bay status, vehicle intake inspection, "your car is ready" WhatsApp alerts.
- **Hero & Value Matrix**:
  - Unsplash high-resolution contextual background photography with dark slate overlay (`bg-slate-900/80`).
  - Bulleted "Why Qmova for [Industry]?" benefit cards with checkmark indicators.
  - Paired Call-to-Actions (CTAs): Primary `Start 14-Day Free Trial` (`/register`) and secondary `Book a Demo` (`/contact`).

---

## 3. Backend Integration & Data Mapping
- **SSG Data Structure**: Self-contained `VerticalData` interface defining industry `id`, `title`, `description`, `features`, `benefits`, and `heroImage`.
- **System Seeding Linkage**: When a tenant signs up from an industry landing page and selects their vertical during onboarding (`/onboarding`), the backend `OnboardingService` automatically applies matching service flow blueprints from `backend/src/service-flow/industry-templates.ts`.

---

## 4. Architecture & System Design
- **Programmatic SEO Strategy**: Generates ultra-fast loading, indexable landing pages with custom title tags and meta descriptions targeting long-tail queries (e.g., "Patient Queue Management System South Africa", "Salon Waitlist App").
- **Edge Cacheability**: Because pages are generated statically via SSG (`fallback: false`), edge caches and Cloudflare CDN nodes serve responses in under 20ms globally.

---

## 5. Business Abstraction & Value Proposition
- **Personalized Positioning**: Solves the generic SaaS dilemma where doctors think a product is only for restaurants, or salon owners think a tool is only for hospitals. Tailored terminology (patients vs. clients vs. visitors) builds immediate domain authority.
- **Conversion Multiplier**: Industry-specific landing pages typically yield 2.5x to 4x higher signup conversion rates compared to generic homepages.

