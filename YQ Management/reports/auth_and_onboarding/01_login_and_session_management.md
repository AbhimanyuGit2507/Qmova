# Staff & Tenant Login (`/login`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/login.tsx`
- **Route Path**: `/login`
- **Target Audience**: Business owners, clinic managers, reception staff, doctors, specialists, and platform Super Admins.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js (`useRouter`, `Head`, `Link`), Lucide Icons (`ArrowRight`, `Lock`, `Mail`, `CheckCircle`, `Eye`, `EyeOff`), `fetchApi`, `AuthStorage`, `Logo`.

---

## 2. Frontend Architecture & Multi-Step Authentication Flow
- **State Machine**:
  - `step`: Transitions from `'credentials'` to `'otp'` when Two-Factor Authentication (2FA) is enforced.
  - `email`, `password`, `showPassword`: Input state with password masking toggle.
  - `otp`: 6-digit one-time verification passcode.
  - `invitePreview`: Detects pending team invitation codes in URL query (`?code=...` or `?inviteCode=...`) or cookies. Automatically fetches and displays workspace invitation preview cards (`/workspace/invite-preview/:code`).
- **Submission Handlers**:
  1. `handleLogin`: Submits credentials to `POST /auth/login`. If `requiresOtp: true`, switches to the OTP verification step. Otherwise, stores the returned JWT token via `AuthStorage.set(data.access_token)`.
  2. `handleVerifyOtp`: Submits email and 6-digit code to `POST /auth/verify-login`.
  3. `handleResendOtp`: Triggers email OTP redispatch via `POST /auth/resend-otp` with loading feedback.
- **Role-Based Post-Login Routing Logic**:
  ```typescript
  const isSuper = data?.user?.role === 'SUPER_ADMIN' ||
    (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL &&
     email.trim().toLowerCase() === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL.toLowerCase());

  if (!isSuper && (!data?.user?.tenantId || !data?.user?.personalSettings?.onboardingCompleted)) {
    router.push('/onboarding');
  } else {
    router.push(isSuper ? '/super-admin' : '/dashboard');
  }
  ```

---

## 3. Backend Integration & Security Pipeline
- **API Endpoints**:
  - `POST /auth/login` (`backend/src/auth/auth.controller.ts`).
  - `POST /auth/verify-login`.
  - `POST /auth/resend-otp`.
- **Backend Execution Flow**:
  1. Looks up `User` record by email (case-insensitive normalized).
  2. Compares password hash using cryptographic comparison.
  3. Verifies account status is active and not suspended.
  4. Sets an `HttpOnly`, `Secure`, `SameSite=Lax` cookie containing the JWT payload (`userId`, `email`, `tenantId`, `role`).
  5. Records login event in `AuditLog` table with IP address and client User-Agent.

---

## 4. Architecture & System Design
- **Single Sign-On (SSO) & Cookie Coexistence**: The architecture handles both direct HttpOnly cookies (for same-origin browser security) and Bearer tokens in localStorage (for cross-subdomain API requests and mobile app wrappers).
- **Google OAuth Conflict Resolution**: The URL query listener detects OAuth redirect errors (`NO_ACCOUNT`, `EMAIL_PWD_ACCOUNT`, `ALREADY_LINKED_GOOGLE`) and provides actionable user guidance.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Security Gate**: Enforces robust identity verification and tenant isolation before any operator gains access to sensitive patient or customer queue data.
- **Frictionless Team Onboarding**: Staff members clicking an invitation link can log in with their existing account and immediately join the inviting company's workspace without administrative manual provisioning.

