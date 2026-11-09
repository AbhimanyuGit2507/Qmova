# Landing Page (`/`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/index.tsx`
- **Route Path**: `/` (Apex / Root Landing Page)
- **Target Audience**: Prospective business owners, clinic directors, salon owners, operations managers, and general public visitors.
- **Key Dependencies**: React, Next.js (`Link`, `Head`, `Image`), Framer Motion (`motion`), Lucide Icons (`MessageSquare`, `CalendarDays`, `Ticket`, `MonitorSmartphone`, `ArrowRight`, `CheckCircle2`), `useAuth` hook, `Logo` component, `Footer` component.

---

## 2. Frontend Architecture & UI/UX Audit
- **Visual Design System**: Dark aesthetic (`#09090b`), Tailwind CSS typography tokens, glassmorphism navigation bar (`backdrop-blur-xl bg-black/20 border-b border-white/5`), radial gradient background glows, and interactive hover transformations (`group-hover:scale-105`).
- **Interactive State & Logic**:
  - `useAuth()` hook evaluates `user` state. If authenticated, navigation renders a single primary `Dashboard` pill button (`/dashboard`); if unauthenticated, it renders `Sign In` (`/login`) and `Sign Up` (`/register`).
  - Dynamic avatar social proof strip displaying customer adoption indicators.
  - Interactive story cards highlighting the 4 core product capabilities:
    1. **WhatsApp Chatbot**: Direct queue entry and 5-minute automated arrival warnings.
    2. **Custom Booking Page**: Frictionless calendar slot reservations.
    3. **Virtual Tickets**: QR-code triggered digital tokens with live ETA.
    4. **Web-Based Management**: Browser-native operator console requiring no proprietary hardware.
- **Responsive Adaptations**: Mobile hamburger/column layout collapsing smoothly to single-column flex layouts on mobile devices (`< 768px`) with touch-friendly tap targets (`h-[50px] lg:h-[54px]`).

---

## 3. Backend Integration & Data Flow
- **Data Fetching Strategy**: Primarily static rendering (SSG) with client-side authentication hydration.
- **Backend Touchpoints**:
  - Checks session validity via `/auth/me` through `AuthProvider`.
  - Links directly to tenant registration flow (`/register`) which invokes `POST /auth/register` and `/onboarding/check-plan-fit`.

---

## 4. Architecture & System Design
- **Subdomain Middleware Bypass**: The Next.js edge middleware checks `url.pathname === '/'`. When requested on the apex domain (`qmova.com`), it serves this landing page. If requested on a tenant subdomain (`acme.qmova.com/`), middleware transparently rewrites the request to `/_tenant/[subdomain]/index.tsx`, isolating tenant customers from platform marketing.
- **Performance Optimization**: Above-the-fold hero image (`/images/no-bg/maya-hero-section.png`) is loaded with `priority` attribute, minimizing Largest Contentful Paint (LCP). Secondary section images utilize native lazy loading.

---

## 5. Business Abstraction & Value Proposition
- **Operational Problem Solved**: Communicates the shift from high-friction physical waiting rooms to digital, wait-free customer flows.
- **Primary Conversion Funnel**: Drives organic and paid traffic to high-intent conversion actions (`Start Your Free Trial` -> `/register` and `Explore Features` -> `#features`).
- **Target Persona**: Business owners seeking to eliminate chaotic queues, lower walk-out rates, and modernize their front desk without purchasing expensive pagers or proprietary hardware.

