# Staff Service Counter Workstation (`/dashboard/my-desk`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/my-desk.tsx`
- **Supporting Components**:
  - Context: `frontend/src/components/my-desk/MyDeskContext.tsx`
  - Widget Registry: `frontend/src/components/my-desk/WidgetRegistry.tsx`
  - Widgets: `CurrentTicketWidget`, `CustomerHistoryWidget`, `CustomFormWidget`, `QueueGridWidget`, `ScheduleWidget`, `ClinicalNotesWidget`, `PrescriptionWidget`.
- **Route Path**: `/dashboard/my-desk`
- **Target Audience**: Service providers (doctors, dentists, optometrists, hair stylists, bank tellers, vehicle mechanics) operating at an assigned physical counter, desk, or consultation room.
- **Key Dependencies**: React (`useMemo`, `useState`), `AdminLayout`, `useAuth`, `MyDeskProvider`, `renderWidget`, TanStack Query (`useQuery`), Lucide Icons (`RefreshCw`, `LayoutDashboard`).

---

## 2. Frontend Architecture & Modular Widget Canvas
- **Dynamic Station Blueprinting Engine**:
  Instead of a static hardcoded screen, `MyDesk` implements a dynamic 2D grid canvas driven by the tenant's `staffViewLayout` JSON configuration:
  ```typescript
  interface DeskWidgetConfig {
    id: string;
    type: string;
    position?: { colSpan?: number; rowSpan?: number };
  }
  ```
- **Hierarchical Layout Resolution**:
  1. **User/Staff Specific Assignment**: Resolves `svl.assignments[staffOrUserId]`, loading the custom template assigned to that doctor or counter.
  2. **V2 Global Templates**: Allows staff to switch between multiple station templates via a top-right dropdown (e.g., "Doctor Consultation Room" vs. "Procedure Room").
  3. **V1 Legacy Flat Array**: Backwards compatibility for older tenant layouts.
  4. **Built-in Default Grid**:
     - `CurrentTicketWidget` (colSpan: 1, rowSpan: 2): Active customer calling station.
     - `CustomerHistoryWidget` (colSpan: 1, rowSpan: 1): Chronological visit history.
     - `ScheduleWidget` (colSpan: 1, rowSpan: 1): Today's appointment agenda.
     - `QueueGridWidget` (colSpan: 2, rowSpan: 1): Live waiting room queue overview.

---

## 3. Widget Registry & Vertical Specialization
- **`CurrentTicketWidget`**: Displays active token in service, counter number, customer details, elapsed service timer, one-click stage progression ("Next Stage"), and audio recall.
- **`CustomerHistoryWidget`**: Drills into past visits, total spend, no-show frequency, VIP notes, and customer ratings.
- **`ClinicalNotesWidget`**: Encrypted SOAP note entry interface for medical consultations with instant auto-save.
- **`PrescriptionWidget`**: Medication dosage generator with PDF fulfillment export.
- **`QueueGridWidget`**: Visual list of upcoming customers waiting for this specific operator's services.

---

## 4. Backend Integration & Service State Machine
- **API Endpoints**:
  - `GET /tenant/me` (Fetches `staffViewLayout` and template configuration).
  - `GET /visits?staffId=...` (Scoped to current authenticated operator).
  - `POST /visits/:id/call`, `/start`, `/complete`.
  - `POST /clinical-notes` & `POST /prescriptions`.
- **Real-Time Context (`MyDeskContext`)**:
  Connects to Socket.io private staff channel (`user_{userId}`). When reception transfers a customer to this desk, the widget emits an audible alert and highlights the new ticket immediately.

---

## 5. Business Abstraction & Value Proposition
- **High-Productivity Operator Focus**: Shields frontline specialists from administrative overhead. A doctor sees their next patient, medical history, and clinical note forms in a single unified cockpit without navigating complex EHR menus.
- **Cross-Vertical Versatility**: The same underlying codebase powers a Michelin-star restaurant kitchen (KDS view), an automotive repair bay, a high-volume dental surgery, and a corporate bank teller window simply by altering widget JSON configurations.

