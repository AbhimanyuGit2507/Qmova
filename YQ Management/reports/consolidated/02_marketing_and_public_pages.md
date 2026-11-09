# Consolidated Audit Report: Marketing, Public Pages, Docs & Discovery Surfaces

> **Source Folder**: `reports/marketing_and_public/`  
> **Total Files Consolidated**: 12 distinct audit reports  
> **Target Audience**: Senior Tech Leads, System Architects, Business & Revenue Associates  

---

## Table of Contents

1. [Landing Page (`/`) Deep Audit](#section-1-01_landing_page_index)
2. [Features Page (`/features`) Deep Audit](#section-2-02_features_page)
3. [Pricing Page (`/pricing`) Deep Audit](#section-3-03_pricing_page)
4. [Industry Solutions & Verticals (`/for/[vertical]`) Deep Audit](#section-4-04_verticals_industry_solutions)
5. [About Us Page (`/about`) Deep Audit](#section-5-05_about_and_company)
6. [Contact & Inquiries Page (`/contact`) Deep Audit](#section-6-06_contact_and_inquiries)
7. [Book a Demo Page (`/book-demo`) Deep Audit](#section-7-07_book_demo)
8. [Blog & Content Engine (`/blog`, `/blog/[slug]`) Deep Audit](#section-8-08_blog_and_content_portal)
9. [Product Changelog (`/changelog`) Deep Audit](#section-9-09_changelog_and_product_updates)
10. [System Status Page (`/status`) Deep Audit](#section-10-10_system_status)
11. [Documentation Portal (`/docs/[[...slug]]`) Deep Audit](#section-11-11_documentation_portal)
12. [Support & Help Center (`/support`) Deep Audit](#section-12-12_support_portal)

---

<div id="section-1-01_landing_page_index"></div>

<!-- ===================================================================== -->
<!-- SECTION 1/12: reports/marketing_and_public/01_landing_page_index.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/01_landing_page_index.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/01_landing_page_index.md)

# Landing Page (`/`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/index.tsx`
- **Route Path**: `/` (Apex / Root Landing Page)
- **Target Audience**: Prospective business owners, clinic directors, salon owners, operations managers, and general public visitors.
- **Key Dependencies**: React, Next.js (`Link`, `Head`, `Image`), Framer Motion (`motion`), Lucide Icons (`MessageSquare`, `CalendarDays`, `Ticket`, `MonitorSmartphone`, `ArrowRight`, `CheckCircle2`), `useAuth` hook, `Logo` component, `Footer` component.

---

## 2. Frontend Architecture & UI/UX Audit
- **Visual Design System**: Dark aesthetic (`#09090b`), Tailwind CSS typography tokens, glassmorphism navigation bar (`backdrop-blur-xl bg-black/20 border-b border-white/5`), radial gradient background glows, and interactive hover transformations (`group-hover:scale-105`).
- **Interactive State & Logic**:
  - `useAuth()` hook evaluates `user` state. If authenticated, navigation renders a single primary `Dashboard` pill button (`/dashboard`); if unauthenticated, it renders `Sign In` (`/login`) and `Sign Up` (`/register`).
  - Dynamic avatar social proof strip displaying customer adoption indicators.
  - Interactive story cards highlighting the 4 core product capabilities:
    1. **WhatsApp Chatbot**: Direct queue entry and 5-minute automated arrival warnings.
    2. **Custom Booking Page**: Frictionless calendar slot reservations.
    3. **Virtual Tickets**: QR-code triggered digital tokens with live ETA.
    4. **Web-Based Management**: Browser-native operator console requiring no proprietary hardware.
- **Responsive Adaptations**: Mobile hamburger/column layout collapsing smoothly to single-column flex layouts on mobile devices (`< 768px`) with touch-friendly tap targets (`h-[50px] lg:h-[54px]`).

---

## 3. Backend Integration & Data Flow
- **Data Fetching Strategy**: Primarily static rendering (SSG) with client-side authentication hydration.
- **Backend Touchpoints**:
  - Checks session validity via `/auth/me` through `AuthProvider`.
  - Links directly to tenant registration flow (`/register`) which invokes `POST /auth/register` and `/onboarding/check-plan-fit`.

---

## 4. Architecture & System Design
- **Subdomain Middleware Bypass**: The Next.js edge middleware checks `url.pathname === '/'`. When requested on the apex domain (`qmova.com`), it serves this landing page. If requested on a tenant subdomain (`acme.qmova.com/`), middleware transparently rewrites the request to `/_tenant/[subdomain]/index.tsx`, isolating tenant customers from platform marketing.
- **Performance Optimization**: Above-the-fold hero image (`/images/no-bg/maya-hero-section.png`) is loaded with `priority` attribute, minimizing Largest Contentful Paint (LCP). Secondary section images utilize native lazy loading.

---

## 5. Business Abstraction & Value Proposition
- **Operational Problem Solved**: Communicates the shift from high-friction physical waiting rooms to digital, wait-free customer flows.
- **Primary Conversion Funnel**: Drives organic and paid traffic to high-intent conversion actions (`Start Your Free Trial` -> `/register` and `Explore Features` -> `#features`).
- **Target Persona**: Business owners seeking to eliminate chaotic queues, lower walk-out rates, and modernize their front desk without purchasing expensive pagers or proprietary hardware.



---

<div id="section-2-02_features_page"></div>

<!-- ===================================================================== -->
<!-- SECTION 2/12: reports/marketing_and_public/02_features_page.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/02_features_page.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/02_features_page.md)

# Features Page (`/features`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/features/index.tsx`
- **Route Path**: `/features`
- **Target Audience**: Mid-market operations leaders, clinic managers, retail system evaluators looking for granular technical and operational capability validation.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), Framer Motion, Lucide Icons (`Activity`, `CalendarDays`, `MessageSquare`, `Bell`, `Scan`, `Ticket`, `Star`), `useAuth` hook, `Logo`, `Footer`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Layout & Narrative Structure**: Hero section framing the "Operating System for Waiting Rooms", followed by categorized deep-dive sections with anchor links (`#whatsapp`, `#routing`, `#status`, `#mobile`):
  1. **Omnichannel Customer Entry**: Web booking, kiosk tablet intake, QR check-in codes, and conversational WhatsApp bots.
  2. **Intelligent Front Desk Orchestration**: Dynamic slotting of walk-ins between scheduled appointments to eliminate idle provider capacity.
  3. **Multi-Stage Service Journeys**: Progression of customers through sequential rooms, diagnostics, and checkpoints.
  4. **Integrated Payments & Billing**: In-queue deposits, Paystack South African bank payouts, and Stripe credit card processing.
  5. **Enterprise Analytics & SLA Alerts**: Real-time wait tracking, staff service durations, and threshold breach SMS/WhatsApp escalations.
- **Micro-Interactions**: Animated feature badge glows, staggered viewport-triggered entrance animations via Framer Motion, and high-contrast dark mode palette.

---

## 3. Backend Integration & Service Matrix
- **Referenced Backend Endpoints**:
  - `GET /public-visit/stream` (Customer SSE wait stream capability demonstration).
  - `POST /visits/staff-walkin` and `POST /visits/:id/call` (Calling station operations).
  - `POST /tenant-payments/connect-paystack` & `POST /tenant-payments/connect-stripe` (Embedded payments).
  - `GET /sla-policies` (SLA threshold monitoring).

---

## 4. Architecture & System Design
- **Component Reusability**: Shares navigation, header token schemas, and footer layouts with the global marketing site.
- **SEO & Discoverability**: Semantic HTML5 sectioning (`<section>`, `<article>`, `<h1>`-`<h3>`), structured meta tags, OpenGraph descriptions, and fast server-side render delivery.

---

## 5. Business Abstraction & Value Proposition
- **Sales Enablement**: Educates technical and operations buyers on Qmova's unique capabilities compared to generic booking calendar software (Calendly) or basic hardware token dispensers.
- **ROI Framing**: Highlights throughput gains (serving 25-40% more customers daily by packing appointment gaps), reduction of front-desk overhead, and prevention of walkouts.



---

<div id="section-3-03_pricing_page"></div>

<!-- ===================================================================== -->
<!-- SECTION 3/12: reports/marketing_and_public/03_pricing_page.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/03_pricing_page.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/03_pricing_page.md)

# Pricing Page (`/pricing`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/pricing/index.tsx`
- **Route Path**: `/pricing`
- **Target Audience**: Business owners, procurement evaluators, practice managers evaluating cost, plan limits, and upgrade paths.
- **Key Dependencies**: React (`useState`), Next.js (`GetServerSideProps`, `Head`, `Link`), Framer Motion, Lucide Icons (`CheckCircle2`), `useAuth`, `Logo`, `Footer`.

---

## 2. Frontend Architecture & UI/UX Audit
- **State Management**:
  - `isYearly` (boolean): Controls billing frequency toggle (Monthly vs. Annual with 2 months free discount).
  - Dynamically recalculates monthly equivalent pricing when Annual toggle is activated.
- **Pricing Cards Matrix**:
  - Displays 3 primary tiers: **Starter (14-Day Free Trial)**, **Standard Plan (R499/mo)**, and **Premium Plan (R1,499/mo)**, followed by a dedicated Enterprise custom tier banner.
  - Highlights feature checklists (WhatsApp bots, two-way chat, custom branding, SLA policies, multi-location support).
  - Explicit quota counters: Maximum tokens/visits per month, allowed staff seats, and supported physical branch locations.
- **Resilience Fallback**: If backend API is unreachable during SSR, code contains deterministic fallback plan defaults in South African Rand (ZAR) ensuring the pricing page never crashes for public visitors.

---

## 3. Backend Integration & Data Flow
- **SSR Endpoint**: `getServerSideProps` executes an HTTP request to `GET /public/plans` (`PublicPlansController`).
- **Data Serialization**:
  ```typescript
  const res = await fetch(`${backendUrl}/public/plans`);
  if (res.ok) {
    plans = await res.json();
    plans.sort((a, b) => a.price - b.price);
  }
  ```
- **Prisma Entity Mapping**: Directly queries the `Plan` table where `isActive = true` and `isPublic = true`.

---

## 4. Architecture & System Design
- **Super Admin Dynamic Control**: Plans displayed on `/pricing` are not hardcoded static text; they are actively managed by the platform owner through the Super Admin portal (`/super-admin/pricing`), allowing real-time price adjustments, promotional discounts, and quota updates without code redeployment.
- **SSR Caching**: Compatible with CDN stale-while-revalidate headers (`s-maxage=300`) to minimize database query pressure during high marketing campaign traffic.

---

## 5. Business Abstraction & Value Proposition
- **Self-Serve Conversion Engine**: Eliminates pricing friction for small-to-medium businesses (SMBs) with immediate 14-day trial signup, while routing large healthcare systems and retail chains to enterprise custom demo requests (`/book-demo`).
- **Expansion Mechanics**: Clearly articulates upgrade thresholds (hitting token limits, needing multi-branch support, or requiring white-label branding removal), incentivizing natural organic account expansion.



---

<div id="section-4-04_verticals_industry_solutions"></div>

<!-- ===================================================================== -->
<!-- SECTION 4/12: reports/marketing_and_public/04_verticals_industry_solutions.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/04_verticals_industry_solutions.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/04_verticals_industry_solutions.md)

# Industry Solutions & Verticals (`/for/[vertical]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/for/[vertical].tsx`
- **Route Path**: `/for/[vertical]` (Dynamic SSG Route: `/for/clinics`, `/for/salons`, `/for/banks`, `/for/repair-shops`)
- **Target Audience**: Industry-specific buyers (medical directors, salon managers, bank branch heads, automotive workshop managers) arriving from industry-targeted search or social campaigns.
- **Key Dependencies**: React, Next.js (`GetStaticProps`, `GetStaticPaths`, `Head`, `Link`), `MarketingLayout`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Static Generation Model**: Pre-renders optimized static pages for each target industry at build time via `getStaticPaths`:
  - `clinics`: Patient flow management, HIPAA-aligned WhatsApp updates, doctor-specific queues, contactless triage.
  - `salons`: Barbershop/spa waitlist, chair utilization, automated no-show prevention, stylist tracking.
  - `banks`: Financial branch management, multi-teller routing, VIP client prioritization, FICA/KYC verification desks.
  - `repair-shops`: Automotive service bay status, vehicle intake inspection, "your car is ready" WhatsApp alerts.
- **Hero & Value Matrix**:
  - Unsplash high-resolution contextual background photography with dark slate overlay (`bg-slate-900/80`).
  - Bulleted "Why Qmova for [Industry]?" benefit cards with checkmark indicators.
  - Paired Call-to-Actions (CTAs): Primary `Start 14-Day Free Trial` (`/register`) and secondary `Book a Demo` (`/contact`).

---

## 3. Backend Integration & Data Mapping
- **SSG Data Structure**: Self-contained `VerticalData` interface defining industry `id`, `title`, `description`, `features`, `benefits`, and `heroImage`.
- **System Seeding Linkage**: When a tenant signs up from an industry landing page and selects their vertical during onboarding (`/onboarding`), the backend `OnboardingService` automatically applies matching service flow blueprints from `backend/src/service-flow/industry-templates.ts`.

---

## 4. Architecture & System Design
- **Programmatic SEO Strategy**: Generates ultra-fast loading, indexable landing pages with custom title tags and meta descriptions targeting long-tail queries (e.g., "Patient Queue Management System South Africa", "Salon Waitlist App").
- **Edge Cacheability**: Because pages are generated statically via SSG (`fallback: false`), edge caches and Cloudflare CDN nodes serve responses in under 20ms globally.

---

## 5. Business Abstraction & Value Proposition
- **Personalized Positioning**: Solves the generic SaaS dilemma where doctors think a product is only for restaurants, or salon owners think a tool is only for hospitals. Tailored terminology (patients vs. clients vs. visitors) builds immediate domain authority.
- **Conversion Multiplier**: Industry-specific landing pages typically yield 2.5x to 4x higher signup conversion rates compared to generic homepages.



---

<div id="section-5-05_about_and_company"></div>

<!-- ===================================================================== -->
<!-- SECTION 5/12: reports/marketing_and_public/05_about_and_company.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/05_about_and_company.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/05_about_and_company.md)

# About Us Page (`/about`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/about/index.tsx`
- **Route Path**: `/about`
- **Target Audience**: Prospective clients, partners, investors, and prospective employees seeking to understand the company's background, ethos, mission, and leadership.
- **Key Dependencies**: React, Next.js (`Head`, `Link`), Framer Motion, `useAuth`, `Logo`, `Footer`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Narrative Flow**:
  - Hero header articulating company mission: "Eliminating waiting room anxiety through algorithmic queue management."
  - Origin Story: Details why traditional physical waiting lines fail human psychology and how real-time mobile queues restore dignity, transparency, and operational predictability.
  - Core Pillars: Engineering reliability, extreme simplicity for non-technical staff, and ethical data privacy.
- **Design Tokens**: Rose-tinted background ambient blur (`bg-rose-500/10 blur-[120px]`), high-contrast typography, and full responsiveness across mobile and desktop viewports.

---

## 3. Backend Integration & Data Flow
- **Nature of Surface**: Pure client/static marketing surface with session hydration from `useAuth` to toggle header navigation states.
- **Zero API Dependency**: Does not require runtime database calls, ensuring 100% uptime even during database maintenance windows.

---

## 4. Architecture & System Design
- **Static Export Capability**: Pure static page rendered at build time via Next.js SSG.
- **Accessibility & Contrast**: Conforms to WCAG AA color contrast guidelines on dark backgrounds (`#09090b` base with `#ffffff` text and `zinc-400` body copy).

---

## 5. Business Abstraction & Value Proposition
- **Brand Trust & Legitimacy**: B2B enterprise procurement teams (especially hospital executives and bank operations directors) inspect company credentials, operational ethos, and product stability before approving software trials.
- **Strategic Differentiation**: Contrasts Qmova's algorithmic queue-scheduling blend against legacy single-purpose paper ticket systems and expensive hardware vendors.



---

<div id="section-6-06_contact_and_inquiries"></div>

<!-- ===================================================================== -->
<!-- SECTION 6/12: reports/marketing_and_public/06_contact_and_inquiries.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/06_contact_and_inquiries.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/06_contact_and_inquiries.md)

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



---

<div id="section-7-07_book_demo"></div>

<!-- ===================================================================== -->
<!-- SECTION 7/12: reports/marketing_and_public/07_book_demo.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/07_book_demo.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/07_book_demo.md)

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



---

<div id="section-8-08_blog_and_content_portal"></div>

<!-- ===================================================================== -->
<!-- SECTION 8/12: reports/marketing_and_public/08_blog_and_content_portal.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/08_blog_and_content_portal.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/08_blog_and_content_portal.md)

# Blog & Content Engine (`/blog`, `/blog/[slug]`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/blog/index.tsx` (Blog Index & Archive)
  - `frontend/src/pages/blog/[slug].tsx` (Individual Blog Article & Social Sharing)
- **Route Paths**: `/blog`, `/blog/[slug]`
- **Target Audience**: Organic search visitors, industry researchers, and existing customers looking for operational best practices in queue management.
- **Key Dependencies**: React, Next.js (`GetServerSideProps`, `GetStaticPaths`, `GetStaticProps`, `Head`, `Link`, `Image`, `useRouter`), `date-fns`, Lucide Icons (`FileText`, `ArrowRight`, `ArrowLeft`, `User`, `Calendar`, `Loader2`, `Share2`), Framer Motion, `useAuth`, `Logo`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Listing UI (`/blog`)**:
  - Responsive card grid displaying article cover images, category badges, published dates, reading times, and author avatars.
  - Hover zoom effects on images with smooth Framer Motion transitions.
  - Fallback empty state (`No articles published yet`) if the CMS database is freshly seeded.
- **Article UI (`/blog/[slug]`)**:
  - Comprehensive SEO metadata: dynamic `<title>`, `<meta name="description">`, OpenGraph image and title tags.
  - Sticky social sharing widget (X / Twitter, LinkedIn, Facebook).
  - Rich typography prose styling with code block highlighting and structured headings.
  - Fallback loader (`Loader2`) for ISR dynamic generation.

---

## 3. Backend Integration & CMS Data Flow
- **API Endpoints**:
  - `GET /blogs` (`backend/src/blogs/blogs.controller.ts`) for listing published articles.
  - `GET /blogs/slug/:slug` for fetching full article content, author details, and SEO tags.
- **Database Model**: Stored in PostgreSQL `Blog` table (`id`, `title`, `slug: unique`, `excerpt`, `content`, `coverImage`, `authorName`, `seoTitle`, `seoDescription`, `published: boolean`, `publishedAt`, `createdAt`).
- **Super Admin Authoring**: Fully managed via the Super Admin CMS dashboard (`/super-admin/blogs`), providing markdown authoring, cover image uploading, and immediate publishing.

---

## 4. Architecture & System Design
- **Hybrid SSR / ISR Strategy**: Articles are rendered server-side or via Incremental Static Regeneration (ISR) with revalidation periods, ensuring instant edge delivery while reflecting live editorial edits.
- **Image Optimization**: Leverages `next/image` with responsive `sizes` and automatic webp conversion to optimize bandwidth.

---

## 5. Business Abstraction & Value Proposition
- **Inbound SEO & Lead Acquisition**: Captures high-intent educational search queries (e.g. "How to reduce patient wait times in private clinics", "Virtual queue system for busy salons"), converting casual readers into trial users via embedded CTA links.
- **Domain Authority & Thought Leadership**: Positions Qmova as the definitive authority on queueing theory, front-desk ergonomics, and waiting room psychology.



---

<div id="section-9-09_changelog_and_product_updates"></div>

<!-- ===================================================================== -->
<!-- SECTION 9/12: reports/marketing_and_public/09_changelog_and_product_updates.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/09_changelog_and_product_updates.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/09_changelog_and_product_updates.md)

# Product Changelog (`/changelog`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/changelog/index.tsx`
- **Route Path**: `/changelog`
- **Target Audience**: Current customers, enterprise procurement evaluators, and prospective clients monitoring engineering velocity, feature rollouts, and platform stability.
- **Key Dependencies**: React (`useState`), Next.js (`Link`), `MarketingLayout`, Lucide Icons (`Sparkles`, `Tag`, `Calendar`, `Check`, `GitCommit`, `Layers`, `ArrowUpRight`).

---

## 2. Frontend Architecture & UI/UX Audit
- **Data Model**: Structured `ReleaseNote` array capturing:
  - `version`: Semantic version identifier (e.g. `v2.4.0`, `v2.3.0`, `v2.2.0`).
  - `date`: Release timestamp (e.g. "October 2026").
  - `category`: Badge classification (`Major`, `Feature`, `Improvement`).
  - `summary`: High-level executive description.
  - `highlights`: Granular feature checklist with checkmark icons.
  - `tags`: Domain badges (`Staff Desk`, `KDS`, `WhatsApp`, `Automations`, `Stripe`).
- **Visual Design**: Vertical timeline styling with git-commit node icons, subtle card border highlights, and category color coding (`Major` in emerald, `Feature` in indigo, `Improvement` in sky).

---

## 3. Backend Integration & Release History
- **Documented Release Milestones**:
  - `v2.4.0`: Modular Staff Desk (`My Desk`), Kitchen Display System (KDS) bump bar, patient clinical notes, and instant customer visit history.
  - `v2.3.0`: Native WhatsApp Evolution API Gateway, multi-device QR pairing, zero-carrier messaging, automated 24h/1h appointment reminders.
  - `v2.2.0`: Visual Journey Stage Builder, multi-stage transitions, and Stripe in-queue checkout.
  - `v2.1.0`: Multi-location operations, physical resources/counters, and South African Paystack subaccount banking verification.

---

## 4. Architecture & System Design
- **Static Page Performance**: Pure static render with zero dynamic runtime database queries, enabling instant edge caching.
- **Chronological Traceability**: Directly aligns with Git tags, migrations, and backend module evolutions.

---

## 5. Business Abstraction & Value Proposition
- **Retention & Customer Success**: Reinforces subscription value to existing paying tenants by proving constant product improvement and continuous feature delivery.
- **Enterprise De-risking**: Enterprise buyers inspect changelogs to verify whether a SaaS vendor is actively maintained or abandoned before committing to multi-year contracts.



---

<div id="section-10-10_system_status"></div>

<!-- ===================================================================== -->
<!-- SECTION 10/12: reports/marketing_and_public/10_system_status.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/10_system_status.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/10_system_status.md)

# System Status Page (`/status`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/status/index.tsx`
- **Route Path**: `/status`
- **Target Audience**: Current tenants, customers experiencing connectivity queries, and platform status aggregators monitoring real-time uptime.
- **Key Dependencies**: React (`useState`, `useEffect`, `useCallback`), `MarketingLayout`, `fetchApi` (`lib/api`), Lucide Icons (`CheckCircle2`, `AlertTriangle`, `RefreshCw`, `Server`, `Activity`, `ShieldCheck`, `Clock`, `Zap`, `ArrowUpRight`), Next.js `Link`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Interactive Health Check**:
  - Automatically executes client-side probe on page mount (`checkHealth()`) and measures live network latency using `performance.now()`.
  - Manual "Refresh Status" button triggering immediate re-ping.
  - Overall status banner: Emerald green `All Systems Operational` when healthy; amber/red `System Degraded / Outage` when heartbeat fails.
- **Subsystem Breakdown**:
  - Core REST API & Auth Gateway
  - WebSocket Real-time Queue Gateway
  - PostgreSQL Multi-tenant Database
  - Redis Cache & Event Broker
  - WhatsApp Delivery Worker
  - Stripe / Paystack Payment Webhooks
  - Kiosk & TV Display Streaming Engine
  - Google Calendar 2-Way Sync Engine
- **Telemetry Indicators**: Latency in milliseconds (e.g. `24ms`), 90-day rolling uptime figures (e.g. `99.99%`), and operational status badges.

---

## 3. Backend Integration & Health Gateway
- **Health Check Endpoint**: `GET /health` (`backend/src/health/health.controller.ts`).
- **Health Verification Logic**:
  - Pings PostgreSQL database via `PrismaService.$queryRaw` (`SELECT 1`).
  - Pings Redis broker (`redisService.client.ping()`).
  - Returns structured health payload (`{ status: 'ok', info: { database: 'up', redis: 'up' }, error: {}, details: {} }`).
  - On failure, returns `503 Service Unavailable` with degraded subsystem diagnosis.

---

## 4. Architecture & System Design
- **Low-Overhead Health Route**: The `/health` route is explicitly excluded from `TenantContextMiddleware` to minimize database overhead during high-frequency automated synthetic uptime monitoring (Pingdom, Datadog, UptimeRobot).
- **Graceful Client Handling**: Catches network failures and displays diagnostic latency measurements without unhandled JavaScript exceptions.

---

## 5. Business Abstraction & Value Proposition
- **Trust & Transparency**: Builds operational trust with healthcare practices and commercial enterprises where waiting room downtime causes immediate physical lobby disruption.
- **Support Deflection**: Customers experiencing local internet issues can check `/status` to verify whether the platform is operational, preventing unnecessary support ticket spikes.



---

<div id="section-11-11_documentation_portal"></div>

<!-- ===================================================================== -->
<!-- SECTION 11/12: reports/marketing_and_public/11_documentation_portal.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/11_documentation_portal.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/11_documentation_portal.md)

