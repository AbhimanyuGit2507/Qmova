# Settings Hub & Layout Router (`/dashboard/settings`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/index.tsx`
- **Supporting Layout**: `frontend/src/components/SettingsLayout.tsx`
- **Route Path**: `/dashboard/settings`
- **Target Audience**: All authenticated tenant users accessing workspace, operational, team, or personal configuration panels.
- **Key Dependencies**: React (`useEffect`), Next.js `useRouter`, `SettingsLayout`.

---

## 2. Frontend Architecture & Master Settings Shell
- **Settings Shell Layout (`SettingsLayout.tsx`)**:
  Wraps all configuration subpages with a unified two-column layout:
  - **Collapsible Sidebar Navigation**:
    - **Personal**: Profile details, password security, session management (`/dashboard/settings/personal`).
    - **Workspace & Identity**: Company branding, logo, subdomain, and customer experience rules (`/dashboard/settings/workspace`).
    - **Team & Staff**: User accounts, staff roles, RBAC permissions, and staff view builder (`/dashboard/settings/team`).
    - **Operations**: Locations, services, physical resources, and provider working hours (`/dashboard/settings/operations`).
    - **Billing & Usage**: Plans, quotas, invoice history, payment method (`/dashboard/settings/billing`).
    - **Payments & Tax**: Stripe Connect, Paystack bank linking, manual counter payments (`/dashboard/settings/payments`).
    - **Integrations**: WhatsApp Evolution API, webhooks, Google Business sync, messaging templates (`/dashboard/settings/integrations`).
    - **SLA Policies**: Wait time warning thresholds and auto-escalations (`/dashboard/settings/sla`).
- **Index Redirection Gateway**:
  Navigating to `/dashboard/settings` automatically redirects to `/dashboard/settings/personal` via client-side `router.replace()`, preventing empty screens.

---

## 3. Backend Integration & Permission Gating
- **Role Scoping (`useAuth`)**:
  Sidebar navigation items are dynamically conditionally rendered based on user role:
  - `OWNER` / `ADMIN`: Access to all tabs (Billing, Payments, Team, SLA, Operations).
  - `MANAGER`: Access to Operations and Team (Read/Write on physical resources).
  - `STAFF`: Restricted exclusively to `Personal` profile and security settings.

---

## 4. Architecture & System Design
- **Next.js `getLayout` Pattern**: Implements persistent layouts (`SettingsIndex.getLayout`), preventing sidebar unmounting and state flickering during navigation between settings tabs.
- **Responsive Drawer**: Collapses to a mobile top drawer or horizontal pill tab bar on mobile screens (`< 1024px`).

---

## 5. Business Abstraction & Value Proposition
- **Unified Control Plane**: Organizes hundreds of complex enterprise settings into intuitive, logically partitioned domains, enabling practice owners to configure enterprise policies without engineering assistance.

