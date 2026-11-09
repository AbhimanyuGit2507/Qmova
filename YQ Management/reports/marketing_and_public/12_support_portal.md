# Support & Help Center (`/support`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/support/index.tsx`
- **Route Path**: `/support`
- **Target Audience**: Existing tenant owners, reception staff, and end-customers looking for answers to operational questions, troubleshooting tips, or support contact channels.
- **Key Dependencies**: React, `MarketingLayout`, Lucide Icons (`Mail`, `Search`, `BookOpen`, `Settings`, `CreditCard`, `HelpCircle`, `MessageSquare`).

---

## 2. Frontend Architecture & UI/UX Audit
- **Search Header**: Centered search input bar with magnifying glass icon for immediate keyword inquiry.
- **Categorized Knowledge Hub**:
  - `Getting Started`: Workspace initialization, queue creation, and QR signage printing.
  - `Account & Settings`: Managing staff profiles, role permissions, and location hours.
  - `Billing & Plans`: Managing invoices, credit card updates, and subscription upgrades.
  - `Troubleshooting`: Resolving printer disconnects, WhatsApp pairing drops, and browser audio chime permissions.
- **Interactive FAQ Accordion**:
  - Resetting passwords via self-serve links.
  - Upgrading/downgrading plans with automated proration.
  - Connecting WhatsApp via Baileys QR code pairing.
  - Queue limits and location quota explanations.
- **Direct Support Escalation**: Prominent contact banner providing email support (`support@qmova.com`) and direct WhatsApp support assistance.

---

## 3. Backend Integration & Data Flow
- **Static Content Surface**: Self-contained component rendering client-side interactive accordions with zero server latency.
- **Linkage to Dynamic Docs**: Knowledge category cards route directly to deep sections in `/docs/help` and `/docs/product`.

---

## 4. Architecture & System Design
- **High-Availability Design**: Because `/support` is a pure static page, users encountering operational issues with other platform features can always access support resources without obstruction.
- **Responsive Layout**: Adapts from a 4-column card grid on desktop to a stacked single-column view on mobile screens.

---

## 5. Business Abstraction & Value Proposition
- **Support Cost Reduction**: Deflects 60-75% of routine operational queries (password resets, invoice retrieval, QR generation) through self-serve documentation.
- **Customer Churn Prevention**: Swift resolution of initial setup hurdles prevents trial users from abandoning the platform during their 14-day evaluation window.

