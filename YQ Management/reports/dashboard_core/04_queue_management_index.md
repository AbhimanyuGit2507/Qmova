# Queue Management Directory (`/dashboard/queues`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/queues/index.tsx`
- **Route Path**: `/dashboard/queues`
- **Target Audience**: Branch managers, operations directors, and floor coordinators managing multiple waiting lines.
- **Key Dependencies**: React (`useState`, `useMemo`), Next.js (`useRouter`, `Link`), TanStack Query, `AdminLayout`, `useLocation`, `useAuth`, `usePlan`, Lucide Icons (`Plus`, `ListOrdered`, `Settings2`, `PlayCircle`, `PauseCircle`, `CheckCircle2`, `Printer`), `ServiceModal`, `PrintQRModal`, `QuotaExhaustedModal`.

---

## 2. Frontend Architecture & Queue Operations
- **Queue Directory Cards**:
  - Displays each queue's status badge: `ACTIVE` (Emerald), `PAUSED` (Amber), `CLOSED` (Zinc).
  - Displays token prefix (e.g. `DOC`, `A`, `VIP`), assigned branch location name, and linked services list.
  - Active metrics: Real-time count of waiting customers and average wait duration.
- **Operational Controls**:
  - **Pause / Resume Queue**: One-click mutation to temporarily suspend new ticket intake during lobby congestion or emergencies (`PATCH /queue/:id/status`).
  - **Print QR Signage Modal (`PrintQRModal`)**: Generates printable PDF counter standees and entrance posters with embedded QR codes, location branding, and customer instructions.
  - **Launch Operator Console**: Direct button routing to `/dashboard/queues/[id]`.
- **RBAC & Manager Scope Filtering**:
  If the logged-in user holds the role `MANAGER`, queues are filtered automatically against `user.allowedServiceIds`, ensuring regional managers only view queues they are authorized to supervise.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /queue?locationId=...` (`backend/src/queue/queue.controller.ts`).
  - `POST /queue` (Creates new queue with name, prefix, maxCapacity, and service linkages).
  - `PATCH /queue/:id/status` (Toggles operating state).
- **Quota Enforcement (`usePlan`)**:
  Before opening `isModalOpen` to create an additional queue, verifies `plan.limits.maxQueues`. If exceeded, blocks creation and triggers `QuotaExhaustedModal` prompting a plan tier upgrade.

---

## 4. Architecture & System Design
- **Location-Aware Query Invalidation**: Query keys are partitioned by `['queues', activeLocationId]`. Switching branches in the global header updates the list instantly without page reloads.
- **Cascade Deletion Shield**: Backend prevents deleting queues with active waiting tickets, enforcing operational continuity.

---

## 5. Business Abstraction & Value Proposition
- **Floor Congestion Regulation**: Gives branch managers emergency circuit-breakers to halt walk-in intake when unexpected staff shortages or emergencies occur.
- **Physical-to-Digital Bridge**: The integrated QR print engine allows any business to convert a physical doorway into an automated digital check-in station in under 60 seconds.

