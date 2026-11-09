# Privacy Policy (`/privacy`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/privacy/index.tsx`
  - MDX Content: `frontend/content/docs/legal/privacy-policy.mdx`
  - Backend Service: `backend/src/policies/policies.service.ts`
- **Route Path**: `/privacy`
- **Target Audience**: All platform visitors, prospective tenants, healthcare patients, retail customers, and regulatory auditors inspecting data processing practices.
- **Key Dependencies**: React, Next.js (`GetStaticProps`), `next-mdx-remote` (`MDXRemote`, `serialize`), `MarketingLayout`, `MDXComponents`, `lib/docs.ts`.

---

## 2. Frontend Architecture & Legal Prose Presentation
- **Dynamic MDX Pipeline**:
  - `getStaticProps` loads content from `frontend/content/docs/legal/privacy-policy.mdx` via `getDocBySlug(['legal', 'privacy-policy'])`.
  - Serializes with `rehype-slug` and `rehype-autolink-headings` for interactive anchor jumps.
  - Formatted inside a centered container (`max-w-4xl mx-auto pt-32 pb-20 px-6`) using Tailwind Typography (`prose prose-invert prose-indigo`).
- **Core Disclosure Sections**:
  1. **Categories of Personal Data Processed**: Customer phone numbers (E.164), first names, check-in timestamps, visit durations, payment transaction references, and provider notes.
  2. **Legal Basis for Processing**: Legitimate interest and performance of contract (facilitating orderly queue management, delivering turn-ready SMS/WhatsApp alerts).
  3. **Data Sharing & Subprocessors**: Discloses integration partners (WhatsApp / Evolution API, Stripe, Paystack, Brevo, AWS/VPS infrastructure).
  4. **Cross-Border Transfers & Storage**: Details South African POPIA provisions and EU GDPR standard contractual clauses.

---

## 3. Backend Integration & Acceptance Tracking
- **Acceptance API**: When a user registers or logs in after a policy version update, the frontend posts to `POST /policies/accept` (`PoliciesController`).
- **Audit Persistence**: Stored in PostgreSQL `PolicyAcceptance` table:
  - `userId`: Foreign key to `User(id)`.
  - `policyType`: `PRIVACY_POLICY`.
  - `version`: Version string (e.g. `2026.1`).
  - `ipAddress`: Captured client IP from request.
  - `userAgent`: Client browser signature.
  - `createdAt`: ISO timestamp of affirmative consent.

---

## 4. Architecture & System Design
- **Versioned MDX System**: Decouples legal document updates from code deploys. Updating `privacy-policy.mdx` automatically propagates to the static page on next build.
- **POPIA / GDPR Alignment**: Fulfills mandatory statutory notice obligations under South African POPIA Section 18 and GDPR Articles 13 & 14.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Regulatory Clearance**: Medical clinics and financial institutions cannot legally adopt cloud software without a compliant, audit-ready Privacy Policy.
- **Legal Protection**: Protects the SaaS operator against non-compliance penalties, unlawful processing claims, and privacy liability.