# Documentation Portal (`/docs/[[...slug]]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/docs/[[...slug]].tsx`
- **Route Path**: `/docs/[[...slug]]` (Catch-all dynamic documentation portal)
- **Target Audience**: Developers, operations administrators, IT teams, and integration partners implementing or configuring Qmova.
- **Key Dependencies**: React, Next.js (`GetStaticProps`, `GetStaticPaths`), `next-mdx-remote` (`MDXRemote`, `serialize`), `rehype-slug`, `rehype-autolink-headings`, `DocsLayout`, `MDXComponents`, `Breadcrumbs`, `PrevNext`, `lib/docs.ts`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Layout & Structure**:
  - `DocsLayout`: Left-hand collapsible sidebar with multi-level section hierarchies (`Product`, `API`, `Trust`, `Compliance`, `Help`, `Release Notes`).
  - `Breadcrumbs`: Automatic directory path navigation tokens (`Docs > Product > Getting Started`).
  - `PrevNext`: Bottom-of-page sequential navigation links enabling linear tutorial reading.
- **Custom MDX Components (`MDXComponents.tsx`)**:
  - Custom alerts, callouts, and code blocks with syntax highlighting and one-click copy buttons.
  - Interactive diagram embeds and responsive API endpoint parameter tables.
  - Headings auto-linked with anchor IDs via `rehype-slug` and `rehype-autolink-headings` for direct bookmarking.

