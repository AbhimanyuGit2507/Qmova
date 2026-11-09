# Digital Signage Display Picker (`/dashboard/display-picker`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/display-picker.tsx`
- **Route Path**: `/dashboard/display-picker`
- **Target Audience**: Floor managers, IT administrators, and receptionists connecting physical waiting room monitors and TV displays to live queue feeds.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), `AdminLayout`, TanStack Query, `useAuth`, `lib/utils`.

---

## 2. Frontend Architecture & Screen Launcher
- **Display Matrix Interface**:
  - Displays all active queues across the tenant workspace.
  - For each queue, provides:
    - Queue name, token prefix, and assigned location name.
    - Active waiting count and currently served tokens.
    - Two launch buttons:
      1. **"Launch TV Mode (Full Screen)"**: Opens the dedicated waiting room digital signage screen (`/tv/[tenantId]?queueId=...` or `/public/display/[id]`) in a clean fullscreen browser window.
      2. **"Copy Public Display URL"**: Copies the direct URL to clipboard for configuring on dedicated smart TV sticks (Fire TV, Google TV, Raspberry Pi).
- **Setup Guidance Box**: Instructions for casting via Google Chromecast, Apple AirPlay, or hardwired HDMI cables.

---

## 3. Backend Integration & Public Display Endpoints
- **API Endpoints**:
  - `GET /queue` (`backend/src/queue/queue.controller.ts`).
  - Target URL references public display endpoints: `GET /public/display/:id` and `GET /tv/:tenantId`.
- **Public Security Scoping**:
  The resulting TV display surface is strictly read-only and non-authenticated. It renders public token identifiers (`A042`) and counter numbers (`Counter 3`) without exposing customer phone numbers, private notes, or financial data.

---

## 4. Architecture & System Design
- **Subdomain-Aware URL Generation**: Utilizes `getTenantUrl(tenant, path)` to ensure generated display URLs point to the tenant's branded subdomain (`acme.qmova.com/tv/...`), maintaining brand consistency on lobby screens.
- **Auto-Kiosk Mode Support**: URLs generated support query parameters (`?fullscreen=true&audio=true&theme=dark`) enabling automated kiosk auto-start scripts.

---

## 5. Business Abstraction & Value Proposition
- **Turnkey Lobby Entertainment & Signage**: Eliminates the need for expensive third-party digital signage software subscriptions (which typically cost $30–$50 per screen per month). Qmova includes unlimited digital signage screens natively.
- **Audible Waiting Room Clarity**: High-visibility TV screens paired with synthetic voice calling eliminate crowded counter congestion, allowing customers to sit comfortably until their number is called.

