# Qmova SaaS: Complete Codebase, Architecture & Business Audit

> **Master Technical & Business Audit Report**  
> *Prepared for Senior Tech Leads, System Architects, and Business Strategy Associates*

---

## 1. Executive Overview & Audit Index

This master audit provides a comprehensive, line-by-line and architectural evaluation of the **Qmova** (branded in codebase as YQ Queue / Qmova) SaaS platform. The audit examines the system across four mandatory dimensions:
1. **Frontend Architecture & UI/UX Audit** (React components, state management, hooks, real-time sockets, form validation, error boundaries, styling tokens).
2. **Backend Architecture & Service Audit** (NestJS controllers, HTTP route handlers, DTO validation, services, Prisma ORM queries, BullMQ job queues, Redis in-memory storage, background crons).
3. **System Design & Relational Topology** (55 PostgreSQL models, relational constraints, ACID transactions, transactional outbox pattern, multi-tenant isolation, real-time WebSockets and SSE streams).
4. **Business Abstraction & Monetization Playbook** (Real-world operational problems solved, target user personas, customer journeys, unit economics, revenue expansion vectors, and enterprise packaging).

The audit is organized into **9 distinct report directories containing 84 individual deep-dive audit reports**:

```
reports/
├── README.md                                      # Master Audit Index & Architecture Synthesis
├── overall/                                       # Macro System & Business Architecture (8 Reports)
├── marketing_and_public/                         # Marketing, Discovery & Conversion (12 Reports)
├── policy_and_legal/                             # Legal, Compliance, Privacy & Trust (7 Reports)
├── auth_and_onboarding/                          # Identity, Auth, Wizard & Access (5 Reports)
├── dashboard_core/                               # Primary Back-Office Workstations (13 Reports)
├── settings_pages/                               # Workspace, Team & Operations Settings (10 Reports)
├── customer_and_public_surfaces/                 # Physical & Remote Customer Experiences (9 Reports)
├── super_admin/                                  # Platform Owner Command Center (11 Reports)
└── backend_modules/                              # NestJS Domain Engines & Subsystems (9 Reports)
```

---

## 2. Master Navigation Directory

### Section 1: Overall System Architecture & Business Strategies (`reports/overall/`)
- [01. Executive Summary & SaaS Vision](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/01_executive_summary_and_saas_vision.md)
- [02. End-to-End System Architecture & Topology](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/02_end_to_end_system_architecture.md)
- [03. Multi-Tenant & Subdomain Routing Model](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/03_multi_tenant_and_subdomain_routing_model.md)
- [04. Domain Data Models & Database Schema Audit (55 Models)](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/04_domain_data_models_and_database_schema.md)
- [05. Real-Time Event Engine: WebSockets, Redis & SSE](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/05_realtime_event_engine_websockets_and_redis.md)
- [06. Business Revenue Generation Strategies & Monetization Playbook](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/06_monetization_playbook_and_revenue_strategies.md)
- [07. Security, Compliance & Data Governance Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/07_security_compliance_and_data_governance.md)
- [08. Complete API Catalogue & Service Matrix](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/overall/08_api_catalogue_and_service_matrix.md)

