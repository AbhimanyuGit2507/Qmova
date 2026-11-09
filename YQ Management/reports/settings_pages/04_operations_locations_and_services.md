# Operations: Locations, Services & Resources (`/dashboard/settings/operations`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/operations.tsx`
- **Supporting Components**:
  - `LocationsSettings.tsx` (Locations tab)
  - `ServicesSettings.tsx` (Services tab)
  - `ResourcesSettings.tsx` (Resources tab)
  - `providers.tsx` (Providers tab)
- **Route Path**: `/dashboard/settings/operations`
- **Target Audience**: Chief operating officers, clinical directors, practice managers configuring physical infrastructure and service catalogs.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SettingsLayout`, TanStack Query, `useAuth`, Lucide Icons, `ConfirmModal`.

---

## 2. Frontend Architecture & Multi-Resource Configuration
- **Tab 1: Locations (Physical Branches)**:
  - Branch Name, Physical Street Address, Geolocation coordinates (Latitude/Longitude).
  - Timezone selector (critical for multi-region or international branches).
  - Operating Hours Grid: Mon–Sun open/close times with break intervals.
  - Default Token Display Prefix (e.g. `CPT-` for Cape Town, `JHB-` for Johannesburg).
- **Tab 2: Services (Catalog of Offerings)**:
  - Service Name, Category, Description, and Base Price.
  - Expected Service Duration (minutes) and Post-Service Buffer Time.
  - Payment Mode selector: `PREPAY` (upfront checkout), `POSTPAY` (settle at checkout), `OPTIONAL_PREPAY`, or `PAY_AT_SERVICE` (counter payment).
  - Require Manual Check-In toggle: Enforces physical arrival verification before token is called.
  - Linked Journey Blueprint / Service Flow selector.
- **Tab 3: Resources (Physical Rooms & Bays)**:
  - Resource Name (e.g., "Consultation Room 3", "Dental Chair 1", "Bay 4").
  - Type (Room, Chair, Counter, Equipment, Bay) and concurrent capacity limit.
- **Tab 4: Providers (Operational Staff)**:
  - Working schedule shifts, break times, and assigned service capabilities.

---

## 3. Backend Integration & Relational Entity Mutators
- **API Endpoints**:
  - `GET /location` & `POST /location`, `PATCH /location/:id` (`backend/src/location/location.controller.ts`).
  - `GET /service` & `POST /service`, `PATCH /service/:id` (`backend/src/service/service.controller.ts`).
  - `GET /resource` & `POST /resource`, `PATCH /resource/:id` (`backend/src/resource/resource.controller.ts`).
  - `GET /staff` & `POST /staff` (`backend/src/staff/staff.controller.ts`).
- **Plan Enforcement**:
  Every resource addition checks against active tenant subscription limits:
  - `subscriptionService.checkLimit(tenantId, 'locations', currentLocationsCount)`.
  - `subscriptionService.checkLimit(tenantId, 'services', currentServicesCount)`.

---

## 4. Architecture & System Design
- **Hierarchical Relational Tree**:
  - `Tenant` -> `Location` -> `Service` / `Queue` / `Resource` / `Staff`.
  - All foreign keys enforce `onDelete: Cascade` or restricted constraints to prevent orphaned operational records.
- **Timezone-Aware Calculations**:
  All appointment slotting, token sequence resets, and working hour evaluations use the location's explicit timezone via `date-fns-tz` (`toZonedTime`, `fromZonedTime`), ensuring branches in different timezones calculate accurate business hours independently.

---

## 5. Business Abstraction & Value Proposition
- **Digital Twin of Physical Operations**: Models physical real-world assets (rooms, staff, services) into digital scheduling constraints, eliminating double-bookings and room conflicts.
- **Flexible Monetization Packaging**: Businesses can configure distinct prices, payment policies, and durations for each service, unlocking online deposit pre-payments.

