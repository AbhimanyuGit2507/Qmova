# Payment Gateways & Merchant Payouts (`/dashboard/settings/payments`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/settings/payments.tsx`
- **Supporting Components**:
  - `frontend/src/components/settings/payments.tsx` (Gateway Connect)
  - `frontend/src/components/settings/tax.tsx` (Tax & Invoicing Rules)
- **Route Path**: `/dashboard/settings/payments`
- **Target Audience**: Business owners, practice managers, and finance officers configuring customer payment processing and bank settlements.
- **Key Dependencies**: React (`useState`), `SettingsLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`CreditCard`, `Landmark`, `ShieldCheck`, `CheckCircle2`, `Wallet`, `Sliders`, `Power`).

---

## 2. Frontend Architecture & Dual Gateway Configuration
- **Master Online Payments Toggle (`toggleOnlinePaymentsMutation`)**:
  - Single master switch enabling or disabling all online customer transactions across booking links, kiosks, and wait screens (`POST /tenant-payments/toggle-enabled`).
  - When disabled, services automatically default to in-person "Pay at Counter".
- **Tab 1: South Africa Local Bank Settlements (Paystack Subaccounts)**:
  - Supports all major South African commercial banks: Capitec Bank, First National Bank (FNB), Standard Bank, Nedbank, Absa Bank, TymeBank, Discovery Bank, Investec, African Bank, Bidvest, Sasfin.
  - Interactive Account Verification: Staff enters Account Number and selects Bank; clicking "Verify Account" invokes `POST /tenant-payments/verify-bank-account`, retrieving and displaying the official account holder's registered name directly from national banking clearing databases.
  - Linking confirms automated settlement splits directly into the merchant's local bank account.
- **Tab 2: International Payments (Stripe Connect Custom Accounts)**:
  - Embedded Stripe Connect onboarding card.
  - Generates custom onboarding link (`POST /tenant-payments/connect-stripe`) allowing businesses in 40+ countries to connect credit card processing, Apple Pay, and Google Pay.
  - Displays live onboarding status badges: `Charges Enabled`, `Payouts Active`, `Details Submitted`.
- **Tax & Invoicing Settings (`TaxSettings.tsx`)**:
  - Value Added Tax (VAT) rate configuration (default 15% for South Africa).
  - Business Tax Registration Number / VAT Number for invoice headers.

---

## 3. Backend Integration & Service Architecture
- **API Endpoints**:
  - `GET /tenant-payments/status` (`backend/src/tenant-payments/tenant-payments.controller.ts`).
  - `GET /tenant-payments/banks` (Lists South African bank codes).
  - `POST /tenant-payments/verify-bank-account` (Calls Paystack Bank Verification API).
  - `POST /tenant-payments/connect-paystack` (Creates subaccount with split configuration).
  - `POST /tenant-payments/connect-stripe` (Creates Stripe Connect account link).
  - `POST /tenant-payments/reset-stripe` & `/reset-paystack` (Disconnection handlers).
  - `POST /tenant-payments/toggle-enabled` (Master kill switch).
- **Service Layer (`tenant-payments.service.ts` - 66KB)**:
  Contains full webhook signature verifiers for both Paystack (`handlePaystackWebhook`) and Stripe (`handleStripeWebhook`), handling charge confirmations, refunds, and auto-sweeping abandoned payments.

---

## 4. Architecture & System Design
- **Zero Merchant PCI Liability**: Credit card tokens and bank credentials are never stored on Qmova servers; all card inputs are tokenized via Stripe Elements or Paystack Inline modals.
- **Platform Take-Rate Splitting**: Paystack subaccounts and Stripe Connect transfer configurations support automated platform fee deduction, enabling Qmova to collect a percentage revenue share on customer payments.

---

## 5. Business Abstraction & Value Proposition
- **Turn Waiting into Revenue**: Transforms queue tickets from passive wait screens into active digital points of sale. Customers can prepay consultation fees, order restaurant dishes, or buy salon products while waiting.
- **Hyper-Local Banking Optimization**: Native Capitec, FNB, and Absa account verification eliminates failed EFT payouts, tailored specifically for the South African commercial landscape.

