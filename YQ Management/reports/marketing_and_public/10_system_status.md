# System Status Page (`/status`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/status/index.tsx`
- **Route Path**: `/status`
- **Target Audience**: Current tenants, customers experiencing connectivity queries, and platform status aggregators monitoring real-time uptime.
- **Key Dependencies**: React (`useState`, `useEffect`, `useCallback`), `MarketingLayout`, `fetchApi` (`lib/api`), Lucide Icons (`CheckCircle2`, `AlertTriangle`, `RefreshCw`, `Server`, `Activity`, `ShieldCheck`, `Clock`, `Zap`, `ArrowUpRight`), Next.js `Link`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Interactive Health Check**:
  - Automatically executes client-side probe on page mount (`checkHealth()`) and measures live network latency using `performance.now()`.
  - Manual "Refresh Status" button triggering immediate re-ping.
  - Overall status banner: Emerald green `All Systems Operational` when healthy; amber/red `System Degraded / Outage` when heartbeat fails.
- **Subsystem Breakdown**:
  - Core REST API & Auth Gateway
  - WebSocket Real-time Queue Gateway
  - PostgreSQL Multi-tenant Database
  - Redis Cache & Event Broker
  - WhatsApp Delivery Worker
  - Stripe / Paystack Payment Webhooks
  - Kiosk & TV Display Streaming Engine
  - Google Calendar 2-Way Sync Engine
- **Telemetry Indicators**: Latency in milliseconds (e.g. `24ms`), 90-day rolling uptime figures (e.g. `99.99%`), and operational status badges.

---

## 3. Backend Integration & Health Gateway
- **Health Check Endpoint**: `GET /health` (`backend/src/health/health.controller.ts`).
- **Health Verification Logic**:
  - Pings PostgreSQL database via `PrismaService.$queryRaw` (`SELECT 1`).
  - Pings Redis broker (`redisService.client.ping()`).
  - Returns structured health payload (`{ status: 'ok', info: { database: 'up', redis: 'up' }, error: {}, details: {} }`).
  - On failure, returns `503 Service Unavailable` with degraded subsystem diagnosis.

---

## 4. Architecture & System Design
- **Low-Overhead Health Route**: The `/health` route is explicitly excluded from `TenantContextMiddleware` to minimize database overhead during high-frequency automated synthetic uptime monitoring (Pingdom, Datadog, UptimeRobot).
- **Graceful Client Handling**: Catches network failures and displays diagnostic latency measurements without unhandled JavaScript exceptions.

---

## 5. Business Abstraction & Value Proposition
- **Trust & Transparency**: Builds operational trust with healthcare practices and commercial enterprises where waiting room downtime causes immediate physical lobby disruption.
- **Support Deflection**: Customers experiencing local internet issues can check `/status` to verify whether the platform is operational, preventing unnecessary support ticket spikes.

