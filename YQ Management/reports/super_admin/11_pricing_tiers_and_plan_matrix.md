# Global Pricing Tiers & Plan Matrix Engine (`/super-admin/pricing`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/pricing/index.tsx`
- **Route Path**: `/super-admin/pricing`
- **Target Audience**: Chief Commercial Officers, SaaS founders, and revenue operations leaders configuring subscription packaging, feature entitlements, and quota limits.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Plus`, `Edit`, `Trash2`, `Check`, `X`, `Shield`, `Loader2`, `BarChart`).

---

## 2. Frontend Architecture & Plan Builder
- **Plan Roster Table**:
  - Displays all configured subscription plans (`Plan` entity).
  - Displays Monthly Price (ZAR), Annual Price, Trial Days (e.g. 14 days), Active Subscribers count, and Feature Checklist.
  - Actions: Create New Plan, Edit Plan, Duplicate Plan, Archive Plan.
- **Granular Plan Editor Modal (`PlanData`)**:
  - **Commercial Terms**: Plan Name, Public Description, Monthly Price, Annual Price, Currency (default `ZAR`), Billing Interval (`monthly` vs. `yearly`), and Trial Period (days).
  - **Feature Entitlement Matrix (`ALL_FEATURES`)**:
    - `whatsappNotifications`: Automated WhatsApp ticket alerts.
    - `whatsappChat`: Two-way WhatsApp chat inbox.
    - `whatsappChatbot`: AI conversational queue bot.
    - `customBranding`: White-label branding (removes "Powered by Qmova").
    - `multiLocation`: Multi-branch operations support.
    - `advancedAnalytics`: Peak Hour Heatmap and Staff Leaderboards.
    - `appointmentsModule`: Calendar slot scheduling.
    - `apiAccess`: Outbound Webhooks and developer API keys.
    - `textToSpeech`: Digital signage TV voice synthesis.
  - **Operational Quota Limits (`PlanLimit`)**:
    - `maxTokens`: Monthly visits / tokens quota (e.g. 1,000 vs. 10,000 vs. unlimited).
    - `maxServices`: Maximum services allowed in catalog.
    - `maxLocations`: Maximum physical branches.
    - `maxStaff`: Maximum staff member seats.

---

## 3. Backend Integration & Dynamic Entitlements
- **API Endpoints**:
  - `GET /super-admin/plans` (`backend/src/super-admin/super-admin.controller.ts`).
  - `POST /super-admin/plans` (Creates new plan).
  - `PUT /super-admin/plans/:id` (Updates plan limits and features).
  - `DELETE /super-admin/plans/:id` (Archives plan without breaking existing subscribers).
  - `POST /super-admin/plans/:id/duplicate` (Clones plan).
- **Public Cache Synchronization**:
  When a plan is updated in Super Admin, the backend invalidates the public plan cache (`cache:public:plans`), immediately updating `/pricing` for public prospective clients.

---

## 4. Architecture & System Design
- **JSON Feature Flags Architecture**:
  The `Plan.features` column is stored as structured JSON in PostgreSQL, allowing engineers to add new boolean feature toggles without executing database schema migrations.
- **Grandfathered Plan Protections**:
  Archiving or updating a plan creates a new version while preserving existing active subscriptions on their historical terms until manual migration.

---

## 5. Business Abstraction & Value Proposition
- **Dynamic Monetization Experiments**: Enables marketing teams to rapidly launch limited-time promotional tiers, test price elasticity (e.g. R599 vs. R499), or create bespoke enterprise packages in seconds.
- **Automated Enforcements**: Quotas defined here flow directly into backend guards, automatically halting token intake or prompting upgrades when limits are reached.

