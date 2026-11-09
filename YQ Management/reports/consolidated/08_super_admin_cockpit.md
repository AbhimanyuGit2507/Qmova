# Consolidated Audit Report: Super Admin Command Center, Tenant Fleet, Logs & Pricing Admin

> **Source Folder**: `reports/super_admin/`  
> **Total Files Consolidated**: 11 distinct audit reports  
> **Target Audience**: Senior Tech Leads, System Architects, Business & Revenue Associates  

---

## Table of Contents

1. [Super Admin Command Center (`/super-admin`) Deep Audit](#section-1-01_super_admin_dashboard)
2. [Global Tenant Fleet Management (`/super-admin/tenants`) Deep Audit](#section-2-02_tenant_fleet_management)
3. [Platform Analytics & Multi-Tenant BI (`/super-admin/analytics`) Deep Audit](#section-3-03_platform_analytics)
4. [System Control & Service Kill-Switches (`/super-admin/system-control`) Deep Audit](#section-4-04_system_control_and_feature_flags)
5. [Centralized System Logs & Audit Trail (`/super-admin/system-logs`) Deep Audit](#section-5-05_system_logs_and_audit_trail)
6. [Content Management System (CMS) Administration (`/super-admin/blogs`) Deep Audit](#section-6-06_blog_cms_administration)
7. [Global Communications & Messaging Gateway (`/super-admin/communication`) Deep Audit](#section-7-07_communication_and_channels)
8. [Enterprise Inquiries & Sales Leads CRM (`/super-admin/inquiries`) Deep Audit](#section-8-08_inquiries_and_leads_crm)
9. [Global Integrations Hub (`/super-admin/integrations`) Deep Audit](#section-9-09_integrations_hub)
10. [Marketing, Campaigns & Subscriber Engine (`/super-admin/marketing`) Deep Audit](#section-10-10_marketing_and_subscribers)
11. [Global Pricing Tiers & Plan Matrix Engine (`/super-admin/pricing`) Deep Audit](#section-11-11_pricing_tiers_and_plan_matrix)

---

<div id="section-1-01_super_admin_dashboard"></div>

<!-- ===================================================================== -->
<!-- SECTION 1/11: reports/super_admin/01_super_admin_dashboard.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/01_super_admin_dashboard.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/01_super_admin_dashboard.md)

# Super Admin Command Center (`/super-admin`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/index.tsx`
- **Route Path**: `/super-admin`
- **Target Audience**: Platform Super Administrators and SaaS founders overseeing global platform metrics, multi-tenant health, and infrastructure status.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Lucide Icons (`Building2`, `CreditCard`, `Users`, `Activity`, `ArrowUpRight`).

---

## 2. Frontend Architecture & God-Mode Dashboard
- **Executive Platform KPI Cards**:
  - **Total Businesses**: Count of all registered tenant organizations globally (`totalTenants`).
  - **Active Queues**: Total queues currently in `ACTIVE` state across all clients (`activeQueues`).
  - **Total Customers Served**: Aggregate historical count of completed visits across all tenants (`totalCustomersServed`).
  - **Total Platform Revenue (ZAR)**: Cumulative gross revenue collected through SaaS subscriptions and platform transaction fees (`totalRevenue`).
- **Quick Platform Actions Matrix**:
  - Jump to Tenant Directory (`/super-admin/tenants`).
  - Launch System Logs & Trace Inspection (`/super-admin/system-logs`).
  - Configure Global Pricing Tiers (`/super-admin/pricing`).
  - Test Messaging Infrastructure (`/super-admin/communication`).
  - Toggle System Service Flags (`/super-admin/system-control`).

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /super-admin/metrics` (`backend/src/super-admin/super-admin.controller.ts`).
- **Backend Execution Flow (`getGlobalMetrics`)**:
  Executes high-speed parallel count queries across PostgreSQL:
  ```typescript
  const [totalTenants, activeQueues, totalCustomersServed, totalRevenue] = await Promise.all([
    this.prisma.tenant.count(),
    this.prisma.queue.count({ where: { status: 'ACTIVE' } }),
    this.prisma.visit.count({ where: { currentState: 'COMPLETED' } }),
    this.prisma.transaction.aggregate({ _sum: { amount: true } }),
  ]);
  ```
- **RBAC Enforcement**:
  Guarded by `checkSuperAdmin(req)`:
  ```typescript
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new UnauthorizedException('Access denied. Super Admin only.');
  }
  ```

---

## 4. Architecture & System Design
- **Subdomain Middleware Gatekeeper**:
  Requests to `/super-admin/*` are verified at the Next.js edge middleware. If the authenticated user does not match the configured `SUPER_ADMIN_EMAIL` or hold `role === 'SUPER_ADMIN'`, the edge middleware blocks access and redirects to `/dashboard`.
- **System Resource Isolation**:
  Super admin telemetry queries bypass tenant isolation filters to compute true global multi-tenant aggregates.

---

## 5. Business Abstraction & Value Proposition
- **Platform Health Monitoring**: Provides the SaaS leadership team with a bird's-eye view of platform adoption, transaction volume velocity, and infrastructure stability.
- **Operational Interventions**: Immediate visibility into platform-wide disruptions or billing drop-offs allows founders to intervene before customer churn occurs.



---

<div id="section-2-02_tenant_fleet_management"></div>

<!-- ===================================================================== -->
<!-- SECTION 2/11: reports/super_admin/02_tenant_fleet_management.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/02_tenant_fleet_management.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/02_tenant_fleet_management.md)

# Global Tenant Fleet Management (`/super-admin/tenants`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/super-admin/tenants/index.tsx` (Tenant Directory & Fleet Roster)
  - `frontend/src/pages/super-admin/tenants/[id].tsx` (Tenant Detail, Quotas & Impersonation)
- **Route Paths**: `/super-admin/tenants`, `/super-admin/tenants/[id]`
- **Target Audience**: Platform Super Administrators managing tenant accounts, subscription overrides, and customer support interventions.
- **Key Dependencies**: React (`useState`), Next.js (`useRouter`, `Link`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Building2`, `Search`, `Trash2`, `CreditCard`, `Filter`, `ArrowUpRight`).

---

## 2. Frontend Architecture & Fleet Management Console
- **Tenant Directory Index (`/tenants`)**:
  - Filter by Subscription Status: `ALL`, `ACTIVE`, `TRIAL`, `EXPIRED`, `CANCELLED`.
  - Sort by: `joined` (Registration date), `name`, `queues` count, `users` count.
  - Search Bar: Real-time fuzzy filtering across tenant names and subdomains.
  - Table Columns: Company Name, Subdomain, Primary Owner Email, Active Plan Tier, Monthly Visit Count, WhatsApp Status, and Actions.
  - One-click deletion with double-confirmation modal (`ConfirmModal`).
- **Tenant Deep-Dive & Control Panel (`/tenants/[id]`)**:
  - **Account Masquerade / Impersonation**: Generates a temporary administrative login token allowing Super Admin to jump directly into the tenant's live dashboard for hands-on troubleshooting.
  - **Manual Subscription Override**:
    - Assign any Plan tier (including custom Enterprise tiers).
    - Toggle `isFree = true` for complimentary partner accounts.
    - Set custom subscription expiration dates.
    - Extend trial by N days (`extendSubscription`).
  - **Quota Synchronization (`syncLimits`)**: Forces immediate synchronization between plan limits and active operational quotas.

---

## 3. Backend Integration & Administrative Operations
- **API Endpoints**:
  - `GET /super-admin/tenants?search=...` (`backend/src/super-admin/super-admin.controller.ts`).
  - `GET /super-admin/tenants/:id`.
  - `PUT /super-admin/tenants/:id` (Updates tenant metadata).
  - `DELETE /super-admin/tenants/:id` (Hard cascade removal).
  - `POST /super-admin/tenants/:id/assign-plan`.
  - `POST /super-admin/tenants/:id/extend-subscription`.
  - `POST /super-admin/tenants/:id/sync-limits`.
- **Cascade Deletion Protocol**:
  Deleting a tenant from Super Admin executes a clean PostgreSQL cascade wiping all related `Location`, `Service`, `Queue`, `Visit`, `Staff`, `Customer`, and `OutboxEvent` records.

---

## 4. Architecture & System Design
- **Administrative Impersonation Pattern**: Issues a signed JWT containing `{ userId, tenantId, masquerade: true }`, allowing support engineers to reproduce bugs in the customer's exact environment without asking for customer passwords.
- **Audit Logging**: Every administrative modification executed in Super Admin is logged in `AuditLog` with `userId = super_admin_id`.

---

## 5. Business Abstraction & Value Proposition
- **Enterprise Deal Closing**: Enables sales leads to close bespoke enterprise contracts with custom pricing, extended 60-day trials, or grandfathered quotas with a single click.
- **Rapid Customer Support**: Eliminates multi-day support ping-pong. Platform engineers can instantly inspect a tenant's queues, WhatsApp connection, and error logs directly.



---

<div id="section-3-03_platform_analytics"></div>

<!-- ===================================================================== -->
<!-- SECTION 3/11: reports/super_admin/03_platform_analytics.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/03_platform_analytics.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/03_platform_analytics.md)

# Platform Analytics & Multi-Tenant BI (`/super-admin/analytics`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/analytics/index.tsx`
- **Route Path**: `/super-admin/analytics`
- **Target Audience**: Platform Super Administrators, SaaS executives, and investors analyzing macro business health and cross-tenant platform usage.
- **Key Dependencies**: React, `SuperAdminLayout`, TanStack Query, `fetchApi`, Lucide Icons (`BarChart3`, `TrendingUp`, `Users`, `CreditCard`, `Layers`, `Activity`, `Calendar`).

---

## 2. Frontend Architecture & Macro Intelligence
- **Platform Executive Scorecards**:
  - **Monthly Recurring Revenue (MRR)**: Real-time calculation of active subscription value in ZAR.
  - **Annual Run Rate (ARR)**: Project annual SaaS revenue.
  - **Net Customer Growth Rate**: Month-over-month new registrations vs. cancellations.
  - **Cross-Platform Queue Volume**: Total queue tokens generated across all businesses this month.
  - **Average Platform Wait Time**: Global aggregate wait time across all locations.
- **Cross-Vertical Distribution Breakdown**:
  - Pie/Bar distribution showing market penetration across target industries: Healthcare (42%), Food & Beverage (24%), Salons & Spas (18%), Civic & Corporate (16%).
- **Plan Tier Distribution**:
  - Proportion of customer base on Starter (Free Trial) vs. Standard (R499) vs. Premium (R1,499) vs. Enterprise.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /super-admin/analytics` (`backend/src/super-admin/super-admin.controller.ts`).
  - `GET /super-admin/transactions` (Recent platform payment events).
- **Backend Analytics Engine (`getPlatformAnalytics`)**:
  Aggregates cross-tenant data across `Subscription`, `Plan`, `Visit`, and `Tenant` tables:
  ```typescript
  const activeSubscriptions = await this.prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true },
  });
  const mrr = activeSubscriptions.reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);
  ```

---

## 4. Architecture & System Design
- **Analytical Read Replicas & Caching**: Super Admin analytics queries are cached in Redis (`cache:super-admin:analytics`, TTL: 10 minutes) to prevent heavy multi-table aggregations from slowing down frontline tenant queue operations.
- **Time-Series Partitioning**: Analyzes data across standard 30-day, 90-day, and 12-month rolling windows.

---

## 5. Business Abstraction & Value Proposition
- **Investor & Board Reporting**: Instantly exports verifiable SaaS metrics (MRR, churn, CAC payback, LTV) for investment rounds and strategic reviews.
- **Feature Prioritization**: Reveals which industry verticals drive the highest usage velocity, directing product engineering resources where commercial returns are greatest.



---

<div id="section-4-04_system_control_and_feature_flags"></div>

<!-- ===================================================================== -->
<!-- SECTION 4/11: reports/super_admin/04_system_control_and_feature_flags.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/04_system_control_and_feature_flags.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/04_system_control_and_feature_flags.md)

# System Control & Service Kill-Switches (`/super-admin/system-control`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/system-control/index.tsx`
- **Route Path**: `/super-admin/system-control`
- **Target Audience**: Infrastructure reliability engineers, lead system architects, and platform Super Admins managing operational feature flags and emergency kill-switches.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js `useRouter`, `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, Lucide Icons (`Sliders`, `Power`, `RefreshCw`, `Mail`, `CreditCard`, `Server`, `Zap`, `Cpu`).

---

## 2. Frontend Architecture & Service Control Center
- **Service Configuration Cards (`SERVICE_CONFIGS`)**:
  - **Backend Keep-Alive Cron**: Toggles the 14-minute automated health check ping (`/health`) designed to prevent cloud hosting containers from entering sleep states.
  - **WhatsApp Keep-Alive Service**: Toggles the periodic status query pinging Evolution API v2 to guarantee constant messaging connection readiness.
  - **Email Infrastructure Relay**: Toggles the transactional Brevo email delivery engine (can be paused during provider outages or planned migrations).
  - **Payment Gateway Processing**: Emergency kill-switch pausing Stripe / Paystack customer checkout operations.
  - **Global Registration Lock**: Restricts self-serve registration (`/register`) to invite-only mode during closed beta testing or heavy load spikes.
- **Diagnostic Testing Pods**:
  - Live "Test Backend Keep-Alive" ping button with real-time response time readout.
  - Live "Test WhatsApp Bridge" ping button measuring gateway latency.

---

## 3. Backend Integration & Dynamic Configuration
- **API Endpoints**:
  - `GET /super-admin/communication/status` (`backend/src/super-admin/super-admin.controller.ts`).
  - `POST /super-admin/system-control/toggle`.
- **In-Memory Flag Storage**:
  System toggle flags are stored in Redis (`system:flags:{key}`) and cached in Node.js memory. When an emergency kill switch is flipped, the change propagates across all backend instances in under 1 second via Redis Pub/Sub without requiring server restarts.

---

## 4. Architecture & System Design
- **Fail-Safe Circuit Breaker**: If third-party messaging providers (e.g. Meta WhatsApp API) experience global downtime, flipping the WhatsApp flag pauses outbound queue attempts and transitions the system to SMS fallback, preventing queue worker crashes.
- **Maintenance Overlay (`MaintenanceOverlay.tsx`)**: Global maintenance mode flag displays an emergency maintenance banner to tenants while keeping Super Admin access open for remediation.

---

## 5. Business Abstraction & Value Proposition
- **Operational Risk Defense**: Protects the platform from catastrophic compounding failures during upstream provider outages.
- **Seamless Infrastructure Maintenance**: Enables zero-downtime maintenance windows by selectively pausing background queue dispatchers while keeping customer read endpoints live.



---

<div id="section-5-05_system_logs_and_audit_trail"></div>

<!-- ===================================================================== -->
<!-- SECTION 5/11: reports/super_admin/05_system_logs_and_audit_trail.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/05_system_logs_and_audit_trail.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/05_system_logs_and_audit_trail.md)

# Centralized System Logs & Audit Trail (`/super-admin/system-logs`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/system-logs.tsx`
- **Route Path**: `/super-admin/system-logs`
- **Target Audience**: Platform Super Administrators, security auditors, and backend support engineers diagnosing runtime errors, unhandled exceptions, and suspicious activities.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, `useAuth`, Lucide Icons (`ShieldAlert`, `Terminal`, `ChevronDown`, `ChevronUp`, `Loader2`, `Filter`).

---

## 2. Frontend Architecture & Terminal Log Viewer
- **Filter Bar & Search Tools**:
  - Filter by Log Level: `all`, `ERROR`, `WARN`, `INFO`, `DEBUG`.
  - Filter by Specific Tenant ID: Focuses on errors originating from a single customer's workspace.
  - Pagination Controls: Page navigation supporting high-volume log navigation (`take: 50` rows per page).
- **Log Stream Card & Trace Expansion**:
  - Displays timestamp, log level badge, source service name, HTTP route, and truncated error message.
  - Clicking any log entry expands a terminal-style drawer (`Terminal` view) displaying the full JSON payload, stack trace, request body, client IP, and `x-request-id` header for distributed tracing correlation.

---

## 3. Backend Integration & Ingestion Pipeline
- **API Endpoints**:
  - `GET /system-logs?skip=...&take=...&level=...&tenantId=...` (`backend/src/system-log/system-log.controller.ts`).
- **Database Model (`SystemLog`)**:
  - `id`: Unique log identifier.
  - `level`: `ERROR`, `WARN`, `INFO`.
  - `message`: High-level error summary.
  - `context`: Service class name (e.g. `VisitService`, `WhatsappService`).
  - `stack`: Serialized runtime stack trace.
  - `tenantId`: Nullable foreign key to `Tenant(id)`.
  - `metadata`: JSON payload containing request parameters and user context.
  - `createdAt`: High-precision timestamp.
- **Automated Capture Engine**:
  Integrated with NestJS `AllExceptionsFilter` (`backend/src/common/filters/all-exceptions.filter.ts`). When any unhandled HTTP 500 error occurs anywhere in the backend, the filter writes an entry directly to the `SystemLog` table before sending the sanitized response to the client.

---

## 4. Architecture & System Design
- **Sentry Trace Correlation**: Log entries capture the Sentry `event_id` and `x-request-id`, allowing engineers to cross-reference database log records with Sentry profiling graphs.
- **Retention Partitioning**: A daily cron job purges debug logs older than 30 days to prevent uncontrolled database disk usage.

---

## 5. Business Abstraction & Value Proposition
- **Proactive Incident Remediation**: Allows engineering teams to detect and patch runtime errors before customers submit support complaints.
- **Regulatory Audit Readiness**: Provides an immutable audit trail verifying that technical incidents, unauthorized access attempts, and system errors are systematically recorded for compliance audits.



---

<div id="section-6-06_blog_cms_administration"></div>

<!-- ===================================================================== -->
<!-- SECTION 6/11: reports/super_admin/06_blog_cms_administration.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/06_blog_cms_administration.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/06_blog_cms_administration.md)

# Content Management System (CMS) Administration (`/super-admin/blogs`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/blogs/index.tsx`
- **Route Path**: `/super-admin/blogs`
- **Target Audience**: Content marketers, SEO managers, and platform administrators publishing educational articles, feature announcements, and case studies.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`FileText`, `Plus`, `Edit`, `Trash2`, `Eye`, `Check`, `X`).

---

## 2. Frontend Architecture & Editorial Desk
- **Article Roster & Publication Management**:
  - Displays article title, slug, author, publication status (`PUBLISHED` vs `DRAFT`), view counters, and creation date.
  - Quick action buttons: View live article, Edit in modal, Delete article.
- **Article Editor Modal**:
  - **Article Title & Automatic Slug Generator**: Types title and generates kebab-case URL slug (e.g., "How to Reduce Clinic Wait Times" -> `/blog/how-to-reduce-clinic-wait-times`).
  - **Cover Image Uploader**: Asset uploader storing images in `/uploads` or cloud buckets.
  - **Markdown Body Editor**: Full-featured markdown input supporting headings, lists, quotes, tables, and code snippets.
  - **SEO Metadata Fields**: Custom SEO Title and SEO Description tags for search engine optimization.
  - **Publish Status Toggle**: Switch between draft preview and public production release.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /blogs` & `GET /blogs/:id` (`backend/src/blogs/blogs.controller.ts`).
  - `POST /blogs` (Creates new blog post).
  - `PUT /blogs/:id` (Updates article body and metadata).
  - `DELETE /blogs/:id` (Removes post).
- **Database Model (`Blog`)**:
  Stored in PostgreSQL `Blog` table with unique slug constraints.

---

## 4. Architecture & System Design
- **Incremental Static Regeneration (ISR) Invalidation**:
  When a blog post is published or modified from this administrative screen, the backend invokes Next.js on-demand revalidation (`res.revalidate('/blog')`), ensuring public visitors receive updated articles instantly without requiring a complete frontend container rebuild.
- **Sanitized HTML Rendering**: Markdown is sanitized to prevent stored Cross-Site Scripting (XSS) vectors.

---

## 5. Business Abstraction & Value Proposition
- **Organic Inbound Growth**: Eliminates reliance on external CMS platforms (WordPress, Ghost) by keeping content marketing tightly integrated into the core Next.js application, boosting organic search authority and domain rating.
- **Product Marketing Autonomy**: Empowers non-technical marketing team members to publish release announcements, guides, and customer case studies independently.



---

<div id="section-7-07_communication_and_channels"></div>

<!-- ===================================================================== -->
<!-- SECTION 7/11: reports/super_admin/07_communication_and_channels.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/07_communication_and_channels.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/07_communication_and_channels.md)

# Global Communications & Messaging Gateway (`/super-admin/communication`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/communication/index.tsx`
- **Route Path**: `/super-admin/communication`
- **Target Audience**: Platform Super Administrators and telecommunications engineers managing system-wide SMS, WhatsApp, and Email relay channels.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `react-qr-code`, Lucide Icons (`Mail`, `Send`, `MessageSquare`, `Key`, `QrCode`, `RefreshCw`, `ShieldCheck`, `Smartphone`, `Sparkles`, `Server`, `Zap`).

---

## 2. Frontend Architecture & Gateway Control
- **Interactive Multi-Rail Testing Workbench (`activeTab`)**:
  - **Tab 1: Email & OTP Delivery Rail**:
    - Tests live Brevo SMTP / API connection.
    - Test Email Dispatcher: Enter recipient email, select message type (`standard` vs. `otp`), and click "Send Verification Test".
    - Displays sent OTP code and delivery response ID in real time.
  - **Tab 2: WhatsApp Evolution Gateway Rail**:
    - Tests live Evolution API connection status and webhook endpoints.
    - Test WhatsApp Dispatcher: Enter phone number with country code, select message type (`standard` vs. `otp`), and dispatch live test ping.
    - Displays delivery confirmation and provider response.
  - **Tab 3: Digital Signage QR Verification Rail**:
    - Live QR code generator and test harness verifying that kiosk and TV URLs serialize properly.
  - **Tab 4: Payments & Gateways Health Rail**:
    - Checks live credentials and operating mode (Sandbox vs. Production) for Ozow and Paystack.

---

## 3. Backend Integration & Diagnostic Endpoints
- **API Endpoints**:
  - `GET /super-admin/communication/status` (`backend/src/super-admin/super-admin.controller.ts`).
  - `GET /super-admin/communication/email/connection` (Pings Brevo API).
  - `POST /super-admin/communication/test-email` (Dispatches test email).
  - `POST /super-admin/communication/test-whatsapp` (Dispatches test WhatsApp message).
  - `GET /super-admin/whatsapp-instances` (Lists all active Evolution API containers).
- **Communication Logging**:
  Every diagnostic test automatically records an entry in `CommunicationLog` (`channel`, `type`, `recipient`, `status`, `providerId`, `errorMessage`).

---

## 4. Architecture & System Design
- **Real-Time Telecommunication Diagnostics**:
  Exposes live operational metadata:
  - Email Provider: `Brevo (SMTP / RELAY)`
  - WhatsApp Provider: `Evolution API (Multi-tenant instance model)`
  - Payment Provider: `Ozow / Paystack / Stripe`
  - OTP Engine: `Redis OTP Storage (5 min expiry)`

---

## 5. Business Abstraction & Value Proposition
- **Carrier & Gateway Health Visibility**: Allows platform operations to verify telecommunications delivery health in 5 seconds without inspecting server SSH terminal logs.
- **Customer Issue Triage**: When a tenant reports "Our customers aren't receiving WhatsApp tickets", Super Admin can fire a diagnostic test from this panel to immediately isolate whether the issue is with the tenant's phone pairing or the global WhatsApp server.



---

<div id="section-8-08_inquiries_and_leads_crm"></div>

<!-- ===================================================================== -->
<!-- SECTION 8/11: reports/super_admin/08_inquiries_and_leads_crm.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/08_inquiries_and_leads_crm.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/08_inquiries_and_leads_crm.md)

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



---

<div id="section-9-09_integrations_hub"></div>

<!-- ===================================================================== -->
<!-- SECTION 9/11: reports/super_admin/09_integrations_hub.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/09_integrations_hub.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/09_integrations_hub.md)

# Global Integrations Hub (`/super-admin/integrations`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/integrations/index.tsx`
- **Route Path**: `/super-admin/integrations`
- **Target Audience**: Infrastructure leads and technical administrators configuring global third-party service connections.
- **Key Dependencies**: React, `SuperAdminLayout`, TanStack Query, `fetchApi`, Lucide Icons (`Globe`, `Key`, `Layers`, `ShieldCheck`).

---

## 2. Frontend Architecture & Global Connectors
- **Unified Provider Matrix**:
  - **WhatsApp Global API (Evolution API v2)**: Displays primary server connection URL, master API key status, and global webhook listeners. Includes instant connection test harness.
  - **Stripe Connect Platform**: Shows Stripe platform client IDs, webhook signing secrets, and live charges mode.
  - **Paystack Merchant Aggregator**: Shows master site credentials and banking clearance status.
  - **Brevo Email Relay**: Configuration status for global platform transactional emails and OTP delivery.
  - **Twilio SMS Fallback**: Shows SMS gateway credentials utilized when WhatsApp is unavailable.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /super-admin/integrations` (`backend/src/super-admin/super-admin.controller.ts`).
  - `POST /super-admin/integrations/test`.
- **Environment & Key Management**:
  Integrates with backend `ConfigService`, evaluating environment variables:
  - `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `PAYSTACK_SECRET_KEY`
  - `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`

---

## 4. Architecture & System Design
- **Credential Masking**: Sensitive API private keys and signing secrets are masked (`sk_live_...4a2b`) before transmission to the frontend, preventing credential leakage in browser inspection tools.
- **Health Verification Probes**: Provides diagnostic ping buttons to independently test connection latency to each upstream cloud provider.

---

## 5. Business Abstraction & Value Proposition
- **Infrastructure Command**: Gives platform operators a single control pane to monitor the health of all upstream third-party APIs that power the SaaS.
- **Rapid Debugging**: Eliminates SSH terminal investigations by visually confirming third-party API availability in one click.



---

<div id="section-10-10_marketing_and_subscribers"></div>

<!-- ===================================================================== -->
<!-- SECTION 10/11: reports/super_admin/10_marketing_and_subscribers.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/10_marketing_and_subscribers.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/10_marketing_and_subscribers.md)

# Marketing, Campaigns & Subscriber Engine (`/super-admin/marketing`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/marketing/index.tsx`
- **Route Path**: `/super-admin/marketing`
- **Target Audience**: Growth marketers, customer lifecycle managers, and founders broadcasting product announcements and lifecycle emails.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `useMutation`, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`Send`, `Users`, `Activity`, `Loader2`).

---

## 2. Frontend Architecture & Email Broadcast Suite
- **Audience Segmentation Engine**:
  - Filter target recipient cohorts:
    - `ALL`: Every user and newsletter subscriber in the database.
    - `TRIAL_USERS`: Tenants currently in active 14-day evaluation.
    - `ACTIVE_SUBSCRIBERS`: Paying tenants on Standard or Premium plans.
    - `EXPIRED_TRIALS`: Unconverted tenants eligible for win-back discounts.
    - `NEWSLETTER_SUBSCRIBERS`: Public visitors who opted in via the marketing footer.
- **Campaign Composer**:
  - Email Subject Line input.
  - HTML & Markdown Content Editor: Supports rich text formatting, action buttons, and variable interpolation (`{{name}}`, `{{company}}`).
  - Pre-flight Confirmation Modal (`ConfirmModal`): Displays total calculated recipients count (e.g. "You are about to dispatch this email to 1,420 recipients") before execution.

---

## 3. Backend Integration & Batch Dispatching
- **API Endpoints**:
  - `GET /super-admin/marketing/audiences` (`backend/src/marketing/marketing.controller.ts`).
  - `POST /super-admin/marketing/send` (Dispatches broadcast campaign).
- **Batch Processing & Rate Throttling**:
  The backend `MarketingService` processes the audience list in batches of 50 recipients, passing jobs through BullMQ queues to prevent rate-limit throttling by Brevo / SMTP relays.
- **Delivery Logging**:
  Every email dispatched records an individual `CommunicationLog` entry tracking delivery status.

---

## 4. Architecture & System Design
- **CAN-SPAM & POPIA Compliance**: Automatically appends a mandatory one-click unsubscribe link and physical business address to the footer of every marketing broadcast.
- **Asynchronous Execution**: The API returns an immediate response (`202 Accepted`) with total enqueued count, allowing the background queue to handle delivery without timing out browser requests.

---

## 5. Business Abstraction & Value Proposition
- **Trial-to-Paid Conversion Maximization**: Automates targeted drip campaigns to trial users on Day 3, Day 7, and Day 12, driving trial-to-paid conversion rates up by 25–40%.
- **Zero Third-Party Tool Cost**: Eliminates the need to export customer lists to expensive external marketing tools (Mailchimp, Klaviyo), saving thousands in subscription fees.



---

<div id="section-11-11_pricing_tiers_and_plan_matrix"></div>

<!-- ===================================================================== -->
<!-- SECTION 11/11: reports/super_admin/11_pricing_tiers_and_plan_matrix.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/super_admin/11_pricing_tiers_and_plan_matrix.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/11_pricing_tiers_and_plan_matrix.md)

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



---

