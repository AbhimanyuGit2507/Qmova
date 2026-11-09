# Global Integrations Hub (`/super-admin/integrations`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/integrations/index.tsx`
- **Route Path**: `/super-admin/integrations`
- **Target Audience**: Infrastructure leads and technical administrators configuring global third-party service connections.
- **Key Dependencies**: React, `SuperAdminLayout`, TanStack Query, `fetchApi`, Lucide Icons (`Globe`, `Key`, `Layers`, `ShieldCheck`).

---

## 2. Frontend Architecture & Global Connectors
- **Unified Provider Matrix**:
  - **WhatsApp Global API (Evolution API v2)**: Displays primary server connection URL, master API key status, and global webhook listeners. Includes instant connection test harness.
  - **Stripe Connect Platform**: Shows Stripe platform client IDs, webhook signing secrets, and live charges mode.
  - **Paystack Merchant Aggregator**: Shows master site credentials and banking clearance status.
  - **Brevo Email Relay**: Configuration status for global platform transactional emails and OTP delivery.
  - **Twilio SMS Fallback**: Shows SMS gateway credentials utilized when WhatsApp is unavailable.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /super-admin/integrations` (`backend/src/super-admin/super-admin.controller.ts`).
  - `POST /super-admin/integrations/test`.
- **Environment & Key Management**:
  Integrates with backend `ConfigService`, evaluating environment variables:
  - `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `PAYSTACK_SECRET_KEY`
  - `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`

---

## 4. Architecture & System Design
- **Credential Masking**: Sensitive API private keys and signing secrets are masked (`sk_live_...4a2b`) before transmission to the frontend, preventing credential leakage in browser inspection tools.
- **Health Verification Probes**: Provides diagnostic ping buttons to independently test connection latency to each upstream cloud provider.

---

## 5. Business Abstraction & Value Proposition
- **Infrastructure Command**: Gives platform operators a single control pane to monitor the health of all upstream third-party APIs that power the SaaS.
- **Rapid Debugging**: Eliminates SSH terminal investigations by visually confirming third-party API availability in one click.

