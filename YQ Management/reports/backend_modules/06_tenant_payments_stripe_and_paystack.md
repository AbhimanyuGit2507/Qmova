# Backend Module Audit: Tenant Payments, Stripe Connect & Paystack

## 1. Module Overview & Source Code Manifest
- **Source Paths**:
  - `backend/src/tenant-payments/` (`tenant-payments.controller.ts`, `tenant-payments.service.ts` - 66KB, `paystack.service.ts`)
  - `backend/src/payments/` (`payments.controller.ts`, `payments.service.ts`)
- **Core Entities Managed**: `TenantPaymentAccount`, `BookingPayment`, `VisitInvoice`, `PaymentMethod` enum, `BookingPaymentStatus` enum.
- **Architectural Scope**: Dual-rail embedded customer payment processing, South African domestic bank verification via Paystack, international card processing via Stripe Connect custom onboarding, POS counter payments (Cash, Card Terminal, EFT), webhook reconciliations, and abandoned checkout sweeping.

---

## 2. API Controllers & Routing Endpoints
- **`TenantPaymentsController` (`/tenant-payments`)**:
  - `GET /tenant-payments/status`: Returns gateway onboarding and charges status.
  - `GET /tenant-payments/banks`: Lists South African clearing bank codes.
  - `POST /tenant-payments/verify-bank-account`: Live bank account name verification.
  - `POST /tenant-payments/connect-paystack`: Creates merchant subaccount.
  - `POST /tenant-payments/connect-stripe`: Generates Stripe Connect onboarding link.
  - `POST /tenant-payments/toggle-enabled`: Master online payments kill-switch.
  - `POST /tenant-payments/intent`: Creates payment session for customer checkout.
  - `POST /tenant-payments/record-manual`: Staff records in-person Cash/Terminal payment.
  - `POST /tenant-payments/refund`: Issues refund for service payment.
  - `POST /tenant-payments/webhook/stripe`: Handles Stripe charge events.
  - `POST /tenant-payments/webhook/paystack`: Handles Paystack charge events.

---

## 3. Service Layer Architecture & Banking Verification
- **Paystack Subaccount & South African Banking Integration**:
  Verifies merchant bank accounts via Paystack Bank Resolve API:
  ```typescript
  async verifyBankAccount(dto: { accountNumber: string; bankCode: string }) {
    const res = await this.paystackService.resolveAccountNumber(dto.accountNumber, dto.bankCode);
    return { accountName: res.account_name, accountNumber: res.account_number };
  }
  ```
  Creates subaccounts with automated split percentages, directing customer payments to the merchant's bank account while retaining the platform fee.
- **Stripe Connect Custom Accounts**:
  Generates Stripe Account Links for express onboarding, configuring capabilities (`card_payments`, `transfers`).
- **Abandoned Checkout Sweeper (`TasksService.handleAbandonedPaymentsCleanup`)**:
  Cron executes every 15 minutes (`*/15 * * * *`). Queries visits in `PENDING_PAYMENT` state older than 15 minutes, automatically cancels both the payment and visit, and releases the reserved slot back to the public.

---

## 4. Architecture & Security Controls
- **Webhook Cryptographic Signature Verification**:
  - Stripe webhooks verify `stripe-signature` using `stripe.webhooks.constructEvent(rawBody, signature, secret)`.
  - Paystack webhooks verify `x-paystack-signature` using HMAC SHA-512 against raw payload bytes.
- **Zero Raw Card Data Storage**: Card details are tokenized by Stripe Elements or Paystack Inline modals; Qmova servers never touch PAN or CVV numbers.

---

## 5. Business Abstraction & Value Proposition
- **High-Margin GMV Take-Rates**: Transforms Qmova from a pure subscription tool into a fintech platform, earning a percentage take-rate on all Gross Merchandise Value (GMV) processed through waiting rooms.
- **In-Queue Point of Sale**: Monetizes idle customer waiting time by facilitating pre-payments, product purchases, and service add-ons directly on mobile wait screens.

