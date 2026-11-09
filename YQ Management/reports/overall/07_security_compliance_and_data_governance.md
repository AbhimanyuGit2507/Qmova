# Security, Compliance & Data Governance Audit

## 1. Security Architecture & Threat Model

Qmova processes sensitive business operations, customer contact details, financial payments, and medical consultation notes. The security framework is implemented across application, transport, database, and infrastructure layers.

```
                      [ Incoming Web Traffic ]
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │     Helmet Headers    │ (CSP, X-Frame, HSTS, No-Sniff)
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │    Throttler Guard    │ (Redis IP Rate Limiting: 100/min)
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │  CORS Origin Check    │ (Dynamic Subdomain Validation)
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │   JWT Passport Guard  │ (HttpOnly Cookie / Bearer Token)
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │       RBAC Guard      │ (Role: SUPER_ADMIN, OWNER, etc.)
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │    Validation Pipe    │ (Class-Validator, DTO Whitelisting)
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │  Prisma Parameterized │ (SQL Injection Immune Queries)
                     └───────────────────────┘
```

---

## 2. Authentication & Session Management

1. **HttpOnly Cookie Architecture**: The backend issues authentication tokens as `HttpOnly`, `Secure`, `SameSite=Lax` cookies named `token`. This mitigates Cross-Site Scripting (XSS) credential theft because client-side JavaScript cannot read the cookie string.
2. **Dual-Token Storage Strategy**: To support cross-origin API calls and mobile web views where third-party cookies may be constrained, client storage also tracks `qmover_auth_token` in `localStorage` for explicit `Authorization: Bearer <token>` headers.
3. **Password Security**: Passwords are cryptographically salted and hashed using standard bcrypt/argon2 implementations. Plaintext passwords never touch logs or persistent storage.
4. **Session Audit & Revocation**: The `UserSession` model tracks client user agents, IP addresses, and creation timestamps, enabling instant multi-device session revocation from the personal settings page.

---

## 3. Role-Based Access Control (RBAC) Matrix

Permissions are enforced via `@Roles(...)` decorators combined with `RolesGuard`:

| Resource / Capability | SUPER_ADMIN | OWNER | ADMIN | MANAGER | STAFF | PUBLIC (CUSTOMER) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Global Platform Metrics & Tenants** | Full Access | Denied | Denied | Denied | Denied | Denied |
| **Workspace & Branding Settings** | Read/Write | Full Access | Full Access | Read-Only | Denied | Denied |
| **Billing & Subscription Upgrades** | Full Access | Full Access | Full Access | Denied | Denied | Denied |
| **Payment Gateway Configuration** | Full Access | Full Access | Full Access | Denied | Denied | Denied |
| **Team Management & RBAC Invites** | Full Access | Full Access | Full Access | Read-Only | Denied | Denied |
| **Locations & Services Setup** | Full Access | Full Access | Full Access | Full Access | Read-Only | Read-Only (Public) |
| **Queue Calling & Service Desk** | Full Access | Full Access | Full Access | Full Access | Full Access | Denied |
| **My Desk Counter Station** | Full Access | Full Access | Full Access | Full Access | Full Access | Denied |
| **Clinical Notes & Prescriptions** | Denied (Tenant) | Full Access | Full Access | Full Access | Assigned Only | Denied |
| **Join Queue / Track Wait Screen** | Full Access | Full Access | Full Access | Full Access | Full Access | Token-Scoped |

---

## 4. Privacy & Regulatory Compliance (POPIA / GDPR / HIPAA)

### Protection of Personal Information Act (POPIA - South Africa)
Given Qmova's strong operational footprint in South Africa, the platform implements native POPIA compliance controls:
- **Lawful Processing of Customer Identifiers**: Customer phone numbers and names are processed solely for the legitimate operational purpose of queue notification.
- **Opt-in Communications**: Verification OTPs and queue updates are transactional, initiated directly by the customer's request to join.
- **Data Subject Rights (`/data-request`)**: Dedicated portal allowing individuals to request access to their personal data, request corrections, or demand complete deletion.

### Data Retention & Automatic Purging
To comply with GDPR and POPIA storage limitation principles, the backend executes an automated retention cron (`handleDataRetentionLifecycle` in `TasksService`):
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleDataRetentionLifecycle() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const visitResult = await this.prisma.visit.deleteMany({
    where: { createdAt: { lt: twoYearsAgo } },
  });
}
```
All visit history older than 24 months is permanently purged, eliminating long-term data breach liability.

### Healthcare Privacy & Clinical Safeguards
- **Isolated Clinical Storage**: Clinical notes (`ClinicalNote`) and prescriptions (`Prescription`) are stored in dedicated models segregated from basic queue ticket records.
- **Role Isolation**: Only authorized healthcare staff and account owners can query patient medical records; general receptionists viewing the queue list see operational tokens without medical history exposure.
- **Ephemeral Token Access**: Customers accessing wait screens via `accessToken` can only view their own active visit state. The access token is non-sequential (UUIDv4) and expires upon visit completion.

