# Staff View Layout Builder (`/dashboard/settings/staff-view`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Redirect: `frontend/src/pages/dashboard/settings/staff-view.tsx`
  - Builder Component: `frontend/src/components/settings/StaffViewBuilder.tsx`
  - Host Tab: `frontend/src/pages/dashboard/settings/team.tsx?tab=staff-view`
- **Route Path**: `/dashboard/settings/team?tab=staff-view`
- **Target Audience**: Operations architects, IT leads, and clinical administrators designing custom desk layouts for counter staff, doctors, and specialists.
- **Key Dependencies**: React (`useState`, `useCallback`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, Lucide Icons (`Layout`, `Plus`, `Trash2`, `Save`, `Grid`, `Move`, `Sparkles`).

---

## 2. Frontend Architecture & Visual Layout Builder
- **Station Template Canvas**:
  - Allows administrators to visually construct the 2D grid displayed to operators on `/dashboard/my-desk`.
  - Configures template name (e.g. "Doctor Consultation Room", "Emergency Triage Station", "Restaurant Kitchen KDS", "Bank Teller Counter").
- **Widget Palette**:
  - Users can drag or add widgets from the registry:
    - `CurrentTicketWidget`: Live calling station with stage progression.
    - `CustomerHistoryWidget`: Past visit dossier and VIP notes.
    - `ScheduleWidget`: Today's booked appointments list.
    - `QueueGridWidget`: Waiting room queue feed.
    - `ClinicalNotesWidget`: Medical SOAP consultation notes.
    - `PrescriptionWidget`: Medication dosage generator.
    - `CustomFormWidget`: Embedded custom intake forms.
- **Grid Positioning & Span Controls**:
  - For each widget, administrators adjust:
    - `colSpan` (1, 2, or 3 columns wide).
    - `rowSpan` (1 or 2 rows tall).
- **Staff Assignment Matrix**:
  - Binds specific templates to individual staff accounts or roles (e.g. all doctors receive the "Clinical Notes" template; all receptionists receive the "Queue Grid" template).

---

## 3. Backend Integration & Layout Serialization
- **API Endpoints**:
  - `GET /tenant/me` (`backend/src/tenant/tenant.controller.ts`).
  - `PATCH /tenant/me` (Saves serialized `staffViewLayout` JSON into `Tenant` entity).
- **JSON Configuration Schema (`staffViewLayout`)**:
  ```json
  {
    "version": 2,
    "assignments": {
      "user_uuid_dr_smith": "template_clinical_1"
    },
    "templates": [
      {
        "id": "template_clinical_1",
        "name": "Doctor Consultation Station",
        "layout": [
          { "id": "t1", "type": "CurrentTicketWidget", "position": { "colSpan": 1, "rowSpan": 2 } },
          { "id": "t2", "type": "ClinicalNotesWidget", "position": { "colSpan": 2, "rowSpan": 2 } },
          { "id": "t3", "type": "CustomerHistoryWidget", "position": { "colSpan": 1, "rowSpan": 1 } }
        ]
      }
    ]
  }
  ```

---

## 4. Architecture & System Design
- **Zero-Code Extensibility**: Adding new domain widgets requires zero database schema migrations; the widget registry in frontend dynamically parses the JSON schema.
- **Immediate Live Propagation**: Modifying a layout in the builder immediately takes effect on connected staff workstations upon their next desk refresh.

---

## 5. Business Abstraction & Value Proposition
- **Extreme Domain Flexibility**: Solves the enterprise dilemma where different departments within the same company require drastically different screen layouts (e.g., triage nurses vs. specialist doctors vs. pharmacy cashiers).
- **Ergonomic Operator Efficiency**: Eliminates screen clutter by providing only the exact widgets required for that specific employee's daily responsibilities.

