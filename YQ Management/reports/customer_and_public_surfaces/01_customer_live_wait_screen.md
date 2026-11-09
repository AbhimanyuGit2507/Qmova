# Customer Live Wait Screen (`/customer/status/[id]`, `/public/ticket/[id]`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/customer/status/[id].tsx` (Primary dynamic wait screen)
  - `frontend/src/pages/public/ticket/[id].tsx` (Public ticket view alias)
- **Route Paths**: `/customer/status/[id]`, `/public/ticket/[id]`
- **Target Audience**: Waiting customers, clinic patients, restaurant guests, and service clients tracking their real-time queue position on their personal smartphones.
- **Key Dependencies**: React (`useState`, `useEffect`, `useRef`, `useCallback`), Next.js (`useRouter`, `Head`, `Image`, `Link`), TanStack Query, `io` (Socket.io client), QRCodeSVG, Lucide Icons (30+ icons), `PaymentStep`, `ConfirmModal`, `downloadInvoicePdf`, `downloadIcsCalendar`.

---

## 2. Frontend Architecture & Live Mobile Experience
- **Zero-App Progressive Mobile Web**:
  - Accessible via magic link without requiring account creation, login, or app store downloads.
  - Automatically adapts to system light/dark mode with manual override (`Sun` / `Moon`).
  - Offline resilience: If network drops, caches last known state in memory and displays a subtle connection retry spinner.
- **Real-Time Telemetry & Progress Display**:
  - Large, high-contrast token identifier card (e.g. `A042`).
  - **Live Position Counter**: Displays exact position in line (e.g. `2nd in line`).
  - **Estimated Wait Time (EWT)**: Dynamic countdown in minutes calculated by backend Exponential Moving Average (EMA) algorithm.
  - **Status Transitions**:
    - `WAITING`: Muted waiting progress ring.
    - `CALLED`: High-visibility flashing banner with counter number (e.g. "Please proceed to Counter 3") accompanied by device vibration (`navigator.vibrate([200, 100, 200])`).
    - `IN_SERVICE`: "Currently being served by Dr. Smith".
    - `COMPLETED`: Shows CSAT rating prompt (1–5 stars) and tax invoice download button.
- **Multi-Step Service Journey Progression (`TemplateStep`)**:
  - If the service utilizes a multi-step flow, displays horizontal progress dots and upcoming stage instructions (e.g., "Step 2 of 4: Blood Test in Room 104, 1st Floor East Wing").
  - Optional stage skipping (`skipStepPublic`) and dynamic intake form submission (`submitFormPublic`).
- **In-Queue Actions**:
  - **Digital Ordering (`ShoppingBag`)**: Restaurant guests can select menu items while waiting in line, pre-calculating total bill.
  - **Embedded Payments (`PaymentStep`)**: Settle consultation fees or service deposits via Stripe / Paystack directly from the phone.
  - **Calendar Export (`CalendarPlus`)**: Generates and downloads standard `.ics` calendar invitation (`downloadIcsCalendar`).
  - **Self-Cancellation Modal**: Allows customers to voluntarily exit the queue if their schedule changes, capturing cancellation reason.

---

## 3. Backend Integration & Real-Time Sync Rails
- **API Endpoints**:
  - `GET /public-visit/:accessToken` (`backend/src/visit/public-visit.controller.ts`).
  - `GET /public-visit/stream?tokens=...` (Server-Sent Events real-time stream).
  - `POST /public-visit/:accessToken/cancel`.
  - `POST /public-visit/:accessToken/rate` (CSAT feedback).
  - `POST /public-visit/:accessToken/skip-step/:stepId`.
  - `POST /public-visit/:accessToken/submit-form/:stepId`.
  - `POST /public-visit/:accessToken/submit-order/:stepId`.
- **Dual Reconnection Architecture**:
  Initiates a Server-Sent Events stream (`EventSource`) with periodic 15-second heartbeat pings. Simultaneously establishes a Socket.io listener for immediate high-priority call alerts (`visit:called`), ensuring sub-second notification delivery even on congested mobile networks.

---

## 4. Architecture & System Design
- **Security & Privacy Boundary**:
  - The endpoint is authorized exclusively by the random UUIDv4 `accessToken`.
  - Never leaks sensitive data: hides internal staff notes, other customers' names, and financial ledger data.
  - Expired tokens (`COMPLETED` > 7 days or `CANCELLED`) render a clean expired visit message.

---

## 5. Business Abstraction & Value Proposition
- **Physical Lobby Liberation**: Eliminates waiting room claustrophobia. Customers are free to wait in nearby coffee shops, outdoor gardens, or their parked cars while retaining absolute confidence that they will not miss their turn.
- **Customer Anxiety Reduction**: Transparency eliminates perceived wait time frustration. Knowing exactly how many people are ahead and viewing dynamic countdown timers boosts customer satisfaction scores by over 40%.

