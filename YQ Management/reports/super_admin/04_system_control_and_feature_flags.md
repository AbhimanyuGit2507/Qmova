# System Control & Service Kill-Switches (`/super-admin/system-control`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/system-control/index.tsx`
- **Route Path**: `/super-admin/system-control`
- **Target Audience**: Infrastructure reliability engineers, lead system architects, and platform Super Admins managing operational feature flags and emergency kill-switches.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, Lucide Icons (`Sliders`, `Power`, `RefreshCw`, `Mail`, `CreditCard`, `Server`, `Zap`, `Cpu`).

---

## 2. Frontend Architecture & Service Control Center
- **Service Configuration Cards (`SERVICE_CONFIGS`)**:
  - **Backend Keep-Alive Cron**: Toggles the 14-minute automated health check ping (`/health`) designed to prevent cloud hosting containers from entering sleep states.
  - **WhatsApp Keep-Alive Service**: Toggles the periodic status query pinging Evolution API v2 to guarantee constant messaging connection readiness.
  - **Email Infrastructure Relay**: Toggles the transactional Brevo email delivery engine (can be paused during provider outages or planned migrations).
  - **Payment Gateway Processing**: Emergency kill-switch pausing Stripe / Paystack customer checkout operations.
  - **Global Registration Lock**: Restricts self-serve registration (`/register`) to invite-only mode during closed beta testing or heavy load spikes.
- **Diagnostic Testing Pods**:
  - Live "Test Backend Keep-Alive" ping button with real-time response time readout.
  - Live "Test WhatsApp Bridge" ping button measuring gateway latency.

---

## 3. Backend Integration & Dynamic Configuration
- **API Endpoints**:
  - `GET /super-admin/communication/status` (`backend/src/super-admin/super-admin.controller.ts`).
  - `POST /super-admin/system-control/toggle`.
- **In-Memory Flag Storage**:
  System toggle flags are stored in Redis (`system:flags:{key}`) and cached in Node.js memory. When an emergency kill switch is flipped, the change propagates across all backend instances in under 1 second via Redis Pub/Sub without requiring server restarts.

---

## 4. Architecture & System Design
- **Fail-Safe Circuit Breaker**: If third-party messaging providers (e.g. Meta WhatsApp API) experience global downtime, flipping the WhatsApp flag pauses outbound queue attempts and transitions the system to SMS fallback, preventing queue worker crashes.
- **Maintenance Overlay (`MaintenanceOverlay.tsx`)**: Global maintenance mode flag displays an emergency maintenance banner to tenants while keeping Super Admin access open for remediation.

---

## 5. Business Abstraction & Value Proposition
- **Operational Risk Defense**: Protects the platform from catastrophic compounding failures during upstream provider outages.
- **Seamless Infrastructure Maintenance**: Enables zero-downtime maintenance windows by selectively pausing background queue dispatchers while keeping customer read endpoints live.

