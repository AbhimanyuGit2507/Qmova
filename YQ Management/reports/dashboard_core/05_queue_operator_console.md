# Queue Operator Console (`/dashboard/queues/[id]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/queues/[id]/index.tsx` (702 lines)
- **Route Path**: `/dashboard/queues/[id]`
- **Target Audience**: Dedicated queue operators, counter clerks, and intake specialists focused entirely on processing a single high-volume queue.
- **Key Dependencies**: React (`useState`, `useEffect`, `useCallback`), Next.js `useRouter`, TanStack Query, `AdminLayout`, `useSocket`, Sonner `toast`, Lucide Icons, `ConfirmModal`.

---

## 2. Frontend Architecture & High-Speed Operator UI
- **Single-Queue Focus**:
  Designed for maximum operational throughput with large typography, prominent calling buttons, and minimal visual noise.
- **Three-Panel Operator Layout**:
  1. **Currently Serving Hero Panel**: Shows the ticket currently at this counter (Token ID, Customer Name, elapsed timer in seconds, "Recall Audio", and "Finish / Complete").
  2. **Up Next Waiting List**: Ordered chronological list of waiting tokens with customer names, phone numbers, and arrival wait times.
  3. **Operational Telemetry Bar**: Shows total served today, average service duration, and current queue depth.
- **Keyboard Shortcuts**:
  Equipped with keyboard event listeners:
  - `Space` / `Enter`: Call Next Customer.
  - `Esc`: Recall Current Customer.
  - `C`: Mark Completed.

---

## 3. Backend Integration & Concurrency Safety
- **API Endpoints**:
  - `GET /queue/:id` (`backend/src/queue/queue.controller.ts`).
  - `POST /visits/:id/call` (Advances next waiting token to `CALLED`).
  - `POST /visits/:id/complete` (Concludes service).
  - `POST /visits/:id/no-show` (Marks as no-show after repeated calls).
- **Optimistic Locking & Race-Condition Prevention**:
  When two operators click "Call Next" simultaneously on the same queue, the backend atomic transaction (`prisma.$transaction`) guarantees that only one operator receives the next ticket, while the other receives the subsequent ticket without collisions.

---

## 4. Architecture & System Design
- **Socket.io Channel Binding**: Subscribes to `queue_{queueId}` room. Emitted events update local state instantly, keeping waiting counts synchronized across multi-operator counters.
- **Audio Synthesis Trigger**: Invokes Web Audio API chimes locally while triggering remote TV announcements via backend websocket emissions.

---

## 5. Business Abstraction & Value Proposition
- **High-Volume Counter Velocity**: Streamlined for high-throughput environments (passport offices, retail returns counters, outpatient blood draw labs) where seconds shaved per transaction compound into hundreds of hours saved annually.
- **No-Show Mitigation**: Standardized call and recall cycles eliminate ambiguity before a customer is formally recorded as a no-show.

