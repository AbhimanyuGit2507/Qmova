# Backend Module Audit: Analytics, SLA Policies & Audit Logging

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/analytics/` (`analytics.controller.ts`, `analytics.service.ts`)
  - `backend/src/sla-policy/` (`sla-policy.controller.ts`, `sla-policy.service.ts`)
  - `backend/src/audit/` (`audit.controller.ts`, `audit.service.ts`, `audit.interceptor.ts`)
  - `backend/src/system-log/` (`system-log.controller.ts`, `system-log.service.ts`)
  - `backend/src/tasks/` (`tasks.service.ts`, `outbox-processor.service.ts`)
- **Core Entities Managed**: `SlaPolicy`, `AuditLog`, `SystemLog`, `OutboxEvent`.
- **Architectural Scope**: Operational analytics aggregation, wait time percentile calculations, SLA threshold monitoring, global NestJS audit interception, unhandled exception logging, and background cron schedules.

---

## 2. API Controllers & Routing Endpoints
- **`AnalyticsController` (`/analytics`)**:
  - `GET /analytics`: Core operational metrics (Visits, Wait times, Service duration, CSAT).
  - `GET /analytics/peak-hours`: 24x7 matrix of lobby traffic density.
  - `GET /analytics/leaderboard`: Staff productivity and satisfaction rankings.
  - `GET /analytics/sla-compliance`: SLA breach rate percentages.
- **`SlaPolicyController` (`/sla-policies`)**:
  - `GET /sla-policies`: Lists all configured SLA thresholds for tenant.
  - `POST /sla-policies`: Creates new SLA policy.
  - `PATCH /sla-policies/:id`: Updates warning/breach thresholds and escalation contacts.
- **`AuditController` (`/audit`)**:
  - `GET /audit`: Query administrative action audit trail.
- **`SystemLogController` (`/system-logs`)**:
  - `GET /system-logs`: Centralized error log inspection for Super Admin.

---

## 3. Interceptors, Crons & Background Processors
- **Global `AuditInterceptor` (`AuditInterceptor`)**:
  Intercepts all state-altering HTTP mutations (`POST`, `PUT`, `PATCH`, `DELETE`).
  Asynchronously captures:
  - `userId`: Authenticated user executing the action.
  - `tenantId`: Organization scope.
  - `action`: HTTP method + controller action.
  - `resource`: Target entity name and resource ID.
  - `ipAddress`: Client IP address.
  - `metadata`: Request body and query parameters.
- **`TasksService` Scheduled Cron Jobs**:
  1. `handleOutboxRetention` (`EVERY_DAY_AT_MIDNIGHT`): Purges completed `OutboxEvent` records older than 7 days.
  2. `handleCleanupExpiredInvitations` (`EVERY_DAY_AT_MIDNIGHT`): Expires stale team invitations and alerts administrators.
  3. `handleDataRetentionLifecycle` (`EVERY_DAY_AT_MIDNIGHT`): Permanently deletes visits older than 2 years for POPIA / GDPR compliance.
  4. `handleDeferredCancellations` (`EVERY_DAY_AT_MIDNIGHT`): Executes subscription terminations when paid periods expire.
  5. `handleAbandonedPaymentsCleanup` (`*/15 * * * *`): Releases slots for abandoned checkouts after 15 minutes.
  6. `handleCheckinReminders` (`* * * * *`): Sends T-15 and T-0 appointment reminders over WhatsApp.

---

## 4. Architecture & System Design
- **Non-Blocking Audit Logging**: The `AuditInterceptor` executes audit persistence asynchronously after the client HTTP response is flushed, ensuring zero performance penalty on user API latency.
- **Database Query Optimizations**: Analytics queries utilize composite indices on `[tenantId, createdAt, currentState]`, preventing table scans across millions of historical visits.

---

## 5. Business Abstraction & Value Proposition
- **Operational Excellence & Staff Accountability**: Identifies bottlenecks before they cause customer churn, highlighting which departments or staff members exceed wait thresholds.
- **Regulatory Peace of Mind**: Provides a complete, tamper-evident audit trail verifying compliance with security standards, HIPAA safeguards, and privacy mandates.

