# Global Communications & Messaging Gateway (`/super-admin/communication`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/communication/index.tsx`
- **Route Path**: `/super-admin/communication`
- **Target Audience**: Platform Super Administrators and telecommunications engineers managing system-wide SMS, WhatsApp, and Email relay channels.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `react-qr-code`, Lucide Icons (`Mail`, `Send`, `MessageSquare`, `Key`, `QrCode`, `RefreshCw`, `ShieldCheck`, `Smartphone`, `Sparkles`, `Server`, `Zap`).

---

## 2. Frontend Architecture & Gateway Control
- **Interactive Multi-Rail Testing Workbench (`activeTab`)**:
  - **Tab 1: Email & OTP Delivery Rail**:
    - Tests live Brevo SMTP / API connection.
    - Test Email Dispatcher: Enter recipient email, select message type (`standard` vs. `otp`), and click "Send Verification Test".
    - Displays sent OTP code and delivery response ID in real time.
  - **Tab 2: WhatsApp Evolution Gateway Rail**:
    - Tests live Evolution API connection status and webhook endpoints.
    - Test WhatsApp Dispatcher: Enter phone number with country code, select message type (`standard` vs. `otp`), and dispatch live test ping.
    - Displays delivery confirmation and provider response.
  - **Tab 3: Digital Signage QR Verification Rail**:
    - Live QR code generator and test harness verifying that kiosk and TV URLs serialize properly.
  - **Tab 4: Payments & Gateways Health Rail**:
    - Checks live credentials and operating mode (Sandbox vs. Production) for Ozow and Paystack.

---

## 3. Backend Integration & Diagnostic Endpoints
- **API Endpoints**:
  - `GET /super-admin/communication/status` (`backend/src/super-admin/super-admin.controller.ts`).
  - `GET /super-admin/communication/email/connection` (Pings Brevo API).
  - `POST /super-admin/communication/test-email` (Dispatches test email).
  - `POST /super-admin/communication/test-whatsapp` (Dispatches test WhatsApp message).
  - `GET /super-admin/whatsapp-instances` (Lists all active Evolution API containers).
- **Communication Logging**:
  Every diagnostic test automatically records an entry in `CommunicationLog` (`channel`, `type`, `recipient`, `status`, `providerId`, `errorMessage`).

---

## 4. Architecture & System Design
- **Real-Time Telecommunication Diagnostics**:
  Exposes live operational metadata:
  - Email Provider: `Brevo (SMTP / RELAY)`
  - WhatsApp Provider: `Evolution API (Multi-tenant instance model)`
  - Payment Provider: `Ozow / Paystack / Stripe`
  - OTP Engine: `Redis OTP Storage (5 min expiry)`

---

## 5. Business Abstraction & Value Proposition
- **Carrier & Gateway Health Visibility**: Allows platform operations to verify telecommunications delivery health in 5 seconds without inspecting server SSH terminal logs.
- **Customer Issue Triage**: When a tenant reports "Our customers aren't receiving WhatsApp tickets", Super Admin can fire a diagnostic test from this panel to immediately isolate whether the issue is with the tenant's phone pairing or the global WhatsApp server.