### Section 2: Marketing & Public Surfaces (`reports/marketing_and_public/`)
- [01. Landing Page (`/`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/01_landing_page_index.md)
- [02. Features Overview (`/features`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/02_features_page.md)
- [03. Pricing & Plan Tiers (`/pricing`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/03_pricing_page.md)
- [04. Industry Solutions & Verticals (`/for/[vertical]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/04_verticals_industry_solutions.md)
- [05. About Us & Company (`/about`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/05_about_and_company.md)
- [06. Contact & Inquiries (`/contact`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/06_contact_and_inquiries.md)
- [07. Book a Demo Portal (`/book-demo`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/07_book_demo.md)
- [08. Blog & Content Engine (`/blog`, `/blog/[slug]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/08_blog_and_content_portal.md)
- [09. Product Changelog (`/changelog`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/09_changelog_and_product_updates.md)
- [10. System Status & Health Telemetry (`/status`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/10_system_status.md)
- [11. Interactive Documentation Portal (`/docs/[[...slug]]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/11_documentation_portal.md)
- [12. Support & Help Center (`/support`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/marketing_and_public/12_support_portal.md)

### Section 3: Policy, Legal & Regulatory Compliance (`reports/policy_and_legal/`)
- [01. Privacy Policy & POPIA/GDPR Disclosure (`/privacy`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/01_privacy_policy.md)
- [02. Terms of Service & Acceptable Use (`/terms`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/02_terms_of_service.md)
- [03. Refund Policy & Subscription Terms (`/refund-policy`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/03_refund_policy.md)
- [04. Cookie Policy & Consent Engine (`/cookies`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/04_cookies_policy_and_consent.md)
- [05. Security & Compliance Policy (`/security`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/05_security_and_compliance.md)
- [06. Trust Center & Subprocessor Register (`/trust`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/06_trust_center.md)
- [07. Data Subject Rights & Erasure (`/data-request`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/policy_and_legal/07_data_request_gdpr_popia.md)

### Section 4: Authentication, Identity & Onboarding (`reports/auth_and_onboarding/`)
- [01. Staff & Tenant Login (`/login`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/01_login_and_session_management.md)
- [02. Self-Serve Registration & Account Creation (`/register`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/02_register_and_workspace_creation.md)
- [03. Password Recovery & Ephemeral Reset (`/auth/forgot-password`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/03_forgot_password_and_recovery.md)
- [04. Tenant Onboarding Wizard & Multi-Location Provisioning (`/onboarding`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/04_onboarding_wizard_and_ai_setup.md)
- [05. Quick Join Queue & Team Access Portal (`/join`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/auth_and_onboarding/05_join_quick_access.md)

### Section 5: Primary Back-Office Dashboard Workstations (`reports/dashboard_core/`)
- [01. Dashboard Router & Overview (`/dashboard`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/01_dashboard_router_and_overview.md)
- [02. Reception Service Desk (`/dashboard/service-desk`) Deep Audit (4,407 lines)](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/02_service_desk_intake_and_calling.md)
- [03. Staff Counter Workstation (`/dashboard/my-desk`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/03_my_desk_staff_workstation.md)
- [04. Queue Management Directory (`/dashboard/queues`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/04_queue_management_index.md)
- [05. Queue Operator Console (`/dashboard/queues/[id]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/05_queue_operator_console.md)
- [06. Appointments & Scheduling Calendar (`/dashboard/appointments`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/06_appointments_and_scheduling.md)
- [07. Customer Directory & CRM (`/dashboard/people`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/07_people_crm_customers_and_staff.md)
- [08. Multi-Step Journey Orchestrator (`/dashboard/journeys`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/08_journeys_and_flow_orchestrator.md)
- [09. Analytics, Business Intelligence & SLA Reports (`/dashboard/analytics`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/09_analytics_bi_and_sla_reporting.md)
- [10. Omnichannel Messaging Inbox (`/dashboard/inbox`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/10_inbox_omnichannel_messaging.md)
- [11. QR Scanner & Check-In Station (`/dashboard/scan`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/11_qr_scanner_checkin.md)
- [12. Digital Signage Display Picker (`/dashboard/display-picker`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/12_display_picker_and_tv_control.md)
- [13. Setup Guide & Activation Checklist (`/dashboard/setup-guide`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/dashboard_core/13_setup_guide_and_activation.md)

### Section 6: Workspace & Platform Settings (`reports/settings_pages/`)
- [01. Settings Hub & Layout Router (`/dashboard/settings`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/01_settings_hub.md)
- [02. Workspace & Brand Identity Settings (`/dashboard/settings/workspace`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/02_workspace_and_branding.md)
- [03. Team Members, Roles & RBAC Settings (`/dashboard/settings/team`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/03_team_members_and_rbac.md)
- [04. Operations: Locations, Services & Resources (`/dashboard/settings/operations`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/04_operations_locations_and_services.md)
- [05. Subscription Billing & Plan Quotas (`/dashboard/settings/billing`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/05_billing_and_subscriptions.md)
- [06. Payment Gateways & Merchant Payouts (`/dashboard/settings/payments`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/06_payments_stripe_paystack_gateways.md)
- [07. Integrations & Communications Settings (`/dashboard/settings/integrations`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/07_integrations_google_webhooks.md)
- [08. SLA Policies & Escalations (`/dashboard/settings/sla`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/08_sla_policies_and_escalations.md)
- [09. Staff View Layout Builder (`/dashboard/settings/staff-view`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/09_staff_view_layouts.md)
- [10. Personal Profile & Account Security (`/dashboard/settings/personal`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/settings_pages/10_personal_profile_and_security.md)

### Section 7: Physical & Remote Customer Surfaces (`reports/customer_and_public_surfaces/`)
- [01. Customer Live Wait Screen (`/customer/status/[id]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/01_customer_live_wait_screen.md)
- [02. Post-Join Queue Confirmation (`/customer/confirmation/[tokenId]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/02_customer_ticket_confirmation.md)
- [03. Customer Ticket Lookup & Token Recovery (`/customer/lookup`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/03_customer_ticket_lookup_and_recovery.md)
- [04. Self-Service Physical Tablet Kiosk (`/kiosk/[tenantId]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/04_self_service_kiosk.md)
- [05. Waiting Room Digital Signage & TV Display (`/tv/[tenantId]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/05_waiting_room_tv_signage.md)
- [06. Public Appointment Booking Portal (`/book/[tenantId]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/06_public_booking_portal.md)
- [07. Standalone Mobile Staff Terminal (`/staff-desk/[token]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/07_staff_desk_mobile_terminal.md)
- [08. Dynamic Form Intake Engine (`/form/[token]/[stepId]`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/08_dynamic_form_intake_engine.md)
- [09. Branded Tenant Subdomain Portals (`/_tenant/[subdomain]/*`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/customer_and_public_surfaces/09_tenant_subdomain_portals.md)

### Section 8: Platform Super Admin (`reports/super_admin/`)
- [01. Super Admin Command Center (`/super-admin`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/01_super_admin_dashboard.md)
- [02. Global Tenant Fleet Management (`/super-admin/tenants`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/02_tenant_fleet_management.md)
- [03. Platform Analytics & Multi-Tenant BI (`/super-admin/analytics`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/03_platform_analytics.md)
- [04. System Control & Service Kill-Switches (`/super-admin/system-control`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/04_system_control_and_feature_flags.md)
- [05. Centralized System Logs & Audit Trail (`/super-admin/system-logs`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/05_system_logs_and_audit_trail.md)
- [06. Content Management System (CMS) Administration (`/super-admin/blogs`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/06_blog_cms_administration.md)
- [07. Global Communications & Messaging Gateway (`/super-admin/communication`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/07_communication_and_channels.md)
- [08. Enterprise Inquiries & Sales Leads CRM (`/super-admin/inquiries`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/08_inquiries_and_leads_crm.md)
- [09. Global Integrations Hub (`/super-admin/integrations`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/09_integrations_hub.md)
- [10. Marketing, Campaigns & Subscriber Engine (`/super-admin/marketing`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/10_marketing_and_subscribers.md)
- [11. Global Pricing Tiers & Plan Matrix Engine (`/super-admin/pricing`) Deep Audit](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/super_admin/11_pricing_tiers_and_plan_matrix.md)

### Section 9: Backend Domain Engines (`reports/backend_modules/`)
- [01. Auth, Users & RBAC Permissions Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/01_auth_users_and_permissions.md)
- [02. Tenant & Multi-Tenancy Context Engine](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/02_tenant_and_multitenancy_context.md)
- [03. Visit & Queue Core Engine](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/03_visit_and_queue_engine.md)
- [04. Appointments & Calendar Synchronization Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/04_appointment_and_calendar_sync.md)
- [05. SaaS Subscriptions, Billing & Invoicing Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/05_billing_subscriptions_and_invoicing.md)
- [06. Tenant Payments, Stripe Connect & Paystack Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/06_tenant_payments_stripe_and_paystack.md)
- [07. Omnichannel Communications, WhatsApp & Email Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/07_omnichannel_whatsapp_and_brevo_email.md)
- [08. Service Flows, Blueprints & Multi-Stage Steps Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/08_service_flow_blueprints_and_steps.md)
- [09. Analytics, SLA Policies & Audit Logging Module](file:///home/abhimanyu/Projects/YQ/YQ%20Management/reports/backend_modules/09_analytics_sla_and_audit_logging.md)

---

## 3. System Design & Architectural Highlights

### Distributed System Patterns
1. **Transactional Outbox Pattern**: Decouples persistent relational database transactions from external side effects (WhatsApp messaging, outbound webhooks, WebSocket emissions). Events are written atomically into `OutboxEvent` and dispatched asynchronously via `BullMQ`.
2. **Subdomain Multi-Tenant Isolation**: The Next.js edge middleware parses host headers and rewrites incoming requests dynamically to `/_tenant/[subdomain]/*`, while the NestJS backend enforces foreign key scoping on all operational models.
3. **Hybrid Real-Time Topology**: Stateful Socket.io connections power staff operator stations and TV displays, while lightweight Server-Sent Events (SSE) stream live queue updates to mobile customer screens.
4. **Dual Financial Rails**: Native integration with Paystack for South African domestic bank verification (Capitec, FNB, Standard Bank, Absa) and Stripe Connect for global credit card processing.

---

## 4. Monetization Playbook & Business Mechanics

The platform captures revenue across **5 compounding vectors**:
- **SaaS Subscriptions**: Starter (Free 14-day trial), Standard (R499/mo), Premium (R1,499/mo), and Enterprise (Custom R5,000+/mo).
- **Payment Gateway Revenue Share**: Levying a 0.5%–1.5% platform take-rate on all Gross Merchandise Value (GMV) passing through customer wait screens and booking deposits.
- **WhatsApp Messaging Margins**: 70%+ gross margin on monthly message volume overages.
- **Hardware Bundles**: 40% retail margin on pre-configured kiosk tablets and Bluetooth receipt printers.
- **White-Label Custom Domains**: Premium add-ons for custom branded domains and enterprise SLAs.

---

## 5. Summary Conclusion

The Qmova codebase is a thoroughly engineered, multi-tenant B2B SaaS platform. It successfully bridges walk-in queuing, forward calendar scheduling, multi-stage clinical/retail workflows, and omnichannel customer communication within a unified, high-performance architecture.

