# Backend Module Audit: Auth, Users & RBAC Permissions

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/auth/` (`auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `roles.guard.ts`, `roles.decorator.ts`)
  - `backend/src/users/` (`users.controller.ts`, `users.service.ts`)
  - `backend/src/invitation/` (`invitation.controller.ts`, `invitation.service.ts`)
- **Core Entities Managed**: `User`, `UserSession`, `Invitation`, `AuditLog`, `Role` enum.
- **Architectural Scope**: User registration, credential hashing, JWT token issuance, session tracking, password reset OTPs, role-based authorization guards, and team member lifecycle.

---

## 2. API Controllers & Routing Endpoints
- **`AuthController` (`/auth`)**:
  - `POST /auth/register`: Public registration of new tenant owner.
  - `POST /auth/login`: Credential validation; sets `token` HttpOnly cookie.
  - `POST /auth/verify-login`: Evaluates 2FA verification code.
  - `POST /auth/logout`: Revokes current session and clears cookies.
  - `GET /auth/me`: Returns profile and permissions of authenticated user.
  - `POST /auth/forgot-password`: Generates 6-digit password reset OTP.
  - `POST /auth/reset-password`: Validates OTP and updates password.
- **`UsersController` (`/users`)**:
  - `GET /users`: Lists all users for the authenticated tenant.
  - `PATCH /users/:id`: Updates user role, contact details, or active status.
  - `DELETE /users/:id`: Revokes user account.
- **`InvitationController` (`/invitations`)**:
  - `POST /invitations`: Creates team invite token with assigned role.
  - `GET /invitations/verify/:token`: Validates invite token.
  - `POST /invitations/accept`: Binds invited user to tenant.

---

## 3. Service Layer Architecture & Security Mechanics
- **`AuthService`**:
  - **Password Security**: Uses cryptographic salting and bcrypt/argon2 hashing.
  - **Token Generation**: Issues signed JSON Web Tokens (JWT) containing `{ userId, email, tenantId, role }` with 30-day expiration.
  - **HttpOnly Cookie Transmission**: Emits `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax`.
- **`RolesGuard` & `@Roles(...)`**:
  Inspects `req.user.role` against required route metadata, rejecting unauthorized callers with `403 Forbidden`.

---

## 4. Architecture & Data Integrity
- **ACID Boundaries**: Registration provisions user and audit logs atomically.
- **Session Revocation**: Password updates destroy all `UserSession` records in PostgreSQL and blacklist JWT signatures in Redis.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Access Governance**: Protects sensitive queue and medical patient records by ensuring staff only access authorized operational panels.
- **Viral Workspace Expansion**: Frictionless team invitations allow businesses to onboard new employees in seconds.

