# Self-Serve Registration & Account Creation (`/register`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/register.tsx`
- **Route Path**: `/register`
- **Target Audience**: New business owners, medical practitioners, salon operators, and managers creating a new Qmova tenant workspace.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js (`useRouter`, `Head`, `Link`), Framer Motion, Lucide Icons (`ArrowRight`, `Lock`, `Mail`, `User`, `CheckCircle2`, `Eye`, `EyeOff`), `fetchApi`, `AuthStorage`, `TermsModal`, `Logo`.

---

## 2. Frontend Architecture & Signup Funnel
- **State Model**:
  - `fullName`, `email`, `password`, `confirmPassword`.
  - Password visibility toggles (`showPassword`, `showConfirmPassword`).
  - Legal consent checkboxes: `termsAccepted` and `privacyAccepted` with interactive inline modal previews (`TermsModal`).
  - Two-step state machine: `step: 'details' -> 'otp'`.
  - Pending workspace invite detection (`qmova_invite_code`), allowing invited staff to complete account creation directly into the target tenant.
- **Client-Side Form Validation**:
  - Enforces minimum 8-character password length.
  - Verifies `password === confirmPassword`.
  - Blocks submission if mandatory Terms of Service or Privacy Policy checkboxes are unchecked.
- **Submit Handlers**:
  1. `handleRegister`: Calls `POST /auth/register`. If email verification is required, transitions to `step = 'otp'`.
  2. `handleVerifyOtp`: Calls `POST /auth/verify-registration`. Stores authentication token and immediately routes to `/onboarding`.

---

## 3. Backend Integration & Entity Provisioning
- **API Endpoints**:
  - `POST /auth/register` (`backend/src/auth/auth.controller.ts`).
  - `POST /auth/verify-registration`.
- **Backend Provisioning Sequence (ACID Transaction)**:
  1. Verifies email uniqueness across the global platform.
  2. Creates new `User` record with role `OWNER` (or `STAFF` if registering via invite).
  3. Hashes password using cryptographic salt.
  4. Records affirmative legal acceptances in `PolicyAcceptance` table.
  5. Dispatches email verification OTP via transactional email service (`Brevo`).

---

## 4. Architecture & System Design
- **Subdomain Middleware Coordination**: Upon registration completion, new users are redirected to `/onboarding`, where the multi-location and subdomain provisioning occurs.
- **Google OAuth Integration**: Supports alternative Google Sign-In with conflict detection preventing duplicate account collisions.

---

## 5. Business Abstraction & Value Proposition
- **Top-of-Funnel Conversion Engine**: The zero-friction starting gate for organic SaaS growth. Enables self-serve customer acquisition without requiring manual sales intervention or credit card pre-authorization.
- **Immediate Value Path**: Takes the user directly from registration into the guided setup wizard (`/onboarding`), driving activation within the first 5 minutes of sign-up.

