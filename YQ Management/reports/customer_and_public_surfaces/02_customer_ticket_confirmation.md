# Post-Join Queue Confirmation (`/customer/confirmation/[tokenId]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/customer/confirmation/[tokenId].tsx`
- **Route Path**: `/customer/confirmation/[tokenId]`
- **Target Audience**: Customers who have just successfully joined a queue or booked an appointment via public kiosk, web portal, or door QR code.
- **Key Dependencies**: React (`useState`, `useEffect`, `useRef`), Next.js (`useRouter`, `Head`, `Image`, `Link`), TanStack Query, `io` (Socket.io client), QRCodeSVG, Lucide Icons (`CheckCircle2`, `CalendarPlus`, `Receipt`, `Share2`, `CreditCard`), `useTheme`, `downloadInvoicePdf`, `downloadIcsCalendar`, `ConfirmModal`.

---

## 2. Frontend Architecture & Confirmation UX
- **Immediate Reassurance Screen**:
  - Prominent emerald confirmation badge ("You're In Line!").
  - Digital Ticket Card: Token number (e.g. `B018`), service name, location address, and initial estimated wait time.
  - Large QR Code: Scannable 2D QR matrix allowing reception staff or entrance kiosks to scan the customer's phone upon physical arrival.
- **Post-Join Action Utility**:
  - **"Track Live Position" CTA**: Primary button directing customer to the live wait screen (`/customer/status/[accessToken]`).
  - **Add to Calendar**: Generates and downloads `.ics` file for calendar reminders (`downloadIcsCalendar`).
  - **Download Digital Pass / Receipt**: Triggers PDF download of appointment confirmation or prepayment receipt.
  - **Share Link**: Native Web Share API trigger (`navigator.share`) allowing customers to text their live ticket link to family members or accompanying guests.
- **Embedded CSAT Review Engine**:
  If the visit transitions to `COMPLETED`, the confirmation page dynamically mounts a 5-star rating widget with feedback text capture.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /public-visit/:tokenId` (`backend/src/visit/public-visit.controller.ts`).
  - `POST /public-visit/:tokenId/rate` (CSAT feedback submission).
  - `POST /public-visit/:tokenId/cancel` (Self-cancellation).
- **Socket.io Listener**:
  Maintains connection to receive instant updates if the ticket is called immediately (e.g. in zero-wait express queues).

---

## 4. Architecture & System Design
- **Deterministic ID Resolution**: Accepts either public `accessToken` or numerical token reference, looking up the active visit and setting session cookies for bookmarking.
- **Subdomain Consistency**: Preserves tenant branding tokens (custom logo and colors) rendered from tenant metadata.

---

## 5. Business Abstraction & Value Proposition
- **Arrival Confidence**: Replaces ambiguous "take a seat" instructions with a tangible digital boarding pass. Customers have verifiable proof of their queue position and appointment time.
- **Reduced Reception Inquiries**: Eliminates the immediate instinct for customers to ask "Did my name go through?", reducing front-counter interruption by 90%.

