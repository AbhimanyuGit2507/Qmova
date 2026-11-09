# Real-Time Event Engine: WebSockets, Redis & Server-Sent Events

## 1. Real-Time Engine Architecture

Real-time synchronization across physical premises (reception desks, consultation rooms, public digital signage TVs) and customer smartphones is powered by a high-performance **Hybrid Event Layer** combining:
1. **WebSocket Gateway (Socket.io)** for low-latency, bidirectional back-office communication.
2. **Redis In-Memory Engine** for horizontal gateway clustering, distributed pub/sub broadcasting, and token sequencing.
3. **Server-Sent Events (SSE)** for lightweight, battery-efficient unidirectional updates to mobile customer screens.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend Cluster (NestJS)                        │
│                                                                        │
│   ┌─────────────────────┐                    ┌─────────────────────┐   │
│   │   Instance 1        │                    │   Instance 2        │   │
│   │   (QueueGateway)    │                    │   (QueueGateway)    │   │
│   └──────────┬──────────┘                    └──────────┬──────────┘   │
│              │                                          │              │
│              └─────────────────┬────────────────────────┘              │
│                                │ Redis Adapter (Pub/Sub)               │
│                                ▼                                       │
│                     ┌──────────────────────┐                           │
│                     │       Redis 7+       │                           │
│                     │   (Pub/Sub & Keys)   │                           │
│                     └──────────────────────┘                           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
 ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
 │  Reception Desk  │      │  Waiting Room TV │      │  Customer Phone  │
 │ (Service Desk)   │      │  Digital Signage │      │ (SSE / Polling)  │
 │ (Socket.io Room) │      │ (Socket.io Room) │      │ (Public Stream)  │
 └──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## 2. WebSocket Gateway Architecture (`QueueGateway`)

The backend gateway (`backend/src/queue/queue.gateway.ts`) establishes persistent WebSocket connections with operator consoles and digital displays.

### Room Partitioning Model
To ensure multi-tenant security and minimize network bandwidth, Socket.io clients join isolated channels based on authenticated scope:
- **`tenant_{tenantId}`**: Global tenant-level broadcast channel (system alerts, billing notifications, global statistics).
- **`location_{locationId}`**: Branch-specific channel. Broadcasts calling events and arrivals for that specific physical building.
- **`queue_{queueId}`**: Targeted queue channel. Subscribers receive token additions, removals, and priority re-orderings.
- **`user_{userId}`**: Private staff channel for personal desk assignments, transfers, and direct notifications.

### Event Catalog

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `visit:created` | Server → Client | `{ visitId, displayId, queueId, customerName, serviceId }` | Notifies staff and TV displays that a new customer has joined the line. |
| `visit:called` | Server → Client | `{ visitId, displayId, counterNumber, staffName, serviceName }` | Triggers visual highlight and audio voice chime on waiting room TV screens. |
| `visit:transferred` | Server → Client | `{ visitId, fromQueueId, toQueueId, targetStepId }` | Updates queues when a customer is escalated or routed to the next station. |
| `visit:completed` | Server → Client | `{ visitId, queueId, durationMinutes }` | Removes customer from active operator lists and updates throughput counters. |
| `queue:status_changed` | Server → Client | `{ queueId, status: 'ACTIVE' \| 'PAUSED' \| 'CLOSED' }` | Updates UI banners and kiosk intake availability. |
| `notification:sound` | Server → Client | `{ soundType: 'chime' \| 'alert', message: string }` | Directs digital signage clients to trigger synthesized audio alerts. |

---

## 3. Redis In-Memory Key Architecture & Topology

Redis functions as the primary high-speed state store. Keys follow a strict taxonomy:

| Key Pattern | Data Type | TTL | Purpose |
| :--- | :--- | :--- | :--- |
| `queue:token_seq:{locationId}:{prefix}:{date}` | String (Integer) | 48 Hours | Atomic sequence counter for daily token generation (`INCR`). |
| `otp:booking:{phone}` | String | 5 Minutes | Temporary 6-digit one-time passcode for queue joining verification. |
| `otp:recovery:{tenantId}:{phone}` | String | 5 Minutes | Passcode for lost ticket self-service lookup and recovery. |
| `ratelimit:otp:{tenantId}:{phone}` | String (Integer) | 5 Minutes | Throttling bucket (max 3 OTP requests / 5 minutes). |
| `cache:tenant:subdomain:{subdomain}` | Hash / JSON | 60 Seconds | Cached tenant branding and routing metadata for edge lookup. |
| `cache:public:plans` | String (JSON) | 5 Minutes | Public plan catalog cached for marketing pages. |
| `bull:queue_webhooks:*` | Stream / Hash | Persistent | BullMQ queue state for outgoing webhook deliveries. |
| `bull:queue_whatsapp:*` | Stream / Hash | Persistent | BullMQ queue state for asynchronous WhatsApp messaging. |

---

## 4. Server-Sent Events (SSE) for Customer Wait Screens

While staff dashboards require bidirectional WebSockets, public customer smartphones operate over **Server-Sent Events (`GET /public-visit/stream?tokens=...`)**:

```typescript
@Sse('stream')
streamStatus(@Query('tokens') tokens: string, @Req() req: Request): Observable<MessageEvent> {
  const tokenArray = tokens.split(',').map(t => t.trim()).filter(Boolean);

  // 1. Data stream: Queries latest state every 5 seconds
  const dataStream$ = timer(0, 5000).pipe(
    switchMap(() => this.visitService.findMultiplePublic(tokenArray)),
    map(visits => ({ data: visits })),
  );

  // 2. Heartbeat stream: Keep connection alive through reverse proxies
  const heartbeat$ = interval(15000).pipe(
    map(() => ({ data: ':heartbeat', type: 'ping' })),
  );

  return merge(dataStream$, heartbeat$);
}
```

### Architectural Advantages:
1. **Zero Client Library Overhead**: Built directly on native browser `EventSource` API; requires no heavy external client bundles.
2. **Battery & Data Efficiency**: Maintains a single persistent HTTP connection without the polling overhead of continuous TLS handshakes.
3. **Heartbeat Proxy Defense**: The dedicated `:heartbeat` comment frame sent every 15 seconds prevents aggressive cloud firewalls and reverse proxies (Caddy, Cloudflare, AWS ALB) from terminating idle connections.
4. **Graceful Fallback**: If SSE stream drops or cellular networks fail, the frontend React Query layer transparently falls back to window-focus revalidation and interval polling (`5000ms`).

