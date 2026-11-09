# Multi-Tenant & Subdomain Routing Model

## 1. Multi-Tenancy Architecture Overview

Qmova operates a **Logical Multi-Tenancy (Shared Database, Shared Process, Isolated Schema by Tenant ID)** architecture. Every tenant receives:
1. An isolated operational domain namespace (e.g. `https://acme.qmova.yqbuddy.com` or custom subdomain).
2. Complete brand customization: distinct logo, brand colors, custom intake forms, dynamic journey blueprints, and personalized messaging templates.
3. Strict logical data segregation enforced at both Next.js edge routing and NestJS database query boundaries.

```
Incoming Request: https://dr-smith.qmova.com/booking
                               │
                               ▼
                ┌──────────────────────────────┐
                │    Next.js Edge Middleware   │
                │     (frontend/src/middleware) │
                └──────────────┬───────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
[Reserved Subdomains]                         [Tenant Subdomain]
(www, api, evo, superadmin)                   (dr-smith)
        │                                             │
        │ Direct standard page route                  ▼ Rewrites path to:
        │ (/index, /login, /pricing)          /_tenant/dr-smith/booking
        │                                             │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   NestJS Backend Controller  │
                │  (TenantContextMiddleware)   │
                └──────────────┬───────────────┘
                               │
                               ▼
     Resolves Tenant -> Validates JWT tenantId == Resource tenantId
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │  PostgreSQL Database Query (Prisma ORM)      │
        │  WHERE "tenantId" = 'tenant_uuid_dr_smith'   │
        └──────────────────────────────────────────────┘
```

---

## 2. Edge Middleware & Subdomain Rewriting (`frontend/src/middleware.ts`)

The Next.js edge middleware intercepts 100% of non-static HTTP requests before React rendering occurs.

### Subdomain Extraction Logic
```typescript
const SYSTEM_SUBDOMAINS = new Set(['www', 'api', 'evo']);

// 1. Extract hostname from x-forwarded-host (proxy) or host header
const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
const hostname = rawHost.split(':')[0].toLowerCase();
const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

// 2. Identify subdomain against apex domains
let subdomain = '';
if (isLocal) {
  const parts = hostname.split('.');
  if (parts.length > 1 && parts[0] !== 'localhost') {
    subdomain = parts[0]; // e.g. "acme.localhost:3000" -> "acme"
  }
} else {
  // Production match: e.g. "dr-smith.qmova.yqbuddy.com" -> "dr-smith"
  for (const base of uniqueBases) {
    if (hostname.endsWith(`.${base}`)) {
      subdomain = hostname.slice(0, hostname.length - base.length - 1);
      break;
    }
  }
}
```

### Route Transformation Matrix

| Incoming URL | Edge Middleware Action | Final Internal Route Handler | Target Surface |
| :--- | :--- | :--- | :--- |
| `qmova.com/` | No rewrite | `pages/index.tsx` | Global SaaS Landing Page |
| `qmova.com/pricing` | No rewrite | `pages/pricing/index.tsx` | Public Pricing Matrix |
| `superadmin.qmova.com/tenants` | Subdomain rewrite | `pages/super-admin/tenants/index.tsx` | Platform Super Admin |
| `acme.qmova.com/` | Subdomain rewrite | `pages/_tenant/[subdomain]/index.tsx` | Branded Redirect to `/booking` |
| `acme.qmova.com/booking` | Subdomain rewrite | `pages/_tenant/[subdomain]/booking/[[...slug]].tsx` | Branded Public Booking Portal |
| `acme.qmova.com/checkin` | Subdomain rewrite | `pages/_tenant/[subdomain]/checkin/index.tsx` | Customer QR/Self-Check-in |
| `acme.qmova.com/tv/loc-1` | Subdomain rewrite | `pages/_tenant/[subdomain]/tv/[tenantId].tsx` | Branded Digital Signage TV |
| `acme.qmova.com/pay/pay_123` | Subdomain rewrite | `pages/_tenant/[subdomain]/pay/[paymentId].tsx` | Branded Payment Terminal |
| `qmova.com/t/acme/booking` | Path fallback rewrite | `pages/_tenant/[subdomain]/booking/[[...slug]].tsx` | Fallback Path Routing |
| `acme.qmova.com/dashboard/*` | Excluded from rewrite | `pages/dashboard/*` | Authenticated Tenant Back-Office |

---

## 3. Global Route Exclusions & Bypasses

Certain application routes must never be rewritten into tenant namespaces, even when accessed through a tenant subdomain:
```typescript
const globalPaths = [
  '/login',
  '/register',
  '/onboarding',
  '/dashboard',
  '/super-admin',
  '/features',
  '/pricing',
  '/about',
  '/contact',
  '/support',
  '/blog',
  '/changelog',
  '/docs',
  '/book-demo',
  '/privacy',
  '/terms',
  '/security',
  '/trust',
  '/cookies',
  '/refund-policy',
  '/data-request',
  '/for',
  '/customer',
  '/public',
  '/form',
  '/kiosk',
  '/staff-desk',
  '/join',
];
```
This ensures staff members navigating to `/login` or `/dashboard` on their subdomain seamlessly transition to the back-office without route collisions.

---

## 4. Backend Tenant Isolation & Boundary Verification

### 1. `TenantContextMiddleware` (`backend/src/tenant/middlewares/tenant-context`)
On every incoming backend request, the middleware parses the Host header or `x-tenant-subdomain` header. If a tenant subdomain is present, it looks up the tenant:
```typescript
const tenant = await this.tenantService.getTenantBySubdomain(subdomain);
req.tenant = tenant;
```

### 2. Dual-Layer Isolation Enforcement
The backend enforces data security at two distinct access levels:
- **Public Endpoints (Customer Facing)**: Scope queries strictly by `req.tenant.id` or `accessToken`. For example, `GET /public-visit/:accessToken` queries only visits matching that specific cryptographically random token.
- **Protected Endpoints (Staff & Admin Dashboard)**: The `AuthGuard('jwt')` injects the authenticated `req.user`. Every subsequent database query explicitly injects:
  ```typescript
  where: {
    tenantId: req.user.tenantId,
    // ...resource filters
  }
  ```

### 3. Tenant Boundary Integrity Checklist
- **No Shared Keys**: Unique primary keys (`id: uuid()`) and non-sequential public access tokens (`accessToken: uuid()`) prevent enumeration attacks.
- **Relational Integrity**: Operational models (`Queue`, `Visit`, `Service`, `Location`, `Staff`, `Customer`, `Appointment`, `ServiceFlow`, `VisitStep`) hold explicit foreign keys to `Tenant(id)` with `onDelete: Cascade`.
- **Cross-Tenant Mutation Shield**: If User A from Tenant X submits an update for Resource ID belonging to Tenant Y, the database query matches zero rows (`where: { id: resourceId, tenantId: userTenantId }`), resulting in a safe `404 Not Found` rather than unauthorized mutation.

