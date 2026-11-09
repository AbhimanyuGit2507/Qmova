# Customer Directory & CRM (`/dashboard/people`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/people/index.tsx`
- **Route Path**: `/dashboard/people`
- **Target Audience**: Customer relationship managers, clinic administrators, receptionists, and marketing leads.
- **Key Dependencies**: React (`useState`, `useMemo`), `AdminLayout`, TanStack Query (`useInfiniteQuery`, `useQuery`), `CustomerDrawer`, `VisitDrawer`, `InvoiceModal`, `lib/invoicePdf`, `DatePicker`, Lucide Icons, `useLocation`, `useAuth`.

---

## 2. Frontend Architecture & CRM Capabilities
- **Customer CRM Directory**:
  - Filterable directory showing customer full name, phone number, email address, total lifetime visits, total spend, and average satisfaction rating.
  - Infinite scroll query pagination (`useInfiniteQuery`) for high-volume customer databases (10,000+ records) without browser performance degradation.
  - Search bar supporting real-time fuzzy matching against phone numbers and names.
- **Customer Dossier Drawer (`CustomerDrawer`)**:
  Clicking any customer opens a sliding panel containing:
  - Chronological timeline of all historical visits across all branches.
  - Recorded staff notes and VIP tags.
  - Historical CSAT reviews and verbatim feedback text.
  - Invoices and transaction payment history with one-click PDF generation (`downloadInvoicePdf`).
  - Direct WhatsApp messaging button triggering 2-way chat drawer.

---

## 3. Backend Integration & Data Aggregation
- **API Endpoints**:
  - `GET /customer?page=...&limit=...&search=...` (`backend/src/customer/customer.controller.ts`).
  - `GET /customer/:id/history` (Aggregated visit and appointment ledger).
  - `PATCH /customer/:id` (Updates contact details, VIP status, notes).
  - `GET /invoice/customer/:id` (Lists all paid and pending invoices).
- **Prisma Relational Aggregations**:
  Queries join `Customer` with `_count.visits`, calculating aggregate lifetime value and average rating directly in PostgreSQL using indexed relational joins.

---

## 4. Architecture & System Design
- **Phone Number Normalization**: Normalized using international E.164 formats, ensuring cross-channel consistency across WhatsApp, SMS, and domestic dialing.
- **POPIA / GDPR Compliance Hooks**: Provides administrative hooks to process data subject access requests (SAR) and export customer dossiers.

---

## 5. Business Abstraction & Value Proposition
- **Turn Visits into Relationships**: Moves businesses away from anonymous paper token transactions into rich customer relationship management.
- **VIP & Repeat Identification**: Front desk receptionists instantly identify returning VIP customers, viewing their preferences and past notes before they even sit down at the counter.

