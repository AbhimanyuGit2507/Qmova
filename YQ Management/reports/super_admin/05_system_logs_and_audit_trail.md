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

