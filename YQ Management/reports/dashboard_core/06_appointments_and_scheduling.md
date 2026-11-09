# Appointments & Scheduling Calendar (`/dashboard/appointments`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/appointments/index.tsx`
- **Route Path**: `/dashboard/appointments`
- **Target Audience**: Booking coordinators, clinic secretaries, salon schedulers, and specialists managing forward-looking calendar agendas.
- **Key Dependencies**: React (`useState`, `useMemo`), `AdminLayout`, TanStack Query, `MatrixCalendar`, `ScheduleSidebar`, `VisitDrawer`, `VisitDossierPanel`, `CreateAppointmentModal`, `date-fns`, `useLocation`, `useAuth`, Lucide Icons.

---

## 2. Frontend Architecture & Calendar Matrix
- **Tri-View Calendar Engine (`CalendarView`)**:
  - `day`: Hour-by-hour grid showing provider resource columns and overlapping slot allocations.
  - `week`: 7-day multi-day matrix for weekly staff capacity planning.
  - `month`: High-level aggregate overview of monthly booking density.
- **Visual Status Color Palette**:
  - `SCHEDULED`: Sky blue border (`bg-sky-50 text-sky-700`).
  - `CONFIRMED`: Indigo border (`bg-indigo-50 text-indigo-700`).
  - `IN_PROGRESS` / `SERVING`: Amber alert (`bg-amber-50 text-amber-700`).
  - `COMPLETED`: Zinc muted (`bg-zinc-100 text-zinc-500`).
  - `CANCELLED`: Dashed border (`bg-zinc-50 text-zinc-400 border-dashed`).
  - `PENDING_APPROVAL`: Rose alert (`bg-rose-50 text-rose-700`).
- **Interactive Slide-Over Dossier (`VisitDossierPanel`)**:
  Clicking any calendar block opens a comprehensive side drawer revealing customer phone, intake form responses, booking notes, payment status, and history.

---

## 3. Backend Integration & Scheduling Pipeline
- **API Endpoints**:
  - `GET /appointments?locationId=...&start=...&end=...` (`backend/src/appointment/appointment.controller.ts`).
  - `POST /appointments` (Creates manual booking).
  - `PATCH /appointments/:id` (Reschedules or reassigns provider).
  - `POST /appointments/:id/approve` & `/reject`.
  - `GET /integrations/google/sync` (Google Calendar bidirectional synchronization).
- **Automated Check-in Reminder Integration**:
  Appointments created here are monitored by the backend cron `handleCheckinReminders` (`TasksService`), which sends automated WhatsApp reminder notifications at T-15 minutes and T-0 arrival.

---

## 4. Architecture & System Design
- **Unified Visit/Appointment Entity Model**: When a scheduled customer arrives and checks in via QR or reception, their `Appointment` status transitions to `CHECKED_IN`, automatically instantiating a live `Visit` in the queue without duplicate data entry.
- **Google Calendar 2-Way Sync**: Integrates with Google Calendar API, synchronizing doctor/stylist personal schedules to block off conflicting queue slots automatically.

---

## 5. Business Abstraction & Value Proposition
- **Hybrid Queue & Appointment Harmony**: Solves the universal business challenge where scheduled patients clash with walk-in arrivals. The calendar visualizes both in a single timeline.
- **No-Show Reduction**: Automated multi-stage reminders sent via WhatsApp slash appointment no-show rates by up to 60%, reclaiming lost provider hours.

