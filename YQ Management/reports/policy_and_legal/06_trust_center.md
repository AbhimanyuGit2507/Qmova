# Trust Center (`/trust`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/trust/index.tsx`
  - MDX Content: `frontend/content/docs/trust/index.mdx`
  - Trust Docs: `security-overview.mdx`, `architecture.mdx`, `subprocessors.mdx`
- **Route Path**: `/trust`
- **Target Audience**: Corporate enterprise risk assessors, compliance managers, and prospective enterprise clients.
- **Key Dependencies**: React, Next.js (`GetStaticProps`), `next-mdx-remote`, `MarketingLayout`, `MDXComponents`, `lib/docs.ts`.

---

## 2. Frontend Architecture & Trust Presentation
- **MDX Hierarchy**: Serves as the central hub linking to detailed sub-documents:
  - `security-overview`: High-level security controls, vulnerability scans, and organizational safeguards.
  - `architecture`: Detailed infrastructure topology, cloud redundancy, and disaster recovery plans.
  - `subprocessors`: Publicly maintained catalog of all third-party sub-processors with legal entity names, processing locations, and processing purposes.
- **Visual Design**: High-credibility design language utilizing neutral tones, clear categorization badges, and direct links to download official security compliance artifacts.

---

## 3. Subprocessor Catalog & Regulatory Transparency
- **Documented Subprocessors**:
  - **Hosting & Compute**: VPS / Cloud Infrastructure (South Africa & EU nodes) for primary NestJS and PostgreSQL execution.
  - **Database & Cache**: Managed PostgreSQL 15+ and Redis In-Memory State Broker.
  - **Messaging Rails**: Evolution API (WhatsApp infrastructure) and Brevo (Transactional Email delivery).
  - **Financial Gateways**: Stripe Inc. (Credit card processing) and Paystack Payments Limited (South African domestic banking EFT and cards).
  - **Telemetry & Error Logging**: Sentry.io (Error tracking and profiling).

---

## 4. Architecture & System Design
- **Subprocessor Change Notification**: Fulfills GDPR Article 28 and POPIA Data Processing Addendum (DPA) requirements by maintaining an authoritative, publicly accessible register of processing vendors.
- **Static Edge Delivery**: Pre-compiled via Next.js SSG for immediate load speeds and 100% reliability.

---

## 5. Business Abstraction & Value Proposition
- **Procurement Acceleration**: Reduces enterprise procurement vendor risk assessment cycles from weeks to minutes by preemptively answering 95% of standard third-party risk questionnaires.
- **Brand Transparency**: Openly detailing subprocessors and security topology signals engineering maturity and enterprise operational readiness.

