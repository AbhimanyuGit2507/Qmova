# Security & Compliance Policy (`/security`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/security/index.tsx`
  - MDX Content: `frontend/content/docs/legal/security-policy.mdx`
  - System Security Controls: `backend/src/main.ts`, `backend/src/common/filters/all-exceptions.filter.ts`
- **Route Path**: `/security`
- **Target Audience**: Enterprise Chief Information Security Officers (CISOs), hospital compliance officers, IT directors, and third-party security auditors.
- **Key Dependencies**: React, Next.js (`GetStaticProps`), `next-mdx-remote`, `MarketingLayout`, `MDXComponents`, `lib/docs.ts`.

---

## 2. Frontend Architecture & Security Disclosures
- **MDX Presentation**: Rendered with high-contrast typography, code formatting blocks, and navigation breadcrumbs via `MarketingLayout`.
- **Primary Security Architecture Disclosures**:
  1. **Transport Layer Security**: Mandatory HTTPS / TLS 1.3 encryption across all client, operator, kiosk, and digital signage endpoints with automated HSTS header enforcement.
  2. **Data-at-Rest Encryption**: PostgreSQL volume encryption utilizing AES-256 with secure managed key rotation.
  3. **Application Layer Defenses**: Helmet HTTP security headers (CSP, X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff), NestJS ValidationPipe with payload whitelisting, and Redis IP rate limiting.
  4. **Multi-Tenant Logical Segregation**: Strict isolation enforced via foreign keys, database row scoping, and edge subdomain rewriting.
  5. **Responsible Vulnerability Disclosure**: Dedicated reporting channel (`security@qmova.com`), PGP encryption keys, and safe harbor commitments for ethical security researchers.

---

## 3. Backend Implementation & Technical Controls
- **Helmet Headers Configuration (`backend/src/main.ts`)**:
  ```typescript
  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }));
  ```
- **Throttler Defense**: `ThrottlerGuard` backed by Redis counters prevents automated brute-force attacks on `/auth/login` and `/token/request-otp`.
- **Query Parameterization**: 100% of database interactions are executed via Prisma ORM client with prepared statements, eliminating SQL Injection vulnerabilities.

---

## 4. Architecture & System Design
- **Defense-in-Depth Principle**: Security controls exist at the edge proxy (Caddy/Nginx), application middleware (`RequestIdMiddleware`, `TenantContextMiddleware`), framework guards (`AuthGuard`, `RolesGuard`), and database constraints.
- **Automated Exception Scrubbing**: The global `AllExceptionsFilter` strips internal database stack traces and query strings from responses sent to clients, preventing information leakage.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Deal Unblocker**: Enterprise healthcare networks and corporate banking chains mandate rigorous security documentation and vendor questionnaires before initiating proof-of-concept trials.
- **Liability Minimization**: A formal security policy and documented vulnerability management protocol minimize regulatory fines and commercial liability in the event of platform scrutiny.

