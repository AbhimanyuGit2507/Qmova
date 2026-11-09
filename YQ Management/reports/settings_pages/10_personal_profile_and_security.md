# Personal Profile & Account Security (`/dashboard/settings/personal`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/personal.tsx`
- **Supporting Component**: `frontend/src/components/settings/profile.tsx`
- **Route Path**: `/dashboard/settings/personal`
- **Target Audience**: All individual staff members, operators, and business owners managing their personal credentials, notification preferences, and active sessions.
- **Key Dependencies**: React (`useState`, `useEffect`), `SettingsLayout`, TanStack Query, `fetchApi`, `useAuth`, Sonner `toast`, Lucide Icons (`User`, `Lock`, `Shield`, `Smartphone`, `KeyRound`, `LogOut`, `Laptop`).

---

## 2. Frontend Architecture & Personal Preferences
- **Section 1: User Profile**:
  - Full Name, Email Address, and Contact Telephone Number.
  - Avatar uploader with image preview.
  - Role indicator badge (`OWNER`, `ADMIN`, `MANAGER`, `STAFF`) with workspace affiliation name.
- **Section 2: Password Security & Credential Updates**:
  - Current Password verification field.
  - New Password and Confirm Password inputs with password strength validation meters.
  - "Update Password" mutation invoking `POST /auth/change-password`.
- **Section 3: Two-Factor Authentication (2FA)**:
  - Email / WhatsApp OTP verification toggle for elevated account security.
- **Section 4: Active Login Sessions Ledger**:
  - List of active browser sessions (`UserSession` model).
  - Displays device user agent, IP address, geographical location estimate, and last activity timestamp.
  - "Revoke Session" and "Log Out of All Devices" buttons.

---

## 3. Backend Integration & Session Management
- **API Endpoints**:
  - `GET /auth/me` (`backend/src/auth/auth.controller.ts`).
  - `PATCH /users/me` (Updates name and contact details).
  - `POST /auth/change-password` (Validates old password, applies new bcrypt hash).
  - `GET /auth/sessions` (Lists active sessions).
  - `DELETE /auth/sessions/:id` (Revokes specific session).
  - `POST /auth/logout` (Clears cookies and terminates session).
- **Security Invalidation Pipeline**:
  Changing the user's password automatically triggers a database command destroying all associated `UserSession` records and blacklists active JWT tokens in Redis.

---

## 4. Architecture & System Design
- **Universal Accessibility**: Accessible to all authenticated users regardless of RBAC permissions; front-desk clerks and executive owners alike can maintain their security settings.
- **Secure Cookie Clear**: Invoking logout triggers backend Set-Cookie headers expiring `token` (`Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`), while client-side `AuthStorage.clear()` flushes `localStorage`.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Identity Hygiene**: Empowers employees to manage compromised passwords and terminate suspicious logins without filing IT helpdesk tickets.
- **Regulatory Privacy Compliance**: Facilitates personal data maintenance under GDPR Article 16 (Right to Rectification).

