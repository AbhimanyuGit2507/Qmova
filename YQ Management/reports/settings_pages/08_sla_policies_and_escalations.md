# Service Level Agreements (SLA) & Escalation Policies (`/dashboard/settings/sla`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/sla.tsx`
- **Supporting Component**: `frontend/src/components/settings/sla.tsx`
- **Route Path**: `/dashboard/settings/sla`
- **Target Audience**: Chief operating officers, clinical quality directors, customer experience managers setting maximum wait thresholds.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Plus`, `Edit2`, `Trash2`).

---

## 2. Frontend Architecture & SLA Policy Manager
- **Policy Definition Form**:
  - **Policy Name**: (e.g. "Urgent Care Triage SLA", "VIP Teller Speed Guarantee", "Standard Consultation SLA").
  - **Warning Threshold (Minutes)**: Wait time duration after which a ticket card turns amber on operator screens (e.g. 15 minutes).
  - **Breach Threshold (Minutes)**: Wait time duration after which the ticket transitions to a critical red breach state (e.g. 30 minutes).
  - **Escalation Telephones**: Comma-separated list of supervisor phone numbers receiving automated SMS/WhatsApp alerts upon policy breach.
  - **Applicable Services**: Multi-select checklist binding the policy to specific services in the tenant's catalog.
- **Policy Roster Table**:
  - Lists configured policies with threshold tags, assigned service counts, and edit/delete actions.
  - Inline confirmation modals preventing accidental deletion of active policies.

---

## 3. Backend Integration & Automated Monitoring Engine
- **API Endpoints**:
  - `GET /sla-policies` (`backend/src/sla-policy/sla-policy.controller.ts`).
  - `POST /sla-policies` (Creates policy with service connections).
  - `PATCH /sla-policies/:id` (Updates thresholds or escalation contacts).
  - `DELETE /sla-policies/:id` (Deletes policy and unlinks services).
- **Service Layer Logic (`sla-policy.service.ts`)**:
  Manages relational bindings between `SlaPolicy` and `Service` models in PostgreSQL:
  ```typescript
  async update(id: string, tenantId: string, data: any) {
    return this.prisma.slaPolicy.update({
      where: { id },
      data: {
        name: data.name,
        warningThresholdMins: data.warningThresholdMins,
        breachThresholdMins: data.breachThresholdMins,
        escalationPhones: data.escalationPhones,
        services: data.serviceIds ? { set: data.serviceIds.map(id => ({ id })) } : undefined,
      },
    });
  }
  ```

---

## 4. Architecture & System Design
- **Real-Time Threshold Evaluation**: Wait time duration is computed dynamically on the operator `Service Desk` and `My Desk` by subtracting `waitingStart` from `now()`. When `diffMins > warningThresholdMins`, CSS animation pulses warning borders without requiring polling.
- **Automated Escalation Dispatch**: Background tasks monitor overdue tickets and trigger SMS/WhatsApp alerts to `escalationPhones` when critical breaches occur.

---

## 5. Business Abstraction & Value Proposition
- **Guaranteed Service Quality**: In healthcare and financial environments, unmonitored wait times lead to clinical deterioration, walkouts, and regulatory scrutiny. SLA policies enforce organizational accountability.
- **Enterprise SLA Compliance**: Enterprise B2B contracts often mandate strict contractual wait time guarantees (e.g., 95% of patients seen within 20 minutes); this engine provides the mathematical proof and telemetry required to validate SLA conformance.

