# Password Recovery & Reset Flow (`/auth/forgot-password`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/auth/forgot-password.tsx`
- **Route Path**: `/auth/forgot-password`
- **Target Audience**: Existing staff and business owners who have forgotten their credentials or been locked out.
- **Key Dependencies**: React (`useState`), Next.js (`useRouter`, `Head`, `Link`), Lucide Icons (`ArrowRight`, `Mail`, `CheckCircle2`, `Lock`, `KeyRound`, `Eye`, `EyeOff`), `fetchApi`.

---

## 2. Frontend Architecture & Multi-Step Wizard
- **Three-Step State Machine (`step`)**:
  1. `step = 'email'`: User enters their registered email address. Invokes `handleRequestReset`.
  2. `step = 'otp'`: User enters the 6-digit verification code dispatched to their inbox. Includes `handleResendOtp` countdown.
  3. `step = 'password'`: User defines a new password with confirmation and password masking toggles. Invokes `handleResetPassword`.
- **User Experience Safeguards**:
  - Clear step progression banners informing users where they are in the recovery cycle.
  - Error messages surfaced cleanly inline without clearing input fields.
  - Success transition banner with automated redirect countdown leading directly back to `/login`.

---

## 3. Backend Integration & Ephemeral OTP Verification
- **API Endpoints**:
  - `POST /auth/forgot-password` (`backend/src/auth/auth.controller.ts`).
  - `POST /auth/resend-otp`.
  - `POST /auth/reset-password`.
- **Backend Recovery Sequence**:
  1. Verifies if email exists in database (returns generic success to prevent email enumeration attacks).
  2. Generates a secure random 6-digit OTP code and stores it in Redis (`otp:password_reset:{email}`) with a strict **5-minute expiration (TTL 300s)**.
  3. Renders branded email template via `TemplateService` and sends via Brevo SMTP relay.
  4. Upon `POST /auth/reset-password`, verifies Redis OTP code, consumes/deletes the code, updates the user's password hash in PostgreSQL, and revokes all active `UserSession` records to force global re-login.

---

## 4. Architecture & System Design
- **Anti-Enumeration Protection**: Endpoint responses do not leak whether an email exists or does not exist in the database, preventing attackers from probing user lists.
- **Rate-Limiting**: Scoped by IP and email to prevent distributed brute-force attacks against the 6-digit OTP space.

---

## 5. Business Abstraction & Value Proposition
- **Self-Service Support Deflection**: Password recovery is historically the #1 driver of customer support tickets. This automated 3-step flow deflects routine inquiries and eliminates account lockout downtime.
- **Security Posture**: Enforcing full session revocation on password resets ensures compromised accounts are instantly secured across all devices.

