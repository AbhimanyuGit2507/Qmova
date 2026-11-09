# Team Members, Roles & RBAC Settings (`/dashboard/settings/team`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/team.tsx`
- **Supporting Components**:
  - `frontend/src/components/settings/staff.tsx` (Platform Users)
  - `frontend/src/components/settings/providers.tsx` (On-Ground Staff)
  - `frontend/src/components/settings/StaffViewBuilder.tsx` (Staff View Builder)
  - `frontend/src/components/settings/RolesTable.tsx` (Roles & Permissions)
  - `frontend/src/components/settings/security.tsx` (Security & Access)
- **Route Path**: `/dashboard/settings/team`
- **Target Audience**: Human resources managers, practice partners, and administrators managing team seats, operational roles, and access control.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `InviteStaffModal`, `ConfirmModal`.

---

## 2. Frontend Architecture & Multi-Tab Team Management
- **URL-Derived Tab State Engine (`TABS`)**:
  - `staff` (Platform Users): Staff accounts that authenticate with credentials to access the web app.
  - `on-ground` (On-Ground Staff / Providers): Service providers (doctors, therapists, barbers) who are bookable on calendars. Can be linked to a platform user or exist as purely operational staff.
  - `staff-view` (Staff View Builder): Visual drag-and-drop builder creating custom `My Desk` station templates and assigning them per staff role.
  - `roles` (Roles & Permissions): Granular matrix view detailing capabilities per role (`OWNER`, `ADMIN`, `MANAGER`, `STAFF`).
  - `security` (Security & Access): Password policies, active session auditing, and 2FA enforcement toggles.
- **Invitation Modal Flow (`InviteStaffModal`)**:
  - Admin inputs email, selects RBAC role, and selects authorized physical branch locations.
  - Generates secure invitation token with automated email delivery or manual link copy.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /users` (`backend/src/users/users.controller.ts`).
  - `PATCH /users/:id` (Updates role or active status).
  - `DELETE /users/:id` (Revokes platform access).
  - `POST /invitations` (`backend/src/invitation/invitation.controller.ts`).
  - `GET /staff` & `POST /staff` (`backend/src/staff/staff.controller.ts`).
- **Plan Quota Guard (`checkLimit`)**:
  Before issuing an invitation or creating a new staff account, the backend verifies `subscriptionService.checkLimit(tenantId, 'staff', currentStaffCount)`. If user limits are exceeded, blocks creation with `403 Forbidden` (`PLAN_LIMIT_EXCEEDED`).

---

## 4. Architecture & System Design
- **Separation of Platform Users vs. Service Providers**: Distinguishes between software users (people with logins) and operational service providers (people with chairs/schedules). A clinic with 1 receptionist and 8 doctors can operate with 1 platform user and 8 provider profiles on lower-tier plans.
- **Deep Query Invalidation**: Revoking a user's role immediately invalidates their active JWT sessions in Redis.

---

## 5. Business Abstraction & Value Proposition
- **Seat-Based Expansion Monetization**: Staff seats represent a primary monetization lever. As medical practices hire more nurses or retail chains add counter staff, plan upgrades are triggered automatically.
- **Enterprise Governance**: Granular RBAC ensures junior receptionists cannot view financial billing or export customer databases, maintaining strict internal data governance.

