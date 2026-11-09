# Multi-Step Journey Orchestrator (`/dashboard/journeys`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/dashboard/journeys/index.tsx` (Journey Catalog & Blueprint Overview)
  - `frontend/src/pages/dashboard/journeys/[id].tsx` (Visual Stage Editor & Transition Graph Builder)
- **Route Paths**: `/dashboard/journeys`, `/dashboard/journeys/[id]`
- **Target Audience**: Service designers, clinical workflow directors, operations architects configuring multi-station customer pathways.
- **Key Dependencies**: React (`useState`, `useCallback`), `AdminLayout`, TanStack Query, Lucide Icons (`Workflow`, `Plus`, `Copy`, `Edit2`, `Trash2`, `Layers`, `ChevronRight`), `CreateJourneyModal`, `ConfirmModal`.

---

## 2. Frontend Architecture & Journey Graph Builder
- **Journey Catalog UI (`/journeys`)**:
  - Lists all active and draft service flow blueprints.
  - Displays linked services count, step stages breakdown (e.g., "5 Stages: Checkpoint → Triage → Consult → Test → Checkout"), and assigned blueprint templates.
  - Actions: Create Journey, Duplicate Flow, Edit Graph, Delete Flow.
- **Visual Stage Editor UI (`/journeys/[id]`)**:
  - **Sequential Stage Canvas**: Visual node graph representing sequential and conditional stages.
  - **Step Configuration Panel**:
    - **Step Type**: `SERVICE`, `CHECKPOINT`, `COLLECTION`, `WAITING_PERIOD`, `NOTIFICATION`, `PAYMENT`, `FORM`, `CHECK_IN`, `CHECK_OUT`, `ORDER`.
    - **Trigger**: `AUTOMATIC`, `MANUAL_STAFF`, `MANUAL_CUSTOMER`, `SCHEDULED`, `CONDITION`.
    - **Physical Facility Guidance**: Floor number, room number, building wing, and customer-facing direction notes.
    - **Dynamic Form Builder**: Drag-and-drop form field definitions (text, textarea, select, checkbox, required validation).
    - **Digital Order Items**: Menu item bindings for in-queue dining or retail selections.

---

## 3. Backend Integration & Service Blueprint Engine
- **API Endpoints**:
  - `GET /service-flows` & `GET /service-flows/:id` (`backend/src/service-flow/service-flow.controller.ts`).
  - `POST /service-flows` (Creates new journey).
  - `PUT /service-flows/:id` (Updates blueprint graph and step templates).
  - `POST /service-flows/:id/duplicate` (Clones workflow graph).
  - `POST /service-flows/apply-template` (Applies pre-built industry templates).
- **Database Schema Models**:
  - `ServiceFlow` linked 1:1 with `Service`.
  - `FlowStepTemplate` defining individual stage properties.
  - `FlowStepTransition` defining allowed directed paths.

---

## 4. Architecture & System Design
- **Runtime Journey Instantiation**: When a customer joins a queue or checks in for a service with an active `ServiceFlow`, the backend `VisitStepService.instantiateStepsForVisit()` creates physical `VisitStep` rows copying step properties, setting the first step to `QUEUED`/`ACTIVE` and subsequent steps to `LOCKED`.
- **Pre-Built Industry Templates**: Integrates with `backend/src/service-flow/industry-templates.ts` containing 14 enterprise blueprints (Healthcare, Restaurants, Government, Salons, Banking).

---

## 5. Business Abstraction & Value Proposition
- **Complex Operations Simplified**: Transforms chaotic multi-department service environments (e.g. an outpatient hospital where patients must visit reception, triage, doctor, x-ray, lab, and pharmacy) into an automated, self-guiding customer journey.
- **Enterprise Expansion Driver**: Journey orchestration is a premium feature driving upgrades from Standard to Premium and Enterprise tiers.

