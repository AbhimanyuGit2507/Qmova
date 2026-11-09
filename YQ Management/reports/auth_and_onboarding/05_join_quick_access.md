# Quick Join Queue & Team Access Portal (`/join`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/join.tsx`
- **Route Path**: `/join`
- **Target Audience**: New team members receiving an invite code or physical walk-in visitors entering an on-premises short code.
- **Key Dependencies**: React (`useState`, `useEffect`), Next.js (`useRouter`, `Head`), `useAuth` hook, `fetchApi`, Lucide Icons (`Loader2`, `ArrowRight`, `Check`, `AlertCircle`), `Logo`.

---

## 2. Frontend Architecture & Flow Logic
- **Dual Operating Modes**:
  1. **Direct Invite Code Link (`/join?code=ABC123XYZ`)**: Extracts code, writes it to `localStorage` (`qmova_invite_code`) and browser cookies, and automatically resolves the target workspace preview.
  2. **Manual Short Code Entry**: Clean, minimal input card where users can manually type or paste a 6-to-8 character workspace or queue code.
- **State Machine (`status`)**:
  - `'loading'`: Checking authentication status and evaluating URL query parameters.
  - `'ready'`: Waiting for user code submission or confirmation.
  - `'joining'`: Executing join mutation with animated spinner.
  - `'success'`: Confirmed membership transition leading to `/dashboard`.
  - `'error'`: Displays descriptive error (expired invite, quota exceeded, invalid code).

---

## 3. Backend Integration & Data Mutation
- **API Endpoint**: `POST /workspace/join` (or `POST /invitations/accept`).
- **Backend Verification**:
  1. Looks up `Invitation` record matching code.
  2. Verifies `expiresAt > now()` and `usedCount < maxUses`.
  3. Binds authenticated `User(id)` to `Tenant(id)` with the role designated in the invite.
  4. Increments `usedCount` and marks `used = true` if single-use.
  5. Returns success payload and emits team membership audit log.

---

## 4. Architecture & System Design
- **Cross-Domain Invitation Persistence**: Storing the invite code in both cookie and `localStorage` guarantees that if an unauthenticated user is redirected through Google Sign-In or email verification, the original invite code survives multi-domain redirects and binds upon first login.
- **Global Path Exclusion**: `/join` is included in Next.js middleware `globalPaths`, preventing it from being rewritten into a specific tenant subdomain namespace.

---

## 5. Business Abstraction & Value Proposition
- **Viral Expansion Loop**: Removes friction from team member onboarding. An owner sends an invite link over WhatsApp or Slack; team members click, authenticate, and land in the live desk within 10 seconds.
- **Physical QR Shortcodes**: Can be deployed on physical posters in branches for instant counter assignments or quick staff device pairing.

