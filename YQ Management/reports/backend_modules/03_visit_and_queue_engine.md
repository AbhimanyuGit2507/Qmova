# Backend Module Audit: Visit & Queue Core Engine

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/visit/` (`visit.controller.ts`, `visit.service.ts`, `public-visit.controller.ts`, `token.controller.ts`)
  - `backend/src/queue/` (`queue.controller.ts`, `queue.service.ts`, `queue.gateway.ts`)
  - `backend/src/public-checkin/` (`public-checkin.controller.ts`, `public-checkin.service.ts`)
- **Core Entities Managed**: `Queue`, `Customer`, `Visit`, `CheckInOtp`, `OutboxEvent`, `VisitState` enum, `QueueStatus` enum.
- **Architectural Scope**: Token sequence generation, atomic queue entry, Estimated Wait Time (EWT) calculations, state transitions (`WAITING` → `CALLED` → `IN_SERVICE` → `COMPLETED`), Server-Sent Events, and real-time Socket.io broadcasting.

---

## 2. API Controllers & Routing Endpoints
- **`VisitController` (`/visits`)**:
  - `GET /visits`: Filtered active floor list by location, service, and state.
  - `POST /visits/staff-walkin`: Front-desk check-in for walk-in arrivals.
  - `POST /visits/:id/call`: Calls token to a specific counter; emits `visit:called`.
  - `POST /visits/:id/start`: Transitions ticket to `IN_SERVICE`.
  - `POST /visits/:id/complete`: Concludes service and records timestamps.
  - `POST /visits/:id/cancel`: Cancels ticket with operational reason.
- **`PublicVisitController` (`/public-visit`)**:
  - `GET /public-visit/:accessToken`: Returns real-time status for customer mobile device.
  - `GET /public-visit/stream`: High-efficiency Server-Sent Events (SSE) data stream.
  - `POST /public-visit/:accessToken/rate`: CSAT rating and feedback submission.
  - `POST /public-visit/queue/:queueId/join`: Public queue join endpoint.
  - `POST /public-visit/join-multiple`: Multi-booking / cart queue entry with menu selections.
- **`QueueGateway` (WebSocket Gateway)**:
  - Manages real-time rooms (`tenant_{id}`, `location_{id}`, `queue_{id}`).

---

## 3. Service Layer Architecture & Algorithms
- **Atomic Token Generator (`generateNextToken`)**:
  Uses Redis atomic increment:
  ```typescript
  const key = `queue:token_seq:${locationId}:${prefix}:${dateStr}`;
  const seq = await this.redisService.client.incr(key);
  if (seq === 1) await this.redisService.client.expire(key, 86400 * 2);
  return `${prefix}${seq.toString().padStart(3, '0')}`;
  ```
- **Estimated Wait Time (EWT) Algorithm**:
  Calculated using Exponential Moving Average (EMA) of recent completed service durations multiplied by active customers ahead in line, dynamically accounting for multi-counter concurrency.
- **Transactional Ingestion (`joinQueue`)**:
  Executes inside a single `prisma.$transaction`: checks subscription quotas (`checkLimit`), upserts customer CRM record, generates token, creates `Visit`, instantiates multi-stage `VisitStep` records, and creates an `OutboxEvent` for background processing.

---

## 4. Architecture & Concurrency Protections
- **Optimistic Locking on Token Calls**: Token calling verifies that the visit's `currentState` is `WAITING`, preventing two operators from claiming the same customer simultaneously.
- **Transactional Outbox Integration**: Database mutations write `OutboxEvent` records within the same transaction, guaranteeing that WebSocket and WhatsApp notifications fire reliably without dual-write drift.

---

## 5. Business Abstraction & Value Proposition
- **The Core Engine of Qmova**: Serves as the heart of the platform. Converts chaotic physical crowds into an orderly, mathematical digital pipeline.
- **Throughput Optimization**: Shaves idle minutes between service calls, allowing clinics, salons, and counters to serve 20–35% more customers per shift.

