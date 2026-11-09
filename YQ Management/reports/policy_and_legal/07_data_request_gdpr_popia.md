# Data Subject Rights & Requests (`/data-request`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Page Controller: `frontend/src/pages/data-request/index.tsx`
  - MDX Content: `frontend/content/docs/legal/data-request.mdx`
  - Backend Customer Privacy Handlers: `backend/src/customer/customer.controller.ts`
- **Route Path**: `/data-request`
- **Target Audience**: End-customers, clinic patients, store visitors, and legal representatives exercising statutory privacy rights.
- **Key Dependencies**: React, Next.js (`GetStaticProps`), `next-mdx-remote`, `MarketingLayout`, `MDXComponents`, `lib/docs.ts`.

---

## 2. Frontend Architecture & Legal Rights Portal
- **Framework Delivery**: Rendered with typography styling via MDXRemote inside `MarketingLayout`.
- **Supported Statutory Rights**:
  1. **Right to Access / Data Portability**: Individual requests an export of all recorded visit records, contact phone numbers, timestamps, and customer notes.
  2. **Right to Rectification**: Correcting misspelled names or updated telephone contact details.
  3. **Right to Erasure ("Right to be Forgotten")**: Demanding complete scrubbing of identifying phone numbers and names from customer CRM history.
  4. **Right to Object / Opt-Out**: Revoking consent for WhatsApp transaction notifications or customer feedback satisfaction surveys.
- **Structured Submission Workflow**: Instructions for filing verified requests via email (`privacy@qmova.com`) with required proof-of-identity steps to prevent fraudulent unauthorized data disclosures.

---

## 3. Backend Implementation & Data Scrubbing Mechanics
- **Customer CRM Erasure**: When a verified deletion request is processed, the backend executes an anonymization routine on `Customer` records:
  ```typescript
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: 'Anonymized Visitor',
      phone: null,
      email: null,
      notes: null,
    },
  });
  ```
- **Visit History Preservation**: While personal identifying details are permanently wiped to respect erasure rights, aggregate numerical operational metrics (wait duration, service time, queue throughput) are preserved to prevent distortion of historical business reporting.

---

## 4. Architecture & System Design
- **POPIA Section 23 / 24 & GDPR Chapter III Compliance**: Directly implements the legal mechanism required to honor access, objection, and deletion requests within statutory response deadlines (30 days).
- **Separation of Concerns**: Segregates public legal instructions from authenticated backend admin operations to maintain security.

---

## 5. Business Abstraction & Value Proposition
- **Statutory Non-Compliance Immunity**: Shields the SaaS platform and its tenant merchants from severe data privacy fines under South Africa's Information Regulator (fines up to R10 million) and EU GDPR (up to 4% of global turnover).
- **Consumer Empowerment**: Elevates end-user trust by giving physical visitors full sovereignty over their digital footprints in queue environments.

