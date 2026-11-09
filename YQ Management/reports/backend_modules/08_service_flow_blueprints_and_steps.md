# Backend Module Audit: Service Flows, Blueprints & Multi-Stage Steps

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/service-flow/` (`service-flow.controller.ts`, `service-flow.service.ts`, `industry-templates.ts` - 104KB, `business-catalog.ts` - 20KB)
  - `backend/src/visit-step/` (`visit-step.controller.ts`, `visit-step.service.ts` - 44KB)
  - `backend/src/service/` (`service.controller.ts`, `service.service.ts`)
  - `backend/src/resource/` (`resource.controller.ts`, `resource.service.ts`)
- **Core Entities Managed**: `ServiceFlow`, `FlowStepTemplate`, `FlowStepTransition`, `VisitStep`, `VisitStepEvent`, `Service`, `Resource`, `StepType` enum, `VisitStepStatus` enum, `StepTrigger` enum.
- **Architectural Scope**: Multi-stage customer journey orchestration, directed acyclic workflow graphs, dynamic form intake, digital menu ordering, physical facility wayfinding, and runtime step transitions.

---

## 2. API Controllers & Routing Endpoints
- **`ServiceFlowController` (`/service-flows`)**:
  - `GET /service-flows`: Lists all journey blueprints for the tenant.
  - `GET /service-flows/:id`: Returns blueprint graph and step templates.
  - `POST /service-flows`: Creates new workflow blueprint.
  - `PUT /service-flows/:id`: Updates stages, form fields, and transition rules.
  - `POST /service-flows/apply-template`: Clones pre-built industry templates.
  - `POST /service-flows/:id/duplicate`: Duplicates journey graph.
- **`VisitStepController` (`/visit-steps`)**:
  - `GET /visit-steps/visit/:visitId`: Returns live steps for an active visit.
  - `POST /visit-steps/:id/transition`: Staff advances customer to the next stage.
  - `POST /visit-steps/:id/skip`: Skips optional step.
  - `POST /visit-steps/:id/outcome`: Records operational outcome or clinical result.
  - `POST /visit-steps/:token/submit-form`: Customer submits digital form answers.
  - `POST /visit-steps/:token/submit-order`: Customer submits digital food/retail order.

---

## 3. Service Layer Architecture & Blueprint Seeding
- **`industry-templates.ts` (104KB of Enterprise Blueprints)**:
  Contains comprehensive step templates across 14 industry verticals:
  - **Healthcare & Medical**: Arrival -> Medical Aid Verification -> Triage & Vitals -> Doctor Consultation -> Diagnostics (Pathology/Imaging) -> Await Results -> Review -> Procedure Room -> Billing -> Pharmacy -> Discharge.
  - **Food & Beverage**: Check-in -> Waitlist -> Table Assignment -> Order Taking -> Payment -> Food Prep -> Collection -> Dessert -> Feedback.
  - **Government & Civic**: Verification -> Pre-screening -> Counter Service -> Biometrics -> Test -> Fee -> Processing -> Approval -> Collection.
  - **Beauty, Hospitality, Automotive, Banking, Logistics, Education, Corporate**.
- **Runtime Step Instantiation (`instantiateStepsForVisit`)**:
  When a visit is created, this method copies all `FlowStepTemplate` rows into `VisitStep` instances bound to that specific visit. The initial step is marked `QUEUED` or `ACTIVE`, while downstream steps are marked `LOCKED`.

---

## 4. Architecture & State Transition Rules
- **Directed Graph Transitions**:
  Advancing a stage evaluates `FlowStepTransition` rules. If conditions are met (e.g. form completed or staff approved), transitions current step `ACTIVE -> DONE`, unlocks the target step `LOCKED -> QUEUED`, and creates an `OutboxEvent` emitting `STEP_ACTIVATED`.
- **Physical Guidance Metadata**:
  Each step stores location attributes (`floorNumber`, `roomNumber`, `buildingWing`, `locationDescription`), which the customer wait screen displays to guide patients through complex facilities.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Process Modernization**: Replaces disjointed multi-department routing with a seamless, automated customer journey.
- **Error Elimination**: Prevents patients from seeing a doctor before completing vitals, or leaving a hospital before settling pharmacy invoices.

