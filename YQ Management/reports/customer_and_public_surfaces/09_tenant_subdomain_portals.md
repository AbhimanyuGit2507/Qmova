# Branded Tenant Subdomain Portals (`/_tenant/[subdomain]/*`) Deep Audit

## 1. File & Component Metadata
- **Source Directory**: `frontend/src/pages/_tenant/[subdomain]/`
- **Subpage Manifest**:
  - `index.tsx`: Root landing on tenant subdomain (redirects to `/booking`).
  - `booking/[[...slug]].tsx`: Multi-step branded public appointment scheduling.
  - `booking/status.tsx`: Branded appointment status confirmation.
  - `checkin/index.tsx`: Self-service on-site QR/mobile customer check-in.
  - `pay/[paymentId].tsx`: Branded Stripe/Paystack checkout terminal.
  - `status/[tokenId].tsx`: Branded real-time customer mobile wait screen.
  - `tv/[tenantId].tsx`: Branded waiting room digital signage TV screen.
- **Route Namespace**: Dynamically rewritten from `https://[subdomain].qmova.com/*` or `https://qmova.com/t/[subdomain]/*`.
- **Target Audience**: All public customers and patients interacting with a specific business's branded services.

---

## 2. Frontend Architecture & Subdomain Rewriting Pipeline
- **Next.js Edge Middleware Orchestration**:
  Requests arriving on `dr-smith.qmova.yqbuddy.com/booking` are parsed by `frontend/src/middleware.ts`.
  The edge middleware extracts `subdomain = 'dr-smith'` and rewrites the request internally to:
  `/_tenant/dr-smith/booking`
  The browser URL bar remains clean and branded (`https://dr-smith.qmova.yqbuddy.com/booking`).
- **Path-Based Routing Fallback**:
  For development testing or environments where wildcard DNS is restricted, the middleware supports explicit path rewrites:
  `qmova.com/t/dr-smith/booking` -> `/_tenant/dr-smith/booking`.
- **Tenant Context Hydration**:
  Every subpage in `_tenant/[subdomain]` queries `GET /tenant/public/:subdomain`, extracting tenant brand metadata:
  - Custom brand logo (`logoUrl`).
  - Primary theme color (`brandColor`).
  - Location address, business telephone, and operating hours.

---

## 3. Subpage Breakdown & Operational Roles

| Subpage Route | Functional Role & Architecture |
| :--- | :--- |
| `_tenant/[subdomain]/index.tsx` | Resolves tenant metadata; automatically redirects to `_tenant/[subdomain]/booking`. |
| `_tenant/[subdomain]/booking/[[...slug]].tsx` | Multi-step booking flow: Branch selection -> Service/Doctor -> Slot calendar -> Intake questions -> Payment. |
| `_tenant/[subdomain]/checkin/index.tsx` | Direct customer check-in screen. Customers enter their phone or scan entrance QR to confirm arrival. |
| `_tenant/[subdomain]/pay/[paymentId].tsx` | Direct checkout terminal. Settle consultation deposits or walk-in bills via Stripe Elements or Paystack Inline. |
| `_tenant/[subdomain]/status/[tokenId].tsx` | Dedicated live wait screen operating under the tenant's exact brand banner and custom CSS variables. |
| `_tenant/[subdomain]/tv/[tenantId].tsx` | Dedicated lobby TV screen displaying only tokens belonging to this specific tenant's physical branches. |

---

## 4. Architecture & System Design
- **Cross-Tenant Isolation Shield**:
  - Edge middleware checks if candidate subdomain exists via fast backend probe. If the subdomain is invalid, redirects safely to apex home (`/`).
  - Backend queries use `WHERE tenantId = ...`, making it impossible for a customer on `clinic-a.qmova.com` to see tickets, queues, or doctors from `clinic-b.qmova.com`.
- **Cookie Scope Segregation**:
  Tenant session cookies are scoped to prevent collision with platform administrative tokens.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Brand Authority**: Enterprise clients demand complete white-label isolation. By providing dedicated subdomains with custom logos, Qmova functions as invisible digital infrastructure.
- **Viral Business Visibility**: Every branded link shared by a salon or clinic on social media promotes their business directly while utilizing Qmova's scalable cloud core.

