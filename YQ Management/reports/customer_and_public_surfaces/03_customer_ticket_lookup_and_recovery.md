# Customer Ticket Lookup & Token Recovery (`/customer/lookup`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/customer/lookup.tsx`
- **Route Path**: `/customer/lookup`
- **Target Audience**: Customers who accidentally closed their mobile browser tab, lost their SMS magic link, or switched devices and need to recover their active queue ticket.
- **Key Dependencies**: React (`useState`, `useEffect`, `useCallback`), Next.js `useRouter`, `date-fns`, `fetchApi`, Lucide Icons (`MapPin`, `Clock`, `XCircle`, `Search`, `AlertCircle`, `Phone`, `ArrowRight`), `ConfirmModal`, Sonner `toast`.

---

## 2. Frontend Architecture & Self-Service Search
- **Search Flow**:
  - Customer inputs their telephone number into an internationalized phone input.
  - Clicking "Find My Tickets" invokes `handleSearch(phoneNumber)`.
  - Automatic URL Query Trigger: If the customer lands via a deep link containing `?phone=+27821234567`, the component executes the lookup automatically on mount.
- **Active Tickets Results Ledger**:
  - Displays all active (non-completed) visits associated with that phone number across all tenant locations.
  - Card details: Location name, service title, token ID, current status (`WAITING`, `CALLED`, `SCHEDULED`), and formatted arrival time.
  - Action Buttons:
    1. **"Open Ticket"**: Direct navigation back to the live wait screen (`/customer/status/[accessToken]`).
    2. **"Cancel Ticket"**: Opens `ConfirmModal` allowing customer to cancel unnecessary duplicate visits.
- **Empty State & Guidance**:
  If no active visits are found, renders a clear notice ("No active tickets found for this number") with a direct link to join the queue or book a new appointment.

---

## 3. Backend Integration & OTP Security Flow
- **API Endpoints**:
  - `GET /public-visit/by-phone?phone=...` (`backend/src/visit/public-visit.controller.ts`).
  - `POST /public-visit/request-recovery-otp` (Optional elevated security: sends WhatsApp OTP before revealing tokens).
  - `POST /public-visit/recover` (Validates OTP, sets HTTP-only `qmova_session` cookie).
- **Backend Query Execution**:
  Queries PostgreSQL `Visit` table filtering by customer phone variant:
  ```typescript
  where: {
    customer: { phone: { in: phoneVariants } },
    currentState: { notIn: ['COMPLETED', 'NO_SHOW', 'CANCELLED'] },
  }
  ```

---

## 4. Architecture & System Design
- **Phone Number Normalization (`getPhoneVariants`)**: Backend intelligently accounts for leading zero formatting vs. international country codes (e.g., `0821234567` vs. `+27821234567`), matching records regardless of how the customer originally typed their number.
- **Privacy Shield**: Public results only return active token IDs, service names, and locations; private medical notes, billing details, and home addresses are never exposed via phone lookup.

---

## 5. Business Abstraction & Value Proposition
- **Self-Serve Friction Elimination**: Solves the common operational friction where a customer accidentally clears their browser history or restarts their phone and panic-approaches the reception counter. They can recover their live ticket in 5 seconds.
- **Zero Front-Desk Workload**: Front-desk staff never need to manually search or reprint lost tickets.

