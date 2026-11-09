# Consolidated Audit Report: Authentication, Identity, Password Recovery & Onboarding Wizard

> **Source Folder**: `reports/auth_and_onboarding/`  
> **Total Files Consolidated**: 5 distinct audit reports  
> **Target Audience**: Senior Tech Leads, System Architects, Business & Revenue Associates  

---

## Table of Contents

1. [Staff & Tenant Login (`/login`) Deep Audit](#section-1-01_login_and_session_management)
2. [Self-Serve Registration & Account Creation (`/register`) Deep Audit](#section-2-02_register_and_workspace_creation)
3. [Password Recovery & Reset Flow (`/auth/forgot-password`) Deep Audit](#section-3-03_forgot_password_and_recovery)
4. [Tenant Onboarding Wizard & Multi-Location Provisioning (`/onboarding`) Deep Audit](#section-4-04_onboarding_wizard_and_ai_setup)
5. [Quick Join Queue & Team Access Portal (`/join`) Deep Audit](#section-5-05_join_quick_access)

---

<div id="section-1-01_login_and_session_management"></div>

<!-- ===================================================================== -->
<!-- SECTION 1/5: reports/auth_and_onboarding/01_login_and_session_management.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/auth_and_onboarding/01_login_and_session_management.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/01_login_and_session_management.md)

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



---

<div id="section-2-02_register_and_workspace_creation"></div>

<!-- ===================================================================== -->
<!-- SECTION 2/5: reports/auth_and_onboarding/02_register_and_workspace_creation.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/auth_and_onboarding/02_register_and_workspace_creation.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/02_register_and_workspace_creation.md)

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



---

<div id="section-3-03_forgot_password_and_recovery"></div>

<!-- ===================================================================== -->
<!-- SECTION 3/5: reports/auth_and_onboarding/03_forgot_password_and_recovery.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/auth_and_onboarding/03_forgot_password_and_recovery.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/03_forgot_password_and_recovery.md)

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



---

<div id="section-4-04_onboarding_wizard_and_ai_setup"></div>

<!-- ===================================================================== -->
<!-- SECTION 4/5: reports/auth_and_onboarding/04_onboarding_wizard_and_ai_setup.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/auth_and_onboarding/04_onboarding_wizard_and_ai_setup.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/04_onboarding_wizard_and_ai_setup.md)

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



---

<div id="section-5-05_join_quick_access"></div>

<!-- ===================================================================== -->
<!-- SECTION 5/5: reports/auth_and_onboarding/05_join_quick_access.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/auth_and_onboarding/05_join_quick_access.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/05_join_quick_access.md)

# Quick Join Queue & Team Access Portal (`/join`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/join.tsx`
- **Route Path**: `/join`
- **Target Audience**: New team members receiving an invite code or physical walk-in visitors entering an on-premises short code.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js (`useRouter`, `Head`), `useAuth` hook, `fetchApi`, Lucide Icons (`Loader2`, `ArrowRight`, `Check`, `AlertCircle`), `Logo`.

---

## 2. Frontend Architecture & Flow Logic
- **Dual Operating Modes**:
  1. **Direct Invite Code Link (`/join?code=ABC123XYZ`)**: Extracts code, writes it to `localStorage` (`qmova_invite_code`) and browser cookies, and automatically resolves the target workspace preview.
  2. **Manual Short Code Entry**: Clean, minimal input card where users can manually type or paste a 6-to-8 character workspace or queue code.
- **State Machine (`status`)**:
  - `'loading'`: Checking authentication status and evaluating URL query parameters.
  - `'ready'`: Waiting for user code submission or confirmation.
  - `'joining'`: Executing join mutation with animated spinner.
  - `'success'`: Confirmed membership transition leading to `/dashboard`.
  - `'error'`: Displays descriptive error (expired invite, quota exceeded, invalid code).

---

## 3. Backend Integration & Data Mutation
- **API Endpoint**: `POST /workspace/join` (or `POST /invitations/accept`).
- **Backend Verification**:
  1. Looks up `Invitation` record matching code.
  2. Verifies `expiresAt > now()` and `usedCount < maxUses`.
  3. Binds authenticated `User(id)` to `Tenant(id)` with the role designated in the invite.
  4. Increments `usedCount` and marks `used = true` if single-use.
  5. Returns success payload and emits team membership audit log.

---

## 4. Architecture & System Design
- **Cross-Domain Invitation Persistence**: Storing the invite code in both cookie and `localStorage` guarantees that if an unauthenticated user is redirected through Google Sign-In or email verification, the original invite code survives multi-domain redirects and binds upon first login.
- **Global Path Exclusion**: `/join` is included in Next.js middleware `globalPaths`, preventing it from being rewritten into a specific tenant subdomain namespace.

---

## 5. Business Abstraction & Value Proposition
- **Viral Expansion Loop**: Removes friction from team member onboarding. An owner sends an invite link over WhatsApp or Slack; team members click, authenticate, and land in the live desk within 10 seconds.
- **Physical QR Shortcodes**: Can be deployed on physical posters in branches for instant counter assignments or quick staff device pairing.



---

