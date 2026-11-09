# About Us Page (`/about`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/about/index.tsx`
- **Route Path**: `/about`
- **Target Audience**: Prospective clients, partners, investors, and prospective employees seeking to understand the company's background, ethos, mission, and leadership.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), Framer Motion, `useAuth`, `Logo`, `Footer`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Narrative Flow**:
  - Hero header articulating company mission: "Eliminating waiting room anxiety through algorithmic queue management."
  - Origin Story: Details why traditional physical waiting lines fail human psychology and how real-time mobile queues restore dignity, transparency, and operational predictability.
  - Core Pillars: Engineering reliability, extreme simplicity for non-technical staff, and ethical data privacy.
- **Design Tokens**: Rose-tinted background ambient blur (`bg-rose-500/10 blur-[120px]`), high-contrast typography, and full responsiveness across mobile and desktop viewports.

---

## 3. Backend Integration & Data Flow
- **Nature of Surface**: Pure client/static marketing surface with session hydration from `useAuth` to toggle header navigation states.
- **Zero API Dependency**: Does not require runtime database calls, ensuring 100% uptime even during database maintenance windows.

---

## 4. Architecture & System Design
- **Static Export Capability**: Pure static page rendered at build time via Next.js SSG.
- **Accessibility & Contrast**: Conforms to WCAG AA color contrast guidelines on dark backgrounds (`#09090b` base with `#ffffff` text and `zinc-400` body copy).

---

## 5. Business Abstraction & Value Proposition
- **Brand Trust & Legitimacy**: B2B enterprise procurement teams (especially hospital executives and bank operations directors) inspect company credentials, operational ethos, and product stability before approving software trials.
- **Strategic Differentiation**: Contrasts Qmova's algorithmic queue-scheduling blend against legacy single-purpose paper ticket systems and expensive hardware vendors.

