# Dashboard Router & Root Overview (`/dashboard/index.tsx`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/index.tsx`
- **Route Path**: `/dashboard`
- **Target Audience**: All authenticated tenant users entering the back-office management environment.
- **Key Dependencies**: React (`useEffect`), Next.js `useRouter`, `useAuth` hook.

---

## 2. Frontend Architecture & Role-Based Gateway
- **Intelligent Persona Router**:
  Rather than presenting an identical generic dashboard to every employee, `/dashboard` functions as a role-sensitive redirect gateway:
  ```typescript
  export default function DashboardIndex() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
      if (user?.role === 'STAFF') {
        router.replace('/dashboard/my-desk');
      } else {
        router.replace('/dashboard/service-desk');
      }
    }, [router, user]);

    return null;
  }
  ```
- **Routing Rules**:
  1. **Role = `STAFF` (Doctors, Stylists, Counter Tellers)**: Automatically redirected to their personal workstation terminal (`/dashboard/my-desk`), bypassing administrative configuration panels to eliminate operational distractions.
  2. **Role = `OWNER`, `ADMIN`, or `MANAGER`**: Automatically redirected to the reception floor command center (`/dashboard/service-desk`), granting immediate access to active queue triage, customer check-in, appointments calendar, and billing.

---

## 3. Backend Integration & Session Verification
- **Identity Provider**: Backed by `useAuth()` which evaluates `GET /auth/me`.
- **Edge Middleware Authentication**: Requests to `/dashboard` are guarded by the Next.js edge middleware (`middleware.ts`). If the user does not possess a valid `token` cookie or bearer token, the middleware issues a redirect to `/login` before rendering occurs.

---

## 4. Architecture & System Design
- **Zero-Latency Trampoline**: Renders `null` and issues client-side `router.replace` (preventing history stack pollution so clicking the browser "Back" button does not loop the user).
- **Subdomain Middleware Safety**: Excluded from tenant subdomain rewriting via `isGlobalPath`, ensuring seamless back-office access regardless of domain context.

---

## 5. Business Abstraction & Value Proposition
- **Role-Appropriate Focus**: Frontline service providers (e.g. surgeons, hair stylists) should never be overwhelmed with financial invoicing or global user administration; conversely, reception managers need high-level floor control. Automated persona routing accelerates daily operational readiness.

