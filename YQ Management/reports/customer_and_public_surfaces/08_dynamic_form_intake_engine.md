# Dynamic Form Intake Engine (`/form/[token]/[stepId]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/form/[token]/[stepId].tsx`
- **Route Path**: `/form/[token]/[stepId]`
- **Target Audience**: Waiting customers, clinic patients, or clients completing digital questionnaires, medical triage forms, or consent waivers on their smartphones.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `Head`, `fetchApi`, Lucide Icons (`ArrowRight`, `Loader2`, `CheckCircle2`).

---

## 2. Frontend Architecture & Dynamic Schema Renderer
- **Dynamic Form Construction**:
  Instead of hardcoded HTML inputs, this page dynamically inspects the `customerView.fields` JSON schema configured on the active `FlowStepTemplate`:
  ```typescript
  interface FormField {
    id: string;
    label: string;
    type?: 'text' | 'textarea' | 'select' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }
  ```
- **Supported Field Types**:
  - `text`: Single-line alphanumeric inputs (e.g. ID number, medical aid policy number).
  - `textarea`: Multi-line text boxes (e.g. primary symptoms, reason for visit).
  - `select`: Dropdown selection menus with dynamic option arrays.
  - `checkbox`: Boolean toggles and mandatory legal liability waivers.
- **Real-Time Client Validation**:
  Evaluates required fields before allowing submission. Displays inline validation warnings with instant touch feedback.
- **Completion Transition**:
  Upon successful submission, displays an animated green checkmark banner ("Form Submitted Successfully!") with an automatic redirect button returning the user to their live queue wait screen (`/customer/status/[token]`).

---

## 3. Backend Integration & Data Persistence
- **API Endpoints**:
  - `GET /public-visit/:token` (`backend/src/visit/public-visit.controller.ts`).
  - `POST /public-visit/:token/submit-form/:stepId` (`backend/src/visit-step/visit-step.service.ts`).
- **Transactional State Mutation**:
  1. Validates that the active step ID matches a `FORM` step in the customer's visit workflow.
  2. Saves response payload into `VisitStep.formData` and `Visit.formResponses`.
  3. Transitions `VisitStep.status` from `QUEUED` / `ACTIVE` to `DONE`.
  4. Automatically unlocks the subsequent journey step via `FlowStepTransition` rules.
  5. Emits `STEP_ACTIVATED` event via `OutboxEvent` notifying attending staff.

---

## 4. Architecture & System Design
- **Zero-Storage PII Leaks**: Form responses are stored encrypted in the database and visible only to authorized medical/staff personnel via `VisitDossierPanel` or `MyDesk`.
- **Pre-fill Capability**: If the customer already filled out partial answers during prior visits, existing values hydrate into input fields automatically.

---

## 5. Business Abstraction & Value Proposition
- **Clipboard & Paper Elimination**: Completely eliminates physical paper intake clipboards, manual handwriting transcription errors, and lost questionnaires.
- **Asynchronous Lobby Efficiency**: Patients complete medical history and insurance verification on their phones while sitting in the waiting area, allowing doctors to review complete clinical dossiers before the consultation begins.

