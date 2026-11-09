# Cookie Policy & Consent Engine (`/cookies`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/cookies/index.tsx`
  - Floating Banner Component: `frontend/src/components/CookieConsent.tsx`
  - MDX Content: `frontend/content/docs/legal/cookie-policy.mdx`
  - Backend Controller: `backend/src/policies/policies.controller.ts`
- **Route Path**: `/cookies`
- **Target Audience**: Website visitors, compliance auditors, and privacy-conscious users managing browser tracking preferences.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js (`GetStaticProps`), `next-mdx-remote`, `MarketingLayout`, `MDXComponents`, `lib/docs.ts`, `fetchApi`.

---

## 2. Frontend Architecture & Consent Modal
- **Two-Tier Architecture**:
  1. **Public Policy Page (`/cookies`)**: Full MDXRemote legal breakdown detailing cookie categories, expiration periods, purpose, and third-party vendors.
  2. **Interactive Consent Banner (`CookieConsent.tsx`)**: Mounted globally via `AppProviders.tsx`. Surfaces on first visit with three options: "Accept All", "Reject Non-Essential", and "Customize Preferences".
- **Granular Cookie Categorization**:
  - **Strictly Necessary**: Session JWT (`token`, `access_token`), load-balancer cookies, CSRF protection, and customer queue recovery tokens (`qmova_session`). Cannot be disabled.
  - **Functional / Preferences**: Theme selection (`dark` vs `light`), language preference, and table view filters.
  - **Performance / Analytics**: Telemetry, Sentry error monitoring, and page load telemetry.
  - **Marketing**: Conversion tracking pixels and referral attribution.

---

## 3. Backend Integration & Preference Persistence
- **API Endpoint**: `POST /policies/cookie-preferences` (`backend/src/policies/policies.controller.ts`).
- **Database Model**: Stored in PostgreSQL `CookiePreference` table:
  - `userId`: Nullable link to authenticated `User(id)`.
  - `anonymousId`: Client-generated UUID stored in localStorage for unauthenticated visitors.
  - `preferences`: JSON payload (`{ necessary: true, analytics: false, marketing: false, functional: true }`).
  - `ipAddress`: Captured client IP address.
  - `userAgent`: Client device signature.
  - `createdAt` / `updatedAt`: Timestamps of consent modification.

---

## 4. Architecture & System Design
- **ePrivacy Directive & GDPR e-Privacy Alignment**: Blocks non-essential tracking scripts until affirmative user opt-in is recorded.
- **Anonymous to Authenticated Re-linking**: When an anonymous visitor registers or logs in, the backend links their historical `anonymousId` cookie preference record to their permanent `userId`.

---

## 5. Business Abstraction & Value Proposition
- **Global Compliance**: Protects international operations from EU GDPR fines and UK Information Commissioner's Office (ICO) cookie enforcement penalties.
- **User Agency**: Demonstrates respect for customer privacy, establishing brand integrity compared to competitors utilizing intrusive covert tracking.

