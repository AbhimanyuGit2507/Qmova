# Reception Service Desk (`/dashboard/service-desk`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/service-desk.tsx` (4,407 lines)
- **Route Path**: `/dashboard/service-desk`
- **Target Audience**: Front desk receptionists, clinic coordinators, triage nurses, hostesses, and general floor supervisors.
- **Key Dependencies**: React (`useState`, `useEffect`, `useRef`, `useMemo`), Next.js `useRouter`, TanStack Query (`useQuery`, `useMutation`, `useQueryClient`), Framer Motion, `AdminLayout`, `useLocation`, `useIndustry`, `usePlan`, Sonner `toast`, `CreateVisitModal`, `ScannerModal`, `WhatsAppChatPanel`, `RecordPaymentModal`, `CompleteStageModal`, `CheckoutBillModal`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Command Center Layout**:
  - **Location Switcher**: Integrated with `useLocation()`, filtering active floor telemetry by branch location (`activeLocationId`).
  - **Dynamic Queue Columns**: Displays live customer queues categorized by status: `WAITING`, `CALLED`, `IN_SERVICE`, and `SCHEDULED (Today)`.
  - **Customer Ticket Card**: Displays token number (`displayId`), customer name, phone number, service name, calculated wait time (EWT), accompanying guests counter, VIP status badges, and source indicators (`WALK_IN`, `QR`, `WHATSAPP`, `APPOINTMENT`).
- **Interactive Action Palette**:
  - **Call Customer (`visit:call`)**: Prominently highlights the ticket, updates TV displays in real time, and triggers synthetic voice/chime audio.
  - **Start Service (`visit:start`)**: Transitions ticket to `IN_SERVICE`, tracks service start time, and alerts assigned provider.
  - **Complete Stage / Transfer**: Opens `CompleteStageModal` to advance customer to the next journey step (e.g. Triage → Doctor Consultation) or `CheckoutBillModal`.
  - **Cancellation with Reason Capture**: Supports standardized operational cancellation codes (`CUSTOMER_NO_SHOW`, `CUSTOMER_REQUEST`, `EMERGENCY_UNAVAILABLE`, `DUPLICATE_BOOKING`, `FACILITY_ISSUE`, `OTHER`).
  - **In-Queue Payment Recording**: Invokes `RecordPaymentModal` to log Cash, Card Terminal, or EFT settlements.
  - **Barcode Scanner**: Launches `ScannerModal` utilizing device camera to instantly check in customers presenting mobile QR tokens.
  - **Integrated WhatsApp Chat Drawer**: Opens `WhatsAppChatPanel` allowing receptionists to text visitors directly without leaving their terminal.

---

## 3. Backend Integration & Data Flow
- **API Endpoints**:
  - `GET /visits?locationId=...&status=WAITING,CALLED,IN_SERVICE` (`backend/src/visit/visit.controller.ts`).
  - `POST /visits/staff-walkin` (Manual intake registration).
  - `POST /visits/:id/call` (Token calling).
  - `POST /visits/:id/start` (Service commencement).
  - `POST /visits/:id/complete` (Visit finalization).
  - `POST /visits/:id/cancel` (Cancellation with structured reason).
  - `POST /tenant-payments/record-manual` (POS counter payments).
- **Socket.io Real-Time Synchronization**:
  Listens on `location_{locationId}` room for `visit:created`, `visit:called`, and `visit:completed` events. Automatically invalidates React Query cache (`['visits', activeLocationId]`), maintaining zero-refresh synchronization across multiple front-desk terminals.

---

## 4. Architecture & System Design
- **Industry Adaptation (`useIndustry`)**: Dynamically alters UI labels, status chips, and action vocabulary based on tenant vertical (e.g., "Patients" for Clinics, "Guests" for Hospitality, "Clients" for Salons).
- **Quota Warnings & Plan Guards**: Integrated with `usePlan()` to alert staff when approaching monthly visit limits or displaying `QuotaWarningBanner`.

---

## 5. Business Abstraction & Value Proposition
- **Front-Desk Automation**: Replaces chaotic manual clipboards, paper tokens, and shouting names across crowded lobbies with silent, synchronized digital workflow management.
- **Operational Throughput Maximization**: Eliminates idle service capacity by packing walk-in arrivals into appointment gaps, directly expanding daily gross revenue by 20–35%.

