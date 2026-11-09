# Waiting Room Digital Signage & TV Display (`/tv/[tenantId]`, `/public/display/[id]`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/tv/[tenantId].tsx` (Tenant-wide TV signage display)
  - `frontend/src/pages/public/display/[id].tsx` (Queue-specific signage display alias)
- **Route Paths**: `/tv/[tenantId]`, `/public/display/[id]`
- **Target Audience**: Waiting room crowds watching large wall-mounted TV monitors in clinics, hospitals, banks, and customer centers.
- **Key Dependencies**: React (`useState`, `useEffect`, `useRef`, `useCallback`), Next.js `useRouter`, `io` (Socket.io client), Lucide Icons (`Volume2`, `VolumeX`, `ArrowRight`, `Clock`, `Users`, `CheckCircle2`), `react-qr-code`, `Logo`, Framer Motion (`AnimatePresence`, `motion`).

---

## 2. Frontend Architecture & Signage Display System
- **10-Foot User Interface (10ft UI)**:
  - High-visibility typography legible from 20+ feet away across busy waiting areas.
  - High-contrast dark theme optimized for LCD and OLED monitors without screen burn-in.
- **Split-Screen Layout Architecture**:
  1. **Primary Calling Hero (Left / Top)**:
     - Prominently showcases the currently called token in large 96px+ typography (e.g. `TOKEN A042 -> COUNTER 3`).
     - Animated pulse glow and flashing banner upon each call event.
     - Cyclic rotation: If multiple tokens are called simultaneously, cycles through active tokens every 6 seconds.
  2. **Upcoming Waiting List Ticker (Right / Bottom)**:
     - Real-time scrolling ticker displaying upcoming tokens (e.g., `Next: A043, A044, B012, B013`).
  3. **Lobby QR Code Standee**:
     - Embedded large QR code allowing arriving visitors to scan the TV screen with their smartphone camera to join the line.
  4. **Audio & Text-to-Speech Engine**:
     - Web Speech API speech synthesis integration (`speechSynthesis.speak`).
     - Upon ticket calling, announces: *"Token A 0 4 2, please proceed to Consultation Room 3"*.
     - Configurable language accent and chime chime tones.

---

## 3. Backend Integration & WebSocket Broadcast Rails
- **API Endpoints**:
  - `GET /public/display/:id` or `GET /tv/:tenantId` (Initial hydration of waiting and called lists).
- **Socket.io Event Subscriptions**:
  - Binds to `location_{locationId}` or `tenant_{tenantId}` room.
  - Subscribes to:
    - `visit:called`: Immediately triggers audio chime and updates calling hero card.
    - `visit:created`: Adds new token to upcoming ticker.
    - `visit:completed`: Removes ticket from active board.

---

## 4. Architecture & System Design
- **Autonomous Recovery & Zero-Maintenance**:
  - Network disconnection listener with automatic exponential backoff re-connection.
  - Auto-reloading iframe / heartbeat watchdog preventing frozen screens during long 12-hour continuous display shifts.
  - Audio Autoplay Unlock: Includes an overlay button ("Click to Enable Audio") respecting browser media autoplay security policies.

---

## 5. Business Abstraction & Value Proposition
- **Lobby Chaos Neutralization**: Eliminates ambient waiting room anxiety. Visitors relax knowing that whenever a ticket is called, the TV flashes brightly and announces their number clearly.
- **Professional Brand Aura**: Replaces taped paper notices and static cork boards with modern, high-tech digital signage that elevates brand perception.

