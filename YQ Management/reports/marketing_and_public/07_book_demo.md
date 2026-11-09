# Book a Demo Page (`/book-demo`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/book-demo/index.tsx`
- **Route Path**: `/book-demo`
- **Target Audience**: Mid-market and enterprise buyers seeking a personalized product walkthrough with a solutions architect before signing a commercial agreement.
- **Key Dependencies**: React (`useState`), `MarketingLayout`, `fetchApi` (`lib/api`), Sonner `toast`, Lucide Icons (`Calendar`, `MonitorPlay`, `CheckCircle2`, `ArrowRight`, `Loader2`, `Sparkles`, `Shield`, `Building`, `Users`, `Smartphone`).

---

## 2. Frontend Architecture & UI/UX Audit
- **Granular Lead Qualification State**:
  - `name`, `email`, `companyName`, `phone`.
  - `industry`: Multi-industry selector (`healthcare`, `retail`, `food_beverage`, `civic_government`, `salon_spa`, `automotive`, `banking_finance`, `other`).
  - `locationsCount`: Scale indicator (`1-3`, `4-10`, `11-50`, `50+`).
  - `monthlyVisitors`: Traffic volume indicator (`Under 1,000`, `1,000 - 5,000`, `5,000 - 20,000`, `20,000+`).
  - `primaryGoal`: Strategic objective selector (`reduce_wait_times`, `modernize_front_desk`, `automate_whatsapp`, `multi_stage_journeys`, `in_queue_payments`).
  - `notes`: Specific questions, legacy system migration notes, or integration requirements.
- **Conversion UX**: Two-column layout pairing social proof indicators (security compliance badges, live throughput figures, customer testimonials) on the left with the structured booking form on the right.

---

## 3. Backend Integration & Data Flow
- **API Endpoint**: `POST /billing/enterprise-inquiries` (`backend/src/billing/enterprise-inquiry.controller.ts`).
- **Structured Payload Serialization**:
  ```typescript
  const formattedMessage = `[DEMO REQUEST]
  Industry: ${formData.industry}
  Locations: ${formData.locationsCount}
  Monthly Visitors: ${formData.monthlyVisitors}
  Primary Goal: ${formData.primaryGoal}
  Notes: ${formData.notes || 'None provided'}`;

  await fetchApi('/billing/enterprise-inquiries', {
    method: 'POST',
    body: JSON.stringify({
      name: formData.name.trim(),
      email: formData.email.trim(),
      companyName: formData.companyName.trim(),
      phone: formData.phone.trim() || undefined,
      message: formattedMessage,
    }),
  });
  ```
- **Super Admin Inquiries Portal**: Leads immediately appear in the platform operator's cockpit (`/super-admin/inquiries`) with full industry and scale tags for qualification.

---

## 4. Architecture & System Design
- **Deterministic Pipeline**: Reuses the hardened `EnterpriseInquiry` database entity while encoding rich multi-parameter survey responses in a structured header block.
- **Client Side Validation**: Validates work email patterns and telephone numbers to prevent junk bot registrations.

---

## 5. Business Abstraction & Value Proposition
- **High-ACV Lead Pipeline**: The primary entry gate for deals with Annual Contract Values (ACV) between R30,000 and R250,000+.
- **Pre-Demo Sales Intelligence**: Gives account executives complete operational context (number of branches, patient volume, key pain point) before the first demo call, increasing close rates by over 50%.

