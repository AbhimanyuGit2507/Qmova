# Workspace & Brand Identity Settings (`/dashboard/settings/workspace`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/workspace.tsx`
- **Supporting Components**:
  - `frontend/src/components/settings/workspace.tsx` (Identity tab)
  - `frontend/src/components/settings/experience.tsx` (Customer View tab)
  - `frontend/src/components/settings/qr-codes.tsx` (Info & QR tab)
- **Route Path**: `/dashboard/settings/workspace`
- **Target Audience**: Business owners and marketing leads managing white-label branding, subdomains, and customer interface settings.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`.

---

## 2. Frontend Architecture & Brand Configuration Tabs
- **Tab 1: Identity & Subdomain**:
  - Company Legal Name and Display Name.
  - Custom Subdomain assignment (`[subdomain].qmova.com`): Inputs validate regex patterns (`^[a-z0-9-]+$`).
  - Brand Logo Uploader (`/upload/logo`): Supports PNG/SVG file uploads with instant preview and dark/light mode rendering checks.
  - Brand Accent Color Picker: Custom hex picker controlling button colors, ticket banners, and TV display highlights.
- **Tab 2: Customer View & Experience Rules**:
  - Live Queue Transparency toggles: Show/hide exact wait times in minutes (EWT), show/hide queue length numbers.
  - Ticket Cancellation Permissions: Allow or prevent customers from self-canceling tickets from mobile wait screens.
  - Audio Chime Settings: Select chime tones (Modern Bell, Soft Ding, Voice Chime).
- **Tab 3: Workspace Info & Operating Hours**:
  - Primary contact telephone, support email, default business timezone (e.g. `Africa/Johannesburg`), and localized currency.

---

## 3. Backend Integration & Entity Mutation
- **API Endpoints**:
  - `GET /tenant/me` (`backend/src/tenant/tenant.controller.ts`).
  - `PATCH /tenant/me` (Updates `name`, `subdomain`, `logoUrl`, `brandColor`, `settings`).
  - `POST /upload` (Uploads image assets).
- **Subdomain Uniqueness & Reserved Validation**:
  Backend verifies subdomain uniqueness across the entire platform and checks against reserved names (`api`, `app`, `www`, `evo`, `admin`, `superadmin`), returning a `400 ConflictException` if an already-claimed subdomain is requested.

---

## 4. Architecture & System Design
- **Edge Cache Invalidation**: Modifying the subdomain or brand colors invalidates the Redis edge cache (`cache:tenant:subdomain:{subdomain}`), propagating changes to client browsers within 60 seconds.
- **CSS Custom Properties Injection**: The chosen `brandColor` is injected dynamically into customer surfaces via CSS variables (`--primary: ${tenant.brandColor}`).

---

## 5. Business Abstraction & Value Proposition
- **Total White-Label Empowerment**: Customers never feel like they are using a third-party tool. The booking page, mobile wait screen, and lobby TV display seamlessly project the clinic or salon's native brand identity.
- **Brand Trust**: Professional logo presentation and branded subdomains eliminate phishing concerns and instill confidence in digital queue transactions.

