# Self-Service Physical Tablet Kiosk (`/kiosk/[tenantId]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/kiosk/[tenantId].tsx`
- **Route Path**: `/kiosk/[tenantId]`
- **Target Audience**: Physical walk-in customers arriving at a store entrance, clinic lobby, or branch reception who prefer or need to check in via an on-site touch tablet.
- **Key Dependencies**: React (`useState`), Next.js `useRouter`, `Head`, `lib/api`.

---

## 2. Frontend Architecture & Touch Kiosk Interface
- **Ergonomic Touch Design**:
  - Full-screen kiosk layout optimized for 10" to 15" Android and iPad touchscreens mounted on floor pedestals or reception counters.
  - Large, high-contrast numerical keypad (ATM / POS style) allowing elderly or non-tech-savvy visitors to easily enter their mobile telephone number with their fingers.
  - One-touch backspace and clear controls.
- **Two-Step Walk-In Check-In Flow**:
  1. **Keypad Entry**: Customer enters their telephone number (capped at 15 digits).
  2. **Submission & Confirmation**: Submitting triggers instant queue join. The screen switches to a high-contrast green confirmation card ("You're in line! Please check your WhatsApp for your digital token and live updates.").
  3. **Auto-Reset Timer**: After 5 seconds of displaying confirmation, automatically clears the input state and resets the keypad for the next waiting customer.

---

## 3. Backend Integration & Direct Queue Ingestion
- **API Endpoints**:
  - `POST /queue/join` (or `POST /visits/staff-walkin`).
  - Payload: `{ tenantId, customerName: 'Walk-in', phone }`.
- **Backend Ingestion Sequence**:
  1. Looks up default queue and service for the tenant/location.
  2. Generates atomic token number via Redis sequence counter (`generateNextToken`).
  3. Creates `Customer` and `Visit` records in PostgreSQL.
  4. Dispatches instant WhatsApp confirmation message containing the customer's live tracking URL (`/customer/status/[accessToken]`).

---

## 4. Architecture & System Design
- **Kiosk Browser MDM Compatibility**: Engineered to operate cleanly inside locked Kiosk Browsers (Fully Kiosk, Apple Guided Access) without address bar clutter, context menus, or navigation gestures.
- **Fail-Safe Client Handling**: Network timeouts or server errors display a polite "Please approach the reception counter" banner rather than raw code errors.

---

## 5. Business Abstraction & Value Proposition
- **Reception Deflection & Labor Savings**: Absorbs 50–70% of routine walk-in traffic in high-volume clinics and civic service centers. Customers self-register without receptionist assistance.
- **Omnichannel Bridge**: Bridges physical on-premises entry with digital mobile tracking. The customer types their number on the wall tablet, and within 2 seconds their personal phone buzzes with their digital ticket.

