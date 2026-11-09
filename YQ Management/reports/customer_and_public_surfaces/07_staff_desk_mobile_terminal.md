# Standalone Mobile Staff Terminal (`/staff-desk/[token]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/staff-desk/[token].tsx`
- **Route Path**: `/staff-desk/[token]`
- **Target Audience**: Mobile service providers, roaming attendants, part-time doctors, external salon stylists, and kitchen cooks using personal smartphones or tablets without requiring full corporate login accounts.
- **Key Dependencies**: React (`useState`, `useEffect`, `useCallback`), Next.js `useRouter`, `Head`, `fetchApi`, `AuthStorage`, `MyDeskProvider`, `useMyDesk`, `renderWidget`, Lucide Icons (`LayoutDashboard`, `RefreshCw`, `MapPin`, `Briefcase`, `Clock`, `AlertCircle`, `Monitor`).

---

## 2. Frontend Architecture & Token-Based Mobile Workstation
- **Passwordless Ephemeral Access**:
  - Staff members access their desk station via a cryptographically random, secret URL token (e.g., `/staff-desk/stf_tok_9f8a7b6c5d4e`).
  - No email or password login required; the token directly authenticates the specific staff session.
- **Mobile-Responsive Widget Canvas**:
  - Automatically loads the staff member's assigned layout from `staff.tenant.staffViewLayout`.
  - Re-maps 2D desktop grid widgets into a mobile single-column card stack optimized for vertical thumb scrolling on smartphones.
  - Allows staff to view:
    - Active customer assigned to their counter.
    - One-click "Next Stage" or "Complete".
    - Waiting line depth for their services.
    - Patient clinical notes / ticket order items.

---

## 3. Backend Integration & Ephemeral Authentication
- **API Endpoints**:
  - `GET /staff/desk-by-token/:token` (`backend/src/staff/staff.controller.ts`).
  - Returns staff profile, assigned services, location metadata, and a scoped temporary session token.
  - Injects `sessionToken` into `AuthStorage` for subsequent ticket calling mutations (`POST /visits/:id/call`, `/start`, `/complete`).
- **Security Validation**:
  Backend verifies token validity, checks if staff member is active, and restricts API mutations strictly to visits assigned to this staff member's service IDs.

---

## 4. Architecture & System Design
- **Bring Your Own Device (BYOD) Friendly**: Designed for fast-paced physical environments where investing in dedicated PC workstations at every chair, bed, or table is cost-prohibitive.
- **Station Template Inheritance**: Respects the same JSON station layout defined in `staffViewLayout`, ensuring visual consistency between desktop and mobile terminals.

---

## 5. Business Abstraction & Value Proposition
- **Extreme Operational Mobility**: Doctors moving between patient examination rooms or hair stylists walking between styling chairs can advance queue tickets, view formulas, and record service completion directly from their pocket device.
- **Reduced IT Provisioning Costs**: Eliminates hardware procurement barriers for multi-chair practices and pop-up events.

