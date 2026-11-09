# Enterprise Inquiries & Sales Leads CRM (`/super-admin/inquiries`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/inquiries/index.tsx`
- **Route Path**: `/super-admin/inquiries`
- **Target Audience**: Business development leads, enterprise sales representatives, and platform founders managing high-value inbound demo requests.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Inbox`, `Search`, `Mail`, `Phone`, `Building2`, `Calendar`, `CheckCircle2`, `Clock`, `ArrowRight`).

---

## 2. Frontend Architecture & Lead Pipeline
- **Enterprise Lead Roster**:
  - Displays inquiries submitted via `/contact` and `/book-demo`.
  - Filter by Status: `ALL`, `PENDING` (Uncontacted), `CONTACTED` (In progress), `CLOSED` (Converted or rejected).
  - Search Bar: Filters by lead name, company name, email, or telephone.
  - Table Columns: Lead Name, Company, Email, Phone, Submission Date, Structured Goal Tags, Status Badge, and Action Menu.
- **Lead Dossier Inspection Modal**:
  - Displays full submitted payload including:
    - Target Industry (e.g. Healthcare, Banking, Logistics).
    - Physical Locations Scale (e.g. `11-50 branches`).
    - Monthly Visitor Traffic (e.g. `20,000+ visitors`).
    - Primary Strategic Objective (e.g. Reduce Wait Times, Multi-Stage Journeys).
    - Custom Notes and legacy system details.
  - One-click "Mark Contacted" and "Mark Closed" status transition buttons.
  - Quick action buttons to launch direct WhatsApp chat or email response.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /billing/enterprise-inquiries` (`backend/src/billing/enterprise-inquiry.controller.ts`).
  - `PATCH /billing/enterprise-inquiries/:id` (Updates status and internal sales notes).
  - `DELETE /billing/enterprise-inquiries/:id` (Archive inquiry).
- **Database Model (`EnterpriseInquiry`)**:
  Stored in PostgreSQL:
  - `id`: Unique identifier.
  - `name`: Full name of prospect.
  - `email`: Work email address.
  - `companyName`: Target enterprise entity.
  - `phone`: Mobile / office telephone number.
  - `message`: Serialized inquiry details.
  - `status`: `PENDING`, `CONTACTED`, `RESOLVED`, `CLOSED`.
  - `createdAt` / `updatedAt`: Timestamps.

---

## 4. Architecture & System Design
- **Lead Capture Assurance**: Inquiries submitted through public marketing pages bypass tenant isolation rules, persisting safely into the global enterprise database even if public traffic surges.
- **Immediate Team Alerts**: When an enterprise lead with 10+ branches submits a request, backend triggers automated notification alerts to the platform executive team.

---

## 5. Business Abstraction & Value Proposition
- **High-ACV Deal Pipeline**: Functions as the primary qualification engine for deals generating R50,000–R250,000+ in annual contract value (ACV).
- **Zero Lead Leakage**: Ensures no enterprise demo request is lost in email spam filters, tracking response SLAs from submission to first sales contact.

