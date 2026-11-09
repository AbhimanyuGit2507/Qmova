# Backend Module Audit: Appointments & Calendar Synchronization

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/appointment/` (`appointment.controller.ts`, `appointment.service.ts`)
  - `backend/src/integrations/google/` (`google.controller.ts`, `google.service.ts`)
  - `backend/src/block-off/` (`block-off.controller.ts`, `block-off.service.ts`)
- **Core Entities Managed**: `Appointment`, `GoogleIntegration`, `BlockOff`, `AppointmentStatus` enum.
- **Architectural Scope**: Forward appointment scheduling, slot availability computation, Google Calendar bidirectional sync, automated reminder crons, and facility downtime block-offs.

---

## 2. API Controllers & Routing Endpoints
- **`AppointmentController` (`/appointments`)**:
  - `GET /appointments`: Date-ranged calendar booking queries.
  - `POST /appointments`: Manual appointment creation by staff.
  - `POST /appointments/book-public`: Public web booking endpoint.
  - `PATCH /appointments/:id`: Rescheduling and provider reassignments.
  - `POST /appointments/:id/cancel`: Cancellation with reason capture.
  - `GET /appointments/availability`: Real-time open slot computation.
- **`GoogleController` (`/integrations/google`)**:
  - `GET /integrations/google/auth-url`: Generates Google OAuth consent link.
  - `GET /integrations/google/callback`: Handles OAuth redirect and exchanges tokens.
  - `POST /integrations/google/sync`: Triggers manual bidirectional calendar sync.
- **`BlockOffController` (`/block-offs`)**:
  - Schedules maintenance blocks, lunch breaks, and emergency closures.

---

## 3. Service Layer Architecture & Slot Availability Logic
- **`AppointmentService.getAvailableSlots()`**:
  Evaluates booking availability across multi-dimensional constraints:
  1. Queries provider assigned working hours for the target day.
  2. Queries existing confirmed appointments for the provider.
  3. Queries facility `BlockOff` records for the location and service.
  4. Generates available time windows based on service `expectedDuration` + `bufferTime`.
- **Scheduled Reminder Cron (`TasksService.handleCheckinReminders`)**:
  Runs every 60 seconds (`* * * * *`). Calculates `diffMins` to appointment start:
  - T-15 minutes: Dispatches WhatsApp "Your appointment is in 15 minutes" preparation alert.
  - T-0 arrival: Dispatches arrival confirmation alert.
  - T+10 minutes: Sends gentle no-show warning before marking missed.

---

## 4. Architecture & Data Integrity
- **Unified Appointment-to-Visit Transition**: When a scheduled customer arrives, staff checks them in (or they scan a QR code). The system atomically transitions `Appointment.status = 'CHECKED_IN'` and spawns an active `Visit` record in the queue, harmonizing pre-booked appointments with walk-ins.
- **Google OAuth Token Refresh**: The `GoogleService` automatically detects expired Google OAuth access tokens and uses the stored `refreshToken` to maintain continuous calendar synchronization.

---

## 5. Business Abstraction & Value Proposition
- **Unified Operational Timeline**: Bridges the traditional divide between appointment software (Calendly) and queue software (ticket dispensers), orchestrating both into a single dynamic timeline.
- **No-Show Prevention**: Multi-stage automated WhatsApp reminders slash no-show rates by up to 60%, recovering lost provider earnings.