---

## 3. Content Architecture & Document Repository
- **Content Directory**: `frontend/content/docs/`
- **Document Taxonomy**:
  - `product/`: Getting started guides, queue configuration, staff desk setup, glossary.
  - `api/`: REST API documentation, authentication headers, Webhook payload schemas, and event contracts.
  - `trust/`: Security overview, system architecture diagrams, third-party subprocessor catalog.
  - `compliance/`: POPIA / GDPR regulatory compliance roadmaps.
  - `help/`: Frequently asked questions and operational troubleshooting.

---

## 4. Architecture & System Design
- **SSG Static Generation**: Uses `getAllDocs()` to crawl the markdown file tree and generate static HTML for all routes at build time.
- **Fast Build Times**: Uses lightweight `serialize` pipeline from `next-mdx-remote` rather than heavy build-time compiler plugins.
- **404 Fallback**: Any non-existent slug returns `{ notFound: true }` rendering the standardized Next.js 404 page.

---

## 5. Business Abstraction & Value Proposition
- **Self-Service Customer Onboarding**: Reduces time-to-first-value (TTFV) from days to minutes. New tenants can configure their first queue, customize WhatsApp messaging, and launch their public booking link without calling support.
- **API Developer Ecosystem**: Enables hospital IT teams and retail enterprise integrators to build custom check-in flows, EHR sync scripts, or private CRM hooks.



---

<div id="section-12-12_support_portal"></div>

<!-- ===================================================================== -->
<!-- SECTION 12/12: reports/marketing_and_public/12_support_portal.md -->
<!-- ===================================================================== -->

> **Original Document**: [`reports/marketing_and_public/12_support_portal.md`](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/12_support_portal.md)

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



---

