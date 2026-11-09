# API Catalogue & Backend Service Matrix

## 1. API Architecture Overview

The Qmova backend provides RESTful JSON endpoints and WebSocket/SSE real-time channels built on NestJS controllers. Endpoints are organized into logical modules with explicit route decorators, role-based guards (`AuthGuard('jwt')`, `RolesGuard`), validation pipes, and audit interceptors.

---

## 2. Comprehensive Endpoint Matrix

### A. Authentication & Identity Management
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `AuthController` | `/auth/register` | `POST` | Public | Registers a new tenant organization and owner user account. |
| `AuthController` | `/auth/login` | `POST` | Public | Authenticates credentials; returns JWT and sets HttpOnly cookie. |
| `AuthController` | `/auth/logout` | `POST` | `JWT` | Clears authentication cookie and revokes session. |
| `AuthController` | `/auth/me` | `GET` | `JWT` | Returns profile and permissions of authenticated user. |
| `AuthController` | `/auth/forgot-password` | `POST` | Public | Generates password reset token and sends recovery email. |
| `AuthController` | `/auth/reset-password` | `POST` | Public | Validates reset token and sets new password. |
| `UsersController` | `/users` | `GET` | `JWT (Admin)` | Lists team members for the tenant workspace. |
| `UsersController` | `/users/:id` | `PATCH` | `JWT (Admin)` | Updates user profile, role, or active status. |
| `InvitationController`| `/invitations` | `POST` | `JWT (Admin)` | Generates team invite with specific RBAC role. |
| `InvitationController`| `/invitations/verify/:token` | `GET` | Public | Validates invitation token for new staff onboarding. |

### B. Tenant & Facility Operations
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `TenantController` | `/tenant/me` | `GET` | `JWT` | Retrieves workspace profile, branding tokens, and operational hours. |
| `TenantController` | `/tenant/me` | `PATCH` | `JWT (Admin)` | Updates company name, logo, theme, and business hours. |
| `LocationController` | `/location` | `GET` | `JWT` | Lists physical branch locations for tenant. |
| `LocationController` | `/location` | `POST` | `JWT (Admin)` | Creates new physical location with address and timezone. |
| `ServiceController` | `/service` | `GET` | `JWT` / Public | Lists services offered by tenant or location. |
| `ServiceController` | `/service` | `POST` | `JWT (Admin)` | Creates a new service with pricing and duration. |
| `StaffController` | `/staff` | `GET` | `JWT` | Lists staff profiles and assigned service capabilities. |
| `ResourceController` | `/resource` | `GET` | `JWT` | Manages rooms, chairs, counters, and bays. |
| `BlockOffController` | `/block-offs` | `GET/POST`| `JWT` | Schedules maintenance and facility downtime. |
| `OnboardingController`| `/onboarding/provision-multi` | `POST` | `JWT` | Atomically provisions multiple locations, services, and queues. |

### C. Queues, Visits & Customer Interaction
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `QueueController` | `/queue` | `GET` | `JWT` | Lists queues with real-time active waiting counts. |
| `QueueController` | `/queue/:id/status`| `PATCH` | `JWT (Staff)` | Toggles queue between `ACTIVE`, `PAUSED`, and `CLOSED`. |
| `VisitController` | `/visits` | `GET` | `JWT (Staff)` | Returns filtered visits for active floor operation. |
| `VisitController` | `/visits/staff-walkin` | `POST` | `JWT (Staff)` | Receptionist manually checks in a walk-in visitor. |
| `VisitController` | `/visits/:id/call` | `POST` | `JWT (Staff)` | Calls token to specific desk/counter; triggers chime. |
| `VisitController` | `/visits/:id/start`| `POST` | `JWT (Staff)` | Marks visit as currently `IN_SERVICE`. |
| `VisitController` | `/visits/:id/complete` | `POST` | `JWT (Staff)` | Completes visit and logs operational service duration. |
| `PublicVisitController`| `/public-visit/:token` | `GET` | Public | Returns real-time wait status for customer mobile device. |
| `PublicVisitController`| `/public-visit/stream` | `SSE` | Public | Real-time Server-Sent Events stream for live wait tracking. |
| `PublicVisitController`| `/public-visit/:token/rate` | `POST` | Public | Captures 1–5 star CSAT rating and customer feedback. |
| `TokenController` | `/token/request-otp` | `POST` | Public | Dispatches WhatsApp/SMS verification code before queue join. |

