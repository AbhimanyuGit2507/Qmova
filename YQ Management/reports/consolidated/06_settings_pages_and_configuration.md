# Consolidated Audit Report: Workspace, Team, Operations, Billing, Payments & SLA Settings

> **Source Folder**: `reports/settings_pages/`  
> **Total Files Consolidated**: 10 distinct audit reports  
> **Target Audience**: Senior Tech Leads, System Architects, Business & Revenue Associates  

---

## Table of Contents

1. [Settings Hub & Layout Router (`/dashboard/settings`) Deep Audit](#section-1-01_settings_hub)
2. [Workspace & Brand Identity Settings (`/dashboard/settings/workspace`) Deep Audit](#section-2-02_workspace_and_branding)
3. [Team Members, Roles & RBAC Settings (`/dashboard/settings/team`) Deep Audit](#section-3-03_team_members_and_rbac)
4. [Operations: Locations, Services & Resources (`/dashboard/settings/operations`) Deep Audit](#section-4-04_operations_locations_and_services)
5. [Subscription Billing & Plan Quotas (`/dashboard/settings/billing`) Deep Audit](#section-5-05_billing_and_subscriptions)
6. [Payment Gateways & Merchant Payouts (`/dashboard/settings/payments`) Deep Audit](#section-6-06_payments_stripe_paystack_gateways)
7. [Integrations & Communications Settings (`/dashboard/settings/integrations`) Deep Audit](#section-7-07_integrations_google_webhooks)
8. [Service Level Agreements (SLA) & Escalation Policies (`/dashboard/settings/sla`) Deep Audit](#section-8-08_sla_policies_and_escalations)
9. [Staff View Layout Builder (`/dashboard/settings/staff-view`) Deep Audit](#section-9-09_staff_view_layouts)
10. [Personal Profile & Account Security (`/dashboard/settings/personal`) Deep Audit](#section-10-10_personal_profile_and_security)

---

<div id="section-1-01_settings_hub"></div>

<!-- ===================================================================== -->
<!-- SECTION 1/10: reports/settings_pages/01_settings_hub.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/01_settings_hub.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/01_settings_hub.md)

# Settings Hub & Layout Router (`/dashboard/settings`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/index.tsx`
- **Supporting Layout**: `frontend/src/components/SettingsLayout.tsx`
- **Route Path**: `/dashboard/settings`
- **Target Audience**: All authenticated tenant users accessing workspace, operational, team, or personal configuration panels.
- **Key Dependencies**: React (`useEffect`), Next.js `useRouter`, `SettingsLayout`.

---

## 2. Frontend Architecture & Master Settings Shell
- **Settings Shell Layout (`SettingsLayout.tsx`)**:
  Wraps all configuration subpages with a unified two-column layout:
  - **Collapsible Sidebar Navigation**:
    - **Personal**: Profile details, password security, session management (`/dashboard/settings/personal`).
    - **Workspace & Identity**: Company branding, logo, subdomain, and customer experience rules (`/dashboard/settings/workspace`).
    - **Team & Staff**: User accounts, staff roles, RBAC permissions, and staff view builder (`/dashboard/settings/team`).
    - **Operations**: Locations, services, physical resources, and provider working hours (`/dashboard/settings/operations`).
    - **Billing & Usage**: Plans, quotas, invoice history, payment method (`/dashboard/settings/billing`).
    - **Payments & Tax**: Stripe Connect, Paystack bank linking, manual counter payments (`/dashboard/settings/payments`).
    - **Integrations**: WhatsApp Evolution API, webhooks, Google Business sync, messaging templates (`/dashboard/settings/integrations`).
    - **SLA Policies**: Wait time warning thresholds and auto-escalations (`/dashboard/settings/sla`).
- **Index Redirection Gateway**:
  Navigating to `/dashboard/settings` automatically redirects to `/dashboard/settings/personal` via client-side `router.replace()`, preventing empty screens.

---

## 3. Backend Integration & Permission Gating
- **Role Scoping (`useAuth`)**:
  Sidebar navigation items are dynamically conditionally rendered based on user role:
  - `OWNER` / `ADMIN`: Access to all tabs (Billing, Payments, Team, SLA, Operations).
  - `MANAGER`: Access to Operations and Team (Read/Write on physical resources).
  - `STAFF`: Restricted exclusively to `Personal` profile and security settings.

---

## 4. Architecture & System Design
- **Next.js `getLayout` Pattern**: Implements persistent layouts (`SettingsIndex.getLayout`), preventing sidebar unmounting and state flickering during navigation between settings tabs.
- **Responsive Drawer**: Collapses to a mobile top drawer or horizontal pill tab bar on mobile screens (`< 1024px`).

---

## 5. Business Abstraction & Value Proposition
- **Unified Control Plane**: Organizes hundreds of complex enterprise settings into intuitive, logically partitioned domains, enabling practice owners to configure enterprise policies without engineering assistance.



---

<div id="section-2-02_workspace_and_branding"></div>

<!-- ===================================================================== -->
<!-- SECTION 2/10: reports/settings_pages/02_workspace_and_branding.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/02_workspace_and_branding.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/02_workspace_and_branding.md)

# Workspace & Brand Identity Settings (`/dashboard/settings/workspace`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/workspace.tsx`
- **Supporting Components**:
  - `frontend/src/components/settings/workspace.tsx` (Identity tab)
  - `frontend/src/components/settings/experience.tsx` (Customer View tab)
  - `frontend/src/components/settings/qr-codes.tsx` (Info & QR tab)
- **Route Path**: `/dashboard/settings/workspace`
- **Target Audience**: Business owners and marketing leads managing white-label branding, subdomains, and customer interface settings.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`.

---

## 2. Frontend Architecture & Brand Configuration Tabs
- **Tab 1: Identity & Subdomain**:
  - Company Legal Name and Display Name.
  - Custom Subdomain assignment (`[subdomain].qmova.com`): Inputs validate regex patterns (`^[a-z0-9-]+$`).
  - Brand Logo Uploader (`/upload/logo`): Supports PNG/SVG file uploads with instant preview and dark/light mode rendering checks.
  - Brand Accent Color Picker: Custom hex picker controlling button colors, ticket banners, and TV display highlights.
- **Tab 2: Customer View & Experience Rules**:
  - Live Queue Transparency toggles: Show/hide exact wait times in minutes (EWT), show/hide queue length numbers.
  - Ticket Cancellation Permissions: Allow or prevent customers from self-canceling tickets from mobile wait screens.
  - Audio Chime Settings: Select chime tones (Modern Bell, Soft Ding, Voice Chime).
- **Tab 3: Workspace Info & Operating Hours**:
  - Primary contact telephone, support email, default business timezone (e.g. `Africa/Johannesburg`), and localized currency.

---

## 3. Backend Integration & Entity Mutation
- **API Endpoints**:
  - `GET /tenant/me` (`backend/src/tenant/tenant.controller.ts`).
  - `PATCH /tenant/me` (Updates `name`, `subdomain`, `logoUrl`, `brandColor`, `settings`).
  - `POST /upload` (Uploads image assets).
- **Subdomain Uniqueness & Reserved Validation**:
  Backend verifies subdomain uniqueness across the entire platform and checks against reserved names (`api`, `app`, `www`, `evo`, `admin`, `superadmin`), returning a `400 ConflictException` if an already-claimed subdomain is requested.

---

## 4. Architecture & System Design
- **Edge Cache Invalidation**: Modifying the subdomain or brand colors invalidates the Redis edge cache (`cache:tenant:subdomain:{subdomain}`), propagating changes to client browsers within 60 seconds.
- **CSS Custom Properties Injection**: The chosen `brandColor` is injected dynamically into customer surfaces via CSS variables (`--primary: ${tenant.brandColor}`).

---

## 5. Business Abstraction & Value Proposition
- **Total White-Label Empowerment**: Customers never feel like they are using a third-party tool. The booking page, mobile wait screen, and lobby TV display seamlessly project the clinic or salon's native brand identity.
- **Brand Trust**: Professional logo presentation and branded subdomains eliminate phishing concerns and instill confidence in digital queue transactions.



---

<div id="section-3-03_team_members_and_rbac"></div>

<!-- ===================================================================== -->
<!-- SECTION 3/10: reports/settings_pages/03_team_members_and_rbac.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/03_team_members_and_rbac.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/03_team_members_and_rbac.md)

# Team Members, Roles & RBAC Settings (`/dashboard/settings/team`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/team.tsx`
- **Supporting Components**:
  - `frontend/src/components/settings/staff.tsx` (Platform Users)
  - `frontend/src/components/settings/providers.tsx` (On-Ground Staff)
  - `frontend/src/components/settings/StaffViewBuilder.tsx` (Staff View Builder)
  - `frontend/src/components/settings/RolesTable.tsx` (Roles & Permissions)
  - `frontend/src/components/settings/security.tsx` (Security & Access)
- **Route Path**: `/dashboard/settings/team`
- **Target Audience**: Human resources managers, practice partners, and administrators managing team seats, operational roles, and access control.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `InviteStaffModal`, `ConfirmModal`.

---

## 2. Frontend Architecture & Multi-Tab Team Management
- **URL-Derived Tab State Engine (`TABS`)**:
  - `staff` (Platform Users): Staff accounts that authenticate with credentials to access the web app.
  - `on-ground` (On-Ground Staff / Providers): Service providers (doctors, therapists, barbers) who are bookable on calendars. Can be linked to a platform user or exist as purely operational staff.
  - `staff-view` (Staff View Builder): Visual drag-and-drop builder creating custom `My Desk` station templates and assigning them per staff role.
  - `roles` (Roles & Permissions): Granular matrix view detailing capabilities per role (`OWNER`, `ADMIN`, `MANAGER`, `STAFF`).
  - `security` (Security & Access): Password policies, active session auditing, and 2FA enforcement toggles.
- **Invitation Modal Flow (`InviteStaffModal`)**:
  - Admin inputs email, selects RBAC role, and selects authorized physical branch locations.
  - Generates secure invitation token with automated email delivery or manual link copy.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /users` (`backend/src/users/users.controller.ts`).
  - `PATCH /users/:id` (Updates role or active status).
  - `DELETE /users/:id` (Revokes platform access).
  - `POST /invitations` (`backend/src/invitation/invitation.controller.ts`).
  - `GET /staff` & `POST /staff` (`backend/src/staff/staff.controller.ts`).
- **Plan Quota Guard (`checkLimit`)**:
  Before issuing an invitation or creating a new staff account, the backend verifies `subscriptionService.checkLimit(tenantId, 'staff', currentStaffCount)`. If user limits are exceeded, blocks creation with `403 Forbidden` (`PLAN_LIMIT_EXCEEDED`).

---

## 4. Architecture & System Design
- **Separation of Platform Users vs. Service Providers**: Distinguishes between software users (people with logins) and operational service providers (people with chairs/schedules). A clinic with 1 receptionist and 8 doctors can operate with 1 platform user and 8 provider profiles on lower-tier plans.
- **Deep Query Invalidation**: Revoking a user's role immediately invalidates their active JWT sessions in Redis.

---

## 5. Business Abstraction & Value Proposition
- **Seat-Based Expansion Monetization**: Staff seats represent a primary monetization lever. As medical practices hire more nurses or retail chains add counter staff, plan upgrades are triggered automatically.
- **Enterprise Governance**: Granular RBAC ensures junior receptionists cannot view financial billing or export customer databases, maintaining strict internal data governance.



---

<div id="section-4-04_operations_locations_and_services"></div>

<!-- ===================================================================== -->
<!-- SECTION 4/10: reports/settings_pages/04_operations_locations_and_services.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/04_operations_locations_and_services.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/04_operations_locations_and_services.md)

# Operations: Locations, Services & Resources (`/dashboard/settings/operations`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/operations.tsx`
- **Supporting Components**:
  - `LocationsSettings.tsx` (Locations tab)
  - `ServicesSettings.tsx` (Services tab)
  - `ResourcesSettings.tsx` (Resources tab)
  - `providers.tsx` (Providers tab)
- **Route Path**: `/dashboard/settings/operations`
- **Target Audience**: Chief operating officers, clinical directors, practice managers configuring physical infrastructure and service catalogs.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SettingsLayout`, TanStack Query, `useAuth`, Lucide Icons, `ConfirmModal`.

---

## 2. Frontend Architecture & Multi-Resource Configuration
- **Tab 1: Locations (Physical Branches)**:
  - Branch Name, Physical Street Address, Geolocation coordinates (Latitude/Longitude).
  - Timezone selector (critical for multi-region or international branches).
  - Operating Hours Grid: Mon–Sun open/close times with break intervals.
  - Default Token Display Prefix (e.g. `CPT-` for Cape Town, `JHB-` for Johannesburg).
- **Tab 2: Services (Catalog of Offerings)**:
  - Service Name, Category, Description, and Base Price.
  - Expected Service Duration (minutes) and Post-Service Buffer Time.
  - Payment Mode selector: `PREPAY` (upfront checkout), `POSTPAY` (settle at checkout), `OPTIONAL_PREPAY`, or `PAY_AT_SERVICE` (counter payment).
  - Require Manual Check-In toggle: Enforces physical arrival verification before token is called.
  - Linked Journey Blueprint / Service Flow selector.
- **Tab 3: Resources (Physical Rooms & Bays)**:
  - Resource Name (e.g., "Consultation Room 3", "Dental Chair 1", "Bay 4").
  - Type (Room, Chair, Counter, Equipment, Bay) and concurrent capacity limit.
- **Tab 4: Providers (Operational Staff)**:
  - Working schedule shifts, break times, and assigned service capabilities.

---

## 3. Backend Integration & Relational Entity Mutators
- **API Endpoints**:
  - `GET /location` & `POST /location`, `PATCH /location/:id` (`backend/src/location/location.controller.ts`).
  - `GET /service` & `POST /service`, `PATCH /service/:id` (`backend/src/service/service.controller.ts`).
  - `GET /resource` & `POST /resource`, `PATCH /resource/:id` (`backend/src/resource/resource.controller.ts`).
  - `GET /staff` & `POST /staff` (`backend/src/staff/staff.controller.ts`).
- **Plan Enforcement**:
  Every resource addition checks against active tenant subscription limits:
  - `subscriptionService.checkLimit(tenantId, 'locations', currentLocationsCount)`.
  - `subscriptionService.checkLimit(tenantId, 'services', currentServicesCount)`.

---

## 4. Architecture & System Design
- **Hierarchical Relational Tree**:
  - `Tenant` -> `Location` -> `Service` / `Queue` / `Resource` / `Staff`.
  - All foreign keys enforce `onDelete: Cascade` or restricted constraints to prevent orphaned operational records.
- **Timezone-Aware Calculations**:
  All appointment slotting, token sequence resets, and working hour evaluations use the location's explicit timezone via `date-fns-tz` (`toZonedTime`, `fromZonedTime`), ensuring branches in different timezones calculate accurate business hours independently.

---

## 5. Business Abstraction & Value Proposition
- **Digital Twin of Physical Operations**: Models physical real-world assets (rooms, staff, services) into digital scheduling constraints, eliminating double-bookings and room conflicts.
- **Flexible Monetization Packaging**: Businesses can configure distinct prices, payment policies, and durations for each service, unlocking online deposit pre-payments.



---

<div id="section-5-05_billing_and_subscriptions"></div>

<!-- ===================================================================== -->
<!-- SECTION 5/10: reports/settings_pages/05_billing_and_subscriptions.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/05_billing_and_subscriptions.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/05_billing_and_subscriptions.md)

# Subscription Billing & Plan Quotas (`/dashboard/settings/billing`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/billing.tsx`
- **Supporting Component**: `frontend/src/components/settings/billing.tsx`
- **Route Path**: `/dashboard/settings/billing`
- **Target Audience**: Tenant owners and finance administrators managing the SaaS subscription, payment methods, invoice downloads, and usage meters.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, `usePlan`, Sonner `toast`, `ConfirmModal`.

---

## 2. Frontend Architecture & Billing Dashboard
- **Active Subscription Status Banner**:
  - Displays current plan name (e.g. `Standard Plan` or `Premium Plan`).
  - Status indicator: `ACTIVE` (Emerald), `TRIAL` (Sky), `PAST_DUE` (Amber), `CANCELLED` (Zinc).
  - Next billing date and renewal price in local currency (ZAR).
  - "Upgrade / Change Plan" modal triggering immediate plan migration with prorated invoice previews.
  - "Cancel Subscription" button opening `ConfirmModal` explaining that cancellation takes effect at the end of the current paid billing period.
- **Real-Time Quota Usage Gauges**:
  - **Tokens / Monthly Visits**: Visual progress bar showing used tokens vs. plan quota (e.g. `428 / 1,000 Visits (42.8%)`).
  - **Locations**: Active branches vs. limit (e.g. `2 / 3 Locations`).
  - **Services**: Active services vs. limit (e.g. `4 / 5 Services`).
  - **Staff Seats**: Platform and provider seats vs. limit (e.g. `6 / 10 Staff`).
- **Official Invoice History Ledger**:
  - Table of historical SaaS subscription billing receipts (`Invoice` entity).
  - Columns: Invoice Number, Date, Amount (ZAR), Payment Method, Status (`PAID`), and Download PDF button.

---

## 3. Backend Integration & Invoicing Pipeline
- **API Endpoints**:
  - `GET /billing/subscriptions` (`backend/src/subscription/subscription.controller.ts`).
  - `POST /billing/subscriptions/change-plan` (Executes plan upgrade or downgrade).
  - `POST /billing/subscriptions/cancel` (Marks `cancelAtPeriodEnd = true`).
  - `GET /billing/invoices` (`backend/src/billing/billing.controller.ts`).
  - `GET /billing/invoices/:id/pdf` (Generates official downloadable PDF invoice).
- **Payment Provider Gateway**:
  Backed by Ozow direct bank EFT and card payment providers (`OzowProvider`), generating unique redirect payment URLs (`POST /billing/create-charge`).

---

## 4. Architecture & System Design
- **Graceful Past-Due Handling**: If a recurring charge fails, subscription status transitions to `PAST_DUE` with a 3-day grace period. Platform displays a warning banner without immediately shutting down live physical lobby queues.
- **Quota Guarding Middleware**: Quota usage counters are computed dynamically or cached in `TenantUsage` records, allowing instantaneous check-ins without blocking on heavy historical count queries.

---

## 5. Business Abstraction & Value Proposition
- **Predictable ARR / MRR Collection**: Automates software billing collections and provides self-service plan upgrades when customer business volume expands.
- **Frictionless Compliance & Accounting**: Provides automated, VAT-compliant tax invoices that corporate finance departments can download directly for monthly bookkeeping.



---

<div id="section-6-06_payments_stripe_paystack_gateways"></div>

<!-- ===================================================================== -->
<!-- SECTION 6/10: reports/settings_pages/06_payments_stripe_paystack_gateways.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/06_payments_stripe_paystack_gateways.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/06_payments_stripe_paystack_gateways.md)

# Payment Gateways & Merchant Payouts (`/dashboard/settings/payments`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/payments.tsx`
- **Supporting Components**:
  - `frontend/src/components/settings/payments.tsx` (Gateway Connect)
  - `frontend/src/components/settings/tax.tsx` (Tax & Invoicing Rules)
- **Route Path**: `/dashboard/settings/payments`
- **Target Audience**: Business owners, practice managers, and finance officers configuring customer payment processing and bank settlements.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`CreditCard`, `Landmark`, `ShieldCheck`, `CheckCircle2`, `Wallet`, `Sliders`, `Power`).

---

## 2. Frontend Architecture & Dual Gateway Configuration
- **Master Online Payments Toggle (`toggleOnlinePaymentsMutation`)**:
  - Single master switch enabling or disabling all online customer transactions across booking links, kiosks, and wait screens (`POST /tenant-payments/toggle-enabled`).
  - When disabled, services automatically default to in-person "Pay at Counter".
- **Tab 1: South Africa Local Bank Settlements (Paystack Subaccounts)**:
  - Supports all major South African commercial banks: Capitec Bank, First National Bank (FNB), Standard Bank, Nedbank, Absa Bank, TymeBank, Discovery Bank, Investec, African Bank, Bidvest, Sasfin.
  - Interactive Account Verification: Staff enters Account Number and selects Bank; clicking "Verify Account" invokes `POST /tenant-payments/verify-bank-account`, retrieving and displaying the official account holder's registered name directly from national banking clearing databases.
  - Linking confirms automated settlement splits directly into the merchant's local bank account.
- **Tab 2: International Payments (Stripe Connect Custom Accounts)**:
  - Embedded Stripe Connect onboarding card.
  - Generates custom onboarding link (`POST /tenant-payments/connect-stripe`) allowing businesses in 40+ countries to connect credit card processing, Apple Pay, and Google Pay.
  - Displays live onboarding status badges: `Charges Enabled`, `Payouts Active`, `Details Submitted`.
- **Tax & Invoicing Settings (`TaxSettings.tsx`)**:
  - Value Added Tax (VAT) rate configuration (default 15% for South Africa).
  - Business Tax Registration Number / VAT Number for invoice headers.

---

## 3. Backend Integration & Service Architecture
- **API Endpoints**:
  - `GET /tenant-payments/status` (`backend/src/tenant-payments/tenant-payments.controller.ts`).
  - `GET /tenant-payments/banks` (Lists South African bank codes).
  - `POST /tenant-payments/verify-bank-account` (Calls Paystack Bank Verification API).
  - `POST /tenant-payments/connect-paystack` (Creates subaccount with split configuration).
  - `POST /tenant-payments/connect-stripe` (Creates Stripe Connect account link).
  - `POST /tenant-payments/reset-stripe` & `/reset-paystack` (Disconnection handlers).
  - `POST /tenant-payments/toggle-enabled` (Master kill switch).
- **Service Layer (`tenant-payments.service.ts` - 66KB)**:
  Contains full webhook signature verifiers for both Paystack (`handlePaystackWebhook`) and Stripe (`handleStripeWebhook`), handling charge confirmations, refunds, and auto-sweeping abandoned payments.

---

## 4. Architecture & System Design
- **Zero Merchant PCI Liability**: Credit card tokens and bank credentials are never stored on Qmova servers; all card inputs are tokenized via Stripe Elements or Paystack Inline modals.
- **Platform Take-Rate Splitting**: Paystack subaccounts and Stripe Connect transfer configurations support automated platform fee deduction, enabling Qmova to collect a percentage revenue share on customer payments.

---

## 5. Business Abstraction & Value Proposition
- **Turn Waiting into Revenue**: Transforms queue tickets from passive wait screens into active digital points of sale. Customers can prepay consultation fees, order restaurant dishes, or buy salon products while waiting.
- **Hyper-Local Banking Optimization**: Native Capitec, FNB, and Absa account verification eliminates failed EFT payouts, tailored specifically for the South African commercial landscape.



---

<div id="section-7-07_integrations_google_webhooks"></div>

<!-- ===================================================================== -->
<!-- SECTION 7/10: reports/settings_pages/07_integrations_google_webhooks.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/07_integrations_google_webhooks.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/07_integrations_google_webhooks.md)

# Integrations & Communications Settings (`/dashboard/settings/integrations`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/integrations.tsx`
- **Supporting Components**:
  - `whatsapp.tsx` (WhatsApp QR pairing & status)
  - `message-templates.tsx` (Automated messaging copy)
  - `announcements.tsx` (AI Speech announcements)
  - `webhooks.tsx` (Outbound webhook endpoints)
  - `google-business.tsx` (Google Calendar & Reviews sync)
- **Route Path**: `/dashboard/settings/integrations`
- **Target Audience**: IT administrators, marketing directors, and technical operations leads configuring external service bridges.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`.

---

## 2. Frontend Architecture & Multi-Integration Hub
- **Tab 1: WhatsApp Gateway Integration**:
  - Displays live connection status: `Connected` (Emerald), `Connecting` (Amber), `Disconnected` (Red).
  - Multi-Device QR Code pairing screen: Generates live Baileys / Evolution API pairing QR code. Staff scans the code from WhatsApp mobile app (Linked Devices) to bind the business phone line in seconds.
  - "Disconnect / Re-pair" buttons with safety confirmations.
- **Tab 2: Messaging Templates**:
  - Configures automated message copy and placeholders (`{{customerName}}`, `{{token}}`, `{{serviceName}}`, `{{ewt}}`, `{{statusUrl}}`) for:
    - Ticket Joined Confirmation.
    - 5-Minute Arrival Warning.
    - Token Called Alert.
    - Service Completed & Review Request.
- **Tab 3: AI Speech Announcements**:
  - Configures voice synthesis for waiting room TV screens and counter stations.
  - Tone, pitch, speed, and language accent selectors (e.g. English South Africa, English US, Zulu, Afrikaans).
- **Tab 4: Outbound Webhooks**:
  - Configure target HTTPS endpoints and signing secrets.
  - Subscribes to platform events: `visit.created`, `visit.called`, `visit.completed`, `payment.succeeded`.
  - Live test delivery button and event delivery logs.
- **Tab 5: Google Integration**:
  - 2-Way Google Calendar synchronization with OAuth consent callback listener (`?googleAuth=success`).

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /whatsapp/status` & `POST /whatsapp/connect`, `POST /whatsapp/disconnect` (`backend/src/whatsapp/whatsapp.controller.ts`).
  - `GET /webhooks` & `POST /webhooks`, `DELETE /webhooks/:id` (`backend/src/webhooks/webhooks.controller.ts`).
  - `GET /integrations/google/auth-url` (`backend/src/integrations/google/google.controller.ts`).
  - `GET /communication/templates` (`backend/src/communication/communication.controller.ts`).
- **BullMQ Queue Processing**:
  Outgoing webhooks are processed by `BullMQ` queue `queue_webhooks` with 5 automatic retries using exponential backoff, preventing slow third-party webhooks from stalling core database operations.

---

## 4. Architecture & System Design
- **Instance Isolation**: Evolution API instances are provisioned with dedicated namespaced instances (`tenant_{tenantId}`), ensuring complete session isolation so one tenant's WhatsApp disconnection never affects another tenant.
- **HMAC SHA-256 Webhook Signatures**: Outbound webhook requests include `X-Qmova-Signature` calculated with the endpoint's secret key, enabling receiving servers to verify payload authenticity.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Extensibility**: Enables seamless interoperability with legacy Electronic Health Records (EHR), hospital management systems (Epic, Cerner), Point of Sale (POS) terminals, and corporate Zapier/Make automations.
- **Carrier Independence**: Native WhatsApp pairing completely bypasses expensive SMS aggregator per-message fees, saving high-volume businesses thousands of dollars in monthly telecommunications costs.



---

<div id="section-8-08_sla_policies_and_escalations"></div>

<!-- ===================================================================== -->
<!-- SECTION 8/10: reports/settings_pages/08_sla_policies_and_escalations.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/08_sla_policies_and_escalations.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/08_sla_policies_and_escalations.md)

# Service Level Agreements (SLA) & Escalation Policies (`/dashboard/settings/sla`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/sla.tsx`
- **Supporting Component**: `frontend/src/components/settings/sla.tsx`
- **Route Path**: `/dashboard/settings/sla`
- **Target Audience**: Chief operating officers, clinical quality directors, customer experience managers setting maximum wait thresholds.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Plus`, `Edit2`, `Trash2`).

---

## 2. Frontend Architecture & SLA Policy Manager
- **Policy Definition Form**:
  - **Policy Name**: (e.g. "Urgent Care Triage SLA", "VIP Teller Speed Guarantee", "Standard Consultation SLA").
  - **Warning Threshold (Minutes)**: Wait time duration after which a ticket card turns amber on operator screens (e.g. 15 minutes).
  - **Breach Threshold (Minutes)**: Wait time duration after which the ticket transitions to a critical red breach state (e.g. 30 minutes).
  - **Escalation Telephones**: Comma-separated list of supervisor phone numbers receiving automated SMS/WhatsApp alerts upon policy breach.
  - **Applicable Services**: Multi-select checklist binding the policy to specific services in the tenant's catalog.
- **Policy Roster Table**:
  - Lists configured policies with threshold tags, assigned service counts, and edit/delete actions.
  - Inline confirmation modals preventing accidental deletion of active policies.

---

## 3. Backend Integration & Automated Monitoring Engine
- **API Endpoints**:
  - `GET /sla-policies` (`backend/src/sla-policy/sla-policy.controller.ts`).
  - `POST /sla-policies` (Creates policy with service connections).
  - `PATCH /sla-policies/:id` (Updates thresholds or escalation contacts).
  - `DELETE /sla-policies/:id` (Deletes policy and unlinks services).
- **Service Layer Logic (`sla-policy.service.ts`)**:
  Manages relational bindings between `SlaPolicy` and `Service` models in PostgreSQL:
  ```typescript
  async update(id: string, tenantId: string, data: any) {
    return this.prisma.slaPolicy.update({
      where: { id },
      data: {
        name: data.name,
        warningThresholdMins: data.warningThresholdMins,
        breachThresholdMins: data.breachThresholdMins,
        escalationPhones: data.escalationPhones,
        services: data.serviceIds ? { set: data.serviceIds.map(id => ({ id })) } : undefined,
      },
    });
  }
  ```

---

## 4. Architecture & System Design
- **Real-Time Threshold Evaluation**: Wait time duration is computed dynamically on the operator `Service Desk` and `My Desk` by subtracting `waitingStart` from `now()`. When `diffMins > warningThresholdMins`, CSS animation pulses warning borders without requiring polling.
- **Automated Escalation Dispatch**: Background tasks monitor overdue tickets and trigger SMS/WhatsApp alerts to `escalationPhones` when critical breaches occur.

---

## 5. Business Abstraction & Value Proposition
- **Guaranteed Service Quality**: In healthcare and financial environments, unmonitored wait times lead to clinical deterioration, walkouts, and regulatory scrutiny. SLA policies enforce organizational accountability.
- **Enterprise SLA Compliance**: Enterprise B2B contracts often mandate strict contractual wait time guarantees (e.g., 95% of patients seen within 20 minutes); this engine provides the mathematical proof and telemetry required to validate SLA conformance.



---

<div id="section-9-09_staff_view_layouts"></div>

<!-- ===================================================================== -->
<!-- SECTION 9/10: reports/settings_pages/09_staff_view_layouts.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/09_staff_view_layouts.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/09_staff_view_layouts.md)

# Staff View Layout Builder (`/dashboard/settings/staff-view`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - Redirect: `frontend/src/pages/dashboard/settings/staff-view.tsx`
  - Builder Component: `frontend/src/components/settings/StaffViewBuilder.tsx`
  - Host Tab: `frontend/src/pages/dashboard/settings/team.tsx?tab=staff-view`
- **Route Path**: `/dashboard/settings/team?tab=staff-view`
- **Target Audience**: Operations architects, IT leads, and clinical administrators designing custom desk layouts for counter staff, doctors, and specialists.
- **Key Dependencies**: React (`useState`, `useCallback`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, Lucide Icons (`Layout`, `Plus`, `Trash2`, `Save`, `Grid`, `Move`, `Sparkles`).

---

## 2. Frontend Architecture & Visual Layout Builder
- **Station Template Canvas**:
  - Allows administrators to visually construct the 2D grid displayed to operators on `/dashboard/my-desk`.
  - Configures template name (e.g. "Doctor Consultation Room", "Emergency Triage Station", "Restaurant Kitchen KDS", "Bank Teller Counter").
- **Widget Palette**:
  - Users can drag or add widgets from the registry:
    - `CurrentTicketWidget`: Live calling station with stage progression.
    - `CustomerHistoryWidget`: Past visit dossier and VIP notes.
    - `ScheduleWidget`: Today's booked appointments list.
    - `QueueGridWidget`: Waiting room queue feed.
    - `ClinicalNotesWidget`: Medical SOAP consultation notes.
    - `PrescriptionWidget`: Medication dosage generator.
    - `CustomFormWidget`: Embedded custom intake forms.
- **Grid Positioning & Span Controls**:
  - For each widget, administrators adjust:
    - `colSpan` (1, 2, or 3 columns wide).
    - `rowSpan` (1 or 2 rows tall).
- **Staff Assignment Matrix**:
  - Binds specific templates to individual staff accounts or roles (e.g. all doctors receive the "Clinical Notes" template; all receptionists receive the "Queue Grid" template).

---

## 3. Backend Integration & Layout Serialization
- **API Endpoints**:
  - `GET /tenant/me` (`backend/src/tenant/tenant.controller.ts`).
  - `PATCH /tenant/me` (Saves serialized `staffViewLayout` JSON into `Tenant` entity).
- **JSON Configuration Schema (`staffViewLayout`)**:
  ```json
  {
    "version": 2,
    "assignments": {
      "user_uuid_dr_smith": "template_clinical_1"
    },
    "templates": [
      {
        "id": "template_clinical_1",
        "name": "Doctor Consultation Station",
        "layout": [
          { "id": "t1", "type": "CurrentTicketWidget", "position": { "colSpan": 1, "rowSpan": 2 } },
          { "id": "t2", "type": "ClinicalNotesWidget", "position": { "colSpan": 2, "rowSpan": 2 } },
          { "id": "t3", "type": "CustomerHistoryWidget", "position": { "colSpan": 1, "rowSpan": 1 } }
        ]
      }
    ]
  }
  ```

---

## 4. Architecture & System Design
- **Zero-Code Extensibility**: Adding new domain widgets requires zero database schema migrations; the widget registry in frontend dynamically parses the JSON schema.
- **Immediate Live Propagation**: Modifying a layout in the builder immediately takes effect on connected staff workstations upon their next desk refresh.

---

## 5. Business Abstraction & Value Proposition
- **Extreme Domain Flexibility**: Solves the enterprise dilemma where different departments within the same company require drastically different screen layouts (e.g., triage nurses vs. specialist doctors vs. pharmacy cashiers).
- **Ergonomic Operator Efficiency**: Eliminates screen clutter by providing only the exact widgets required for that specific employee's daily responsibilities.



---

<div id="section-10-10_personal_profile_and_security"></div>

<!-- ===================================================================== -->
<!-- SECTION 10/10: reports/settings_pages/10_personal_profile_and_security.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/settings_pages/10_personal_profile_and_security.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/10_personal_profile_and_security.md)

# Personal Profile & Account Security (`/dashboard/settings/personal`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/personal.tsx`
- **Supporting Component**: `frontend/src/components/settings/profile.tsx`
- **Route Path**: `/dashboard/settings/personal`
- **Target Audience**: All individual staff members, operators, and business owners managing their personal credentials, notification preferences, and active sessions.
- **Key Dependencies**: React (`useState`, `useEffect`), `SettingsLayout`, TanStack Query, `fetchApi`, `useAuth`, Sonner `toast`, Lucide Icons (`User`, `Lock`, `Shield`, `Smartphone`, `KeyRound`, `LogOut`, `Laptop`).

---

## 2. Frontend Architecture & Personal Preferences
- **Section 1: User Profile**:
  - Full Name, Email Address, and Contact Telephone Number.
  - Avatar uploader with image preview.
  - Role indicator badge (`OWNER`, `ADMIN`, `MANAGER`, `STAFF`) with workspace affiliation name.
- **Section 2: Password Security & Credential Updates**:
  - Current Password verification field.
  - New Password and Confirm Password inputs with password strength validation meters.
  - "Update Password" mutation invoking `POST /auth/change-password`.
- **Section 3: Two-Factor Authentication (2FA)**:
  - Email / WhatsApp OTP verification toggle for elevated account security.
- **Section 4: Active Login Sessions Ledger**:
  - List of active browser sessions (`UserSession` model).
  - Displays device user agent, IP address, geographical location estimate, and last activity timestamp.
  - "Revoke Session" and "Log Out of All Devices" buttons.

---

## 3. Backend Integration & Session Management
- **API Endpoints**:
  - `GET /auth/me` (`backend/src/auth/auth.controller.ts`).
  - `PATCH /users/me` (Updates name and contact details).
  - `POST /auth/change-password` (Validates old password, applies new bcrypt hash).
  - `GET /auth/sessions` (Lists active sessions).
  - `DELETE /auth/sessions/:id` (Revokes specific session).
  - `POST /auth/logout` (Clears cookies and terminates session).
- **Security Invalidation Pipeline**:
  Changing the user's password automatically triggers a database command destroying all associated `UserSession` records and blacklists active JWT tokens in Redis.

---

## 4. Architecture & System Design
- **Universal Accessibility**: Accessible to all authenticated users regardless of RBAC permissions; front-desk clerks and executive owners alike can maintain their security settings.
- **Secure Cookie Clear**: Invoking logout triggers backend Set-Cookie headers expiring `token` (`Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`), while client-side `AuthStorage.clear()` flushes `localStorage`.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Identity Hygiene**: Empowers employees to manage compromised passwords and terminate suspicious logins without filing IT helpdesk tickets.
- **Regulatory Privacy Compliance**: Facilitates personal data maintenance under GDPR Article 16 (Right to Rectification).



---

