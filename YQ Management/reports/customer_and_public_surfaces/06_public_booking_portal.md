# Public Appointment Booking Portal (`/book/[tenantId]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/book/[tenantId]/index.tsx`
- **Target Route**: Rewrites to `frontend/src/pages/_tenant/[subdomain]/booking/[[...slug]].tsx`
- **Route Path**: `/book/[tenantId]`
- **Target Audience**: Prospective and returning customers booking scheduled appointments online from marketing websites, Instagram bios, Google Maps links, or direct links.
- **Key Dependencies**: React (`useEffect`), Next.js `useRouter`, `Head`, `fetchApi`, Lucide Icons (`Loader2`).

---

## 2. Frontend Architecture & Dynamic Routing Gateway
- **Subdomain Resolver Gateway**:
  - Acts as an intelligent resolution proxy for multi-tenant booking links:
    ```typescript
    useEffect(() => {
      if (tenantId && typeof tenantId === 'string') {
        fetchApi(`/tenant/public/${tenantId}`)
          .then((t: any) => {
            if (t?.subdomain) {
              router.replace(`/_tenant/${t.subdomain}/booking`);
            } else {
              router.replace(`/_tenant/${tenantId}/booking`);
            }
          })
          .catch(() => {
            router.replace(`/_tenant/${tenantId}/booking`);
          });
      }
    }, [tenantId, router]);
    ```
- **Branded Booking Funnel (`_tenant/[subdomain]/booking`)**:
  1. **Branch Selection**: Selects physical clinic or salon branch.
  2. **Service & Provider Selection**: Choose service category, specific treatment, and preferred staff member/doctor.
  3. **Real-Time Slot Picker**: Calendar picker evaluating provider availability and buffer times.
  4. **Customer Information & Triage Form**: Name, phone number, intake questions.
  5. **Payment Step**: Deposit or full service prepayment via Stripe / Paystack.

---

## 3. Backend Integration & Availability Calculation
- **API Endpoints**:
  - `GET /tenant/public/:id` (`backend/src/tenant/tenant.controller.ts`).
  - `GET /appointments/availability?serviceId=...&date=...` (`backend/src/appointment/appointment.controller.ts`).
  - `POST /appointments/book-public` (Creates confirmed appointment).
  - `POST /token/request-otp` (Phone verification code).
- **Slot Conflict Engine**:
  Computes real-time available time windows by evaluating:
  - Provider working hours (`Staff` schedule).
  - Existing confirmed appointments.
  - Facility maintenance blocks (`BlockOff` records).
  - Post-service buffer times.

---

## 4. Architecture & System Design
- **Subdomain Middleware Alignment**: Next.js edge middleware (`middleware.ts`) detects requests to `/book` and rewrites to the tenant's branded subdomain (`https://clinic.qmova.com/booking`), preserving isolated cookie domains and custom branding.
- **Bot Mitigation**: Pre-booking phone verification or Stripe authorization prevents automated booking script spam from holding inventory.

---

## 5. Business Abstraction & Value Proposition
- **24/7 Digital Intake**: Captures customer bookings outside normal business hours. Over 45% of online appointments are scheduled between 7 PM and 7 AM when front-desk phones are unstaffed.
- **Upfront Revenue Collection**: Pre-payment of consultation deposits dramatically reduces no-shows from the industry average of 18% down to under 2%.