### D. Multi-Step Journey & Blueprints
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `ServiceFlowController`| `/service-flows` | `GET/POST`| `JWT (Admin)` | Configures multi-stage journey blueprints for services. |
| `ServiceFlowController`| `/service-flows/apply-template` | `POST` | `JWT (Admin)` | Applies pre-built industry journey templates (Healthcare, Food, etc.). |
| `VisitStepController` | `/visit-steps/:id/transition` | `POST` | `JWT (Staff)` | Advances customer from one journey stage to the next. |
| `VisitStepController` | `/visit-steps/:token/skip-step` | `POST` | Public / Staff | Skips optional journey stage (e.g. voluntary questionnaire). |
| `VisitStepController` | `/visit-steps/:token/submit-form` | `POST` | Public | Submits digital intake responses for a specific journey step. |

### E. Financial Rails & Subscriptions
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `PlansController` | `/billing/plans` | `GET` | `JWT` | Lists available subscription tiers and feature entitlements. |
| `PublicPlansController`| `/public/plans` | `GET` | Public | Public pricing matrix for marketing pages. |
| `SubscriptionController`| `/billing/subscriptions` | `GET` | `JWT (Owner)` | Returns current subscription status and period usage. |
| `TenantPaymentsController`| `/tenant-payments/banks` | `GET` | `JWT (Admin)` | Returns supported South African banks for Paystack payouts. |
| `TenantPaymentsController`| `/tenant-payments/connect-paystack`| `POST` | `JWT (Admin)` | Verifies bank account and links Paystack subaccount. |
| `TenantPaymentsController`| `/tenant-payments/connect-stripe` | `POST` | `JWT (Admin)` | Generates Stripe Connect custom account onboarding link. |
| `TenantPaymentsController`| `/tenant-payments/intent` | `POST` | Public / Staff | Creates Stripe PaymentIntent for customer checkout. |
| `TenantPaymentsController`| `/tenant-payments/record-manual` | `POST` | `JWT (Staff)` | Records in-person Cash, Card Terminal, or EFT payment. |

### F. Communications & Omnichannel Messaging
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `WhatsappController` | `/whatsapp/connect` | `POST` | `JWT (Admin)` | Generates pairing QR code for WhatsApp Evolution API instance. |
| `WhatsappController` | `/whatsapp/status` | `GET` | `JWT (Admin)` | Returns live WhatsApp connection health. |
| `MessagesController` | `/messages` | `GET/POST`| `JWT (Staff)` | 2-way omnichannel chat thread with customer. |
| `CommunicationController`| `/communication/logs` | `GET` | `JWT (Admin)` | Delivery audit log for all SMS, WhatsApp, and Emails. |

### G. Platform Super Admin
| Controller | Route Path | Method | Auth Guard | Summary & Description |
| :--- | :--- | :--- | :--- | :--- |
| `SuperAdminController` | `/super-admin/metrics` | `GET` | `SUPER_ADMIN` | Global platform metrics: total MRR, tenants, and tokens. |
| `SuperAdminController` | `/super-admin/tenants` | `GET` | `SUPER_ADMIN` | Global tenant directory with search and impersonation. |
| `SuperAdminController` | `/super-admin/plans` | `GET/POST`| `SUPER_ADMIN` | Manages SaaS plan tiers, quotas, and feature flags. |
| `SystemLogController` | `/system-logs` | `GET` | `SUPER_ADMIN` | Global error and performance logs with stack traces. |
| `MarketingController` | `/super-admin/marketing` | `GET/POST`| `SUPER_ADMIN` | Manages newsletter subscribers and marketing campaigns. |
| `BlogsController` | `/blogs` | `GET/POST`| `SUPER_ADMIN` / Public | Blog CMS publishing engine for SEO and education. |

