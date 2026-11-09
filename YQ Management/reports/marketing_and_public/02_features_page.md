# Features Page (`/features`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/features/index.tsx`
- **Route Path**: `/features`
- **Target Audience**: Mid-market operations leaders, clinic managers, retail system evaluators looking for granular technical and operational capability validation.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), Framer Motion, Lucide Icons (`Activity`, `CalendarDays`, `MessageSquare`, `Bell`, `Scan`, `Ticket`, `Star`), `useAuth` hook, `Logo`, `Footer`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Layout & Narrative Structure**: Hero section framing the "Operating System for Waiting Rooms", followed by categorized deep-dive sections with anchor links (`#whatsapp`, `#routing`, `#status`, `#mobile`):
  1. **Omnichannel Customer Entry**: Web booking, kiosk tablet intake, QR check-in codes, and conversational WhatsApp bots.
  2. **Intelligent Front Desk Orchestration**: Dynamic slotting of walk-ins between scheduled appointments to eliminate idle provider capacity.
  3. **Multi-Stage Service Journeys**: Progression of customers through sequential rooms, diagnostics, and checkpoints.
  4. **Integrated Payments & Billing**: In-queue deposits, Paystack South African bank payouts, and Stripe credit card processing.
  5. **Enterprise Analytics & SLA Alerts**: Real-time wait tracking, staff service durations, and threshold breach SMS/WhatsApp escalations.
- **Micro-Interactions**: Animated feature badge glows, staggered viewport-triggered entrance animations via Framer Motion, and high-contrast dark mode palette.

---

## 3. Backend Integration & Service Matrix
- **Referenced Backend Endpoints**:
  - `GET /public-visit/stream` (Customer SSE wait stream capability demonstration).
  - `POST /visits/staff-walkin` and `POST /visits/:id/call` (Calling station operations).
  - `POST /tenant-payments/connect-paystack` & `POST /tenant-payments/connect-stripe` (Embedded payments).
  - `GET /sla-policies` (SLA threshold monitoring).

---

## 4. Architecture & System Design
- **Component Reusability**: Shares navigation, header token schemas, and footer layouts with the global marketing site.
- **SEO & Discoverability**: Semantic HTML5 sectioning (`<section>`, `<article>`, `<h1>`-`<h3>`), structured meta tags, OpenGraph descriptions, and fast server-side render delivery.

---

## 5. Business Abstraction & Value Proposition
- **Sales Enablement**: Educates technical and operations buyers on Qmova's unique capabilities compared to generic booking calendar software (Calendly) or basic hardware token dispensers.
- **ROI Framing**: Highlights throughput gains (serving 25-40% more customers daily by packing appointment gaps), reduction of front-desk overhead, and prevention of walkouts.

