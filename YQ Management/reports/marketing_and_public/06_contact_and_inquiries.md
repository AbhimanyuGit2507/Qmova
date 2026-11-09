# Contact & Inquiries Page (`/contact`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/contact/index.tsx`
- **Route Path**: `/contact`
- **Target Audience**: General prospective buyers, enterprise partners, support seekers, and media inquiries.
- **Key Dependencies**: React (`useState`), `MarketingLayout`, `fetchApi` (`lib/api`), Sonner `toast`, Lucide Icons (`Mail`, `MessageSquare`, `Building2`, `Phone`, `Clock`, `ShieldCheck`, `CheckCircle2`, `ArrowRight`, `Loader2`, `Sparkles`).

---

## 2. Frontend Architecture & UI/UX Audit
- **Form State Model**:
  - `name`: Full customer contact name.
  - `email`: Corporate or personal email address.
  - `companyName`: Target business or organization name.
  - `phone`: Customer contact telephone / WhatsApp number.
  - `inquiryType`: Dropdown selector (`sales`, `support`, `partnership`, `billing`).
  - `message`: Free-form inquiry text.
- **Validation & UX**:
  - Client-side trimming and required field validation with instant Sonner toast alerts.
  - `loading` state disables submit button and displays rotating `Loader2` spinner to prevent duplicate submissions.
  - Upon successful dispatch, transitions to a celebratory confirmation state (`submitted = true`) with green checkmark banner and response SLA promise ("Our team typically responds within 2 business hours").

---

## 3. Backend Integration & Data Flow
- **API Endpoint**: `POST /billing/enterprise-inquiries` (`backend/src/billing/enterprise-inquiry.controller.ts`).
- **Payload Composition**:
  ```typescript
  const payload = {
    name: formData.name.trim(),
    email: formData.email.trim(),
    companyName: formData.companyName.trim(),
    phone: formData.phone.trim() || undefined,
    message: `[Topic: ${formData.inquiryType.toUpperCase()}] ${formData.message.trim()}`,
  };
  ```
- **Database Model**: Persisted into PostgreSQL `EnterpriseInquiry` table (`id`, `name`, `email`, `companyName`, `phone`, `message`, `status: PENDING`, `createdAt`).
- **Notification Trigger**: Backend triggers notification to sales administrators for immediate follow-up.

---

## 4. Architecture & System Design
- **Rate-Limiting Protection**: Inherits global `ThrottlerGuard` protections (max 100 requests / min) and input length limits to block automated spam bots.
- **Fail-Safe Error Handling**: Network or server errors are caught and surfaced via user-friendly toast messages without unmounting the form or clearing entered data.

---

## 5. Business Abstraction & Value Proposition
- **High-Touch Sales Channel**: Acts as the primary capture funnel for non-standard enterprise inquiries (multi-hospital deployments, government tenders, custom API integrations).
- **Lead Qualification**: Inquiry categorization allows sales operations to instantly route support questions away from enterprise sales reps, optimizing response speed.

