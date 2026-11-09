# Tenant Onboarding Wizard & Multi-Location Provisioning (`/onboarding`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/onboarding/index.tsx`
- **Route Path**: `/onboarding`
- **Target Audience**: Newly registered tenant owners setting up their enterprise workspace, branches, service catalogs, and WhatsApp connection.
- **Key Dependencies**: React (`useState`, `useEffect`, `useMemo`), Next.js (`useRouter`, `Head`), TanStack React Query (`useQuery`, `useMutation`), Framer Motion (`AnimatePresence`, `motion`), `react-confetti`, QRCodeSVG, Lucide Icons (15+ industry icons), `useWhatsapp` hook, `useAuth` hook, `fetchApi`, `JoinWorkspaceModal`.

---

## 2. Frontend Architecture & Multi-Step Wizard Engine
- **Wizard Steps Progression**:
  1. **Workspace & Identity**: Company name, custom subdomain selection (`[subdomain].qmova.com`), phone number, country code.
  2. **Multi-Location Hierarchy**: Support for adding multiple physical branches (`locations: OnboardingLocation[]`). Each location configures its name, address, business industry vertical, and sub-type.
  3. **Service Catalog & Journey Seeding**: Configures services per location (name, duration, appointment availability). Checkbox toggle `seedFlow: true` automatically attaches industry-standard multi-stage journey blueprints.
  4. **Plan Fit Pre-flight Check**: Queries `GET /onboarding/check-plan-fit?locations=X&services=Y` to verify that proposed setup conforms to current plan quotas or recommends an upgrade.
  5. **WhatsApp Integration Setup**: Interactive pairing screen rendering live Evolution API QR code via `useWhatsapp` hook for instant mobile scanner connection.
  6. **Launch Celebration**: Full-screen canvas confetti animation (`react-confetti`) with workspace links and direct transition to the live operations desk (`/dashboard/service-desk`).

---

## 3. Backend Integration & Atomic Provisioning
- **API Endpoints**:
  - `GET /onboarding/industries` & `GET /onboarding/business-catalog`.
  - `GET /onboarding/check-plan-fit`.
  - `POST /onboarding/provision-multi` (`backend/src/onboarding/onboarding.controller.ts`).
- **Atomic Backend Orchestration (`provisionMulti`)**:
  Within a single PostgreSQL transaction:
  1. Updates or creates `Tenant` record with chosen subdomain and settings.
  2. Creates each `Location` record with address and timezone.
  3. Creates each `Service` record linked to location and tenant.
  4. Creates default `Queue` records per service with unique prefixes.
  5. Calls `ServiceFlowService.applyIndustryTemplate()` for all services marked `seedFlow: true`, creating `ServiceFlow`, `FlowStepTemplate`, and `FlowStepTransition` graphs from `industry-templates.ts`.
  6. Updates user's personal settings (`onboardingCompleted = true`).

---

## 4. Architecture & System Design
- **Idempotency & Re-entry Safety**: If an onboarding session is interrupted, re-entering `/onboarding` loads existing partially configured state without duplicating locations or services.
- **Dynamic Industry Icons**: Automatically maps industry keys (`healthcare`, `food_and_beverage`, `beauty_and_wellness`, `automotive`) to matching Lucide React icons.

---

## 5. Business Abstraction & Value Proposition
- **Time-to-Value (TTV) Compression**: Replaces complex multi-day enterprise software onboarding with a self-guided 3-minute setup flow.
- **Instant Domain Blueprinting**: Rather than forcing a doctor or salon owner to design a complex workflow from scratch, one click auto-populates pre-built clinical or salon blueprints.

