# Integrations & Communications Settings (`/dashboard/settings/integrations`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/integrations.tsx`
- **Supporting Components**:
  - `whatsapp.tsx` (WhatsApp QR pairing & status)
  - `message-templates.tsx` (Automated messaging copy)
  - `announcements.tsx` (AI Speech announcements)
  - `webhooks.tsx` (Outbound webhook endpoints)
  - `google-business.tsx` (Google Calendar & Reviews sync)
- **Route Path**: `/dashboard/settings/integrations`
- **Target Audience**: IT administrators, marketing directors, and technical operations leads configuring external service bridges.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`.

---

## 2. Frontend Architecture & Multi-Integration Hub
- **Tab 1: WhatsApp Gateway Integration**:
  - Displays live connection status: `Connected` (Emerald), `Connecting` (Amber), `Disconnected` (Red).
  - Multi-Device QR Code pairing screen: Generates live Baileys / Evolution API pairing QR code. Staff scans the code from WhatsApp mobile app (Linked Devices) to bind the business phone line in seconds.
  - "Disconnect / Re-pair" buttons with safety confirmations.
- **Tab 2: Messaging Templates**:
  - Configures automated message copy and placeholders (`{{customerName}}`, `{{token}}`, `{{serviceName}}`, `{{ewt}}`, `{{statusUrl}}`) for:
    - Ticket Joined Confirmation.
    - 5-Minute Arrival Warning.
    - Token Called Alert.
    - Service Completed & Review Request.
- **Tab 3: AI Speech Announcements**:
  - Configures voice synthesis for waiting room TV screens and counter stations.
  - Tone, pitch, speed, and language accent selectors (e.g. English South Africa, English US, Zulu, Afrikaans).
- **Tab 4: Outbound Webhooks**:
  - Configure target HTTPS endpoints and signing secrets.
  - Subscribes to platform events: `visit.created`, `visit.called`, `visit.completed`, `payment.succeeded`.
  - Live test delivery button and event delivery logs.
- **Tab 5: Google Integration**:
  - 2-Way Google Calendar synchronization with OAuth consent callback listener (`?googleAuth=success`).

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /whatsapp/status` & `POST /whatsapp/connect`, `POST /whatsapp/disconnect` (`backend/src/whatsapp/whatsapp.controller.ts`).
  - `GET /webhooks` & `POST /webhooks`, `DELETE /webhooks/:id` (`backend/src/webhooks/webhooks.controller.ts`).
  - `GET /integrations/google/auth-url` (`backend/src/integrations/google/google.controller.ts`).
  - `GET /communication/templates` (`backend/src/communication/communication.controller.ts`).
- **BullMQ Queue Processing**:
  Outgoing webhooks are processed by `BullMQ` queue `queue_webhooks` with 5 automatic retries using exponential backoff, preventing slow third-party webhooks from stalling core database operations.

---

## 4. Architecture & System Design
- **Instance Isolation**: Evolution API instances are provisioned with dedicated namespaced instances (`tenant_{tenantId}`), ensuring complete session isolation so one tenant's WhatsApp disconnection never affects another tenant.
- **HMAC SHA-256 Webhook Signatures**: Outbound webhook requests include `X-Qmova-Signature` calculated with the endpoint's secret key, enabling receiving servers to verify payload authenticity.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Extensibility**: Enables seamless interoperability with legacy Electronic Health Records (EHR), hospital management systems (Epic, Cerner), Point of Sale (POS) terminals, and corporate Zapier/Make automations.
- **Carrier Independence**: Native WhatsApp pairing completely bypasses expensive SMS aggregator per-message fees, saving high-volume businesses thousands of dollars in monthly telecommunications costs.

