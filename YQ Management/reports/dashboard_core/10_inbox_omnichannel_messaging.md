# Omnichannel Messaging Inbox (`/dashboard/inbox`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/inbox.tsx`
- **Route Path**: `/dashboard/inbox`
- **Target Audience**: Front desk receptionists, customer support agents, and clinic coordinators communicating directly with visitors.
- **Key Dependencies**: React (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`), `AdminLayout`, TanStack Query, `EmojiPicker`, Sonner `toast`, `useSocket`, `useLocation`, `ConfirmModal`, `CustomerDrawer`, `CustomerDossierSidebar`, Lucide Icons.

---

## 2. Frontend Architecture & Two-Way Messaging UI
- **Three-Column Communication Cockpit**:
  1. **Conversation Thread List (Left)**: Shows all active chats, unread badge counters, last message preview, timestamp, channel indicator (WhatsApp vs. SMS), and search bar.
  2. **Active Chat Window (Center)**:
     - Message bubble stream with read-receipt checkmarks (`CheckCheck`).
     - Bot-to-Human Handover banner: Allows staff to toggle AI/Bot automation on or off for a specific customer thread.
     - Rich Input Bar: Emoji picker (`emoji-picker-react`), file/image attachment uploader, and canned quick-response templates.
  3. **Customer Dossier Sidebar (Right)**:
     - Real-time customer details, current active ticket token (`displayId`), assigned queue, current stage, and past visit history.
- **Real-Time WebSocket Updates**:
  Listens via `useSocket` for `message:received` and `message:delivered` events, appending incoming customer WhatsApp messages into the live chat thread without page polling.

---

## 3. Backend Integration & Omnichannel Gateway
- **API Endpoints**:
  - `GET /messages/conversations` (`backend/src/messages/messages.controller.ts`).
  - `GET /messages/:conversationId` (Fetches message history).
  - `POST /messages/send` (Dispatches outgoing message).
  - `PATCH /messages/conversations/:id/toggle-bot` (Toggles automated WhatsApp bot).
  - `POST /upload/attachment` (Handles image/PDF uploads).
- **Omnichannel Service Routing**:
  The backend `CommunicationService` routes outgoing messages:
  - If tenant has active Evolution API WhatsApp connection, sends via WhatsApp (`whatsappService.sendToTenant`).
  - If WhatsApp is unavailable or recipient is mobile-only, falls back to SMS (`smsService.send`).
  - Logs delivery in `CommunicationLog` table.

---

## 4. Architecture & System Design
- **Bot-to-Human Handover Protocol**: When a staff member types a manual response, the system automatically sets `botMutedUntil = now() + 2 hours`, pausing AI chatbot automated responses so the human conversation flow is not disrupted.
- **Media Attachment Caching**: Uploaded files are validated for MIME type, sanitized, and stored in static `/uploads` storage or cloud bucket with secure URL generation.

---

## 5. Business Abstraction & Value Proposition
- **Single Channel Simplicity**: Customers stay on WhatsApp (the app they already have open), while staff manage conversations inside a unified, professional desktop inbox linked directly to the customer's queue ticket.
- **No-Show Rescue**: If a patient is late or in the parking lot, the receptionist can send a quick one-click WhatsApp text ("Dr. Smith is ready for you in Room 3!"), salvaging the appointment.

