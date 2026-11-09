# Business Revenue Generation Strategies & Monetization Playbook

## 1. Executive Monetization Thesis

Qmova is positioned not merely as a simple ticket-printing tool, but as an **operational efficiency and revenue optimization operating system** for physical and hybrid service businesses. By converting idle waiting time into structured digital engagement, Qmova captures value across five compounding revenue vectors:

```
                              ┌────────────────────────────────────────┐
                              │     Qmova Total Revenue Engine         │
                              └───────────────────┬────────────────────┘
                                                  │
         ┌───────────────────┬────────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                    ▼                   ▼                   ▼
   [ Vector 1 ]        [ Vector 2 ]         [ Vector 3 ]        [ Vector 4 ]        [ Vector 5 ]
   SaaS Platform      Usage & Quota       Payment Gateway     Hardware & Kiosk    Enterprise SLAs &
   Subscriptions        Overages             Take-Rate            Add-ons          Custom Features
 (R499 - R1,499+/mo) (Tokens, WhatsApp)   (0.5% - 1.5% GMV)  (Tablets, Printers)    (& Integrations)
```

---

## 2. Multi-Tier Subscription Packaging

The SaaS subscription engine (`backend/src/plans` and `backend/src/subscription`) supports recurring billing (Monthly and Annual with 2 months free discount):

| Plan Tier | Target Segment | Pricing (ZAR / mo) | Annual (ZAR / yr) | Token Quota | Location Limit | Staff Seats | Core Feature Entitlements |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter (Trial)** | Single barber, boutique salon, solo practitioner | R0 (14-Day Free) | N/A | 100 / mo | 1 Location | 1 Staff Seat | Basic QR queue, manual ticket calling, web booking link. Standard Qmova branding watermark. |
| **Standard** | Busy medical clinic, popular restaurant, service center | **R499 / mo** | R4,990 / yr | 1,000 / mo | 3 Locations | 10 Staff Seats | WhatsApp automated notifications, 2-way WhatsApp chat inbox, custom intake forms, digital signage TV display. |
| **Premium** | Healthcare clinic network, multi-chair salon, government branch | **R1,499 / mo** | R14,990 / yr | 10,000 / mo | 10 Locations | 50 Staff Seats | Multi-step journey blueprints, automated SLA escalation alerts, custom branding (white-label watermark removal), priority support. |
| **Enterprise** | Hospital chains, banking networks, retail retail chains | **Custom (R5,000+)** | Custom Annual | Unlimited | Unlimited | Unlimited | Dedicated Evolution API WhatsApp instance, custom subdomain SSL, ERP/HIS integration, 99.9% uptime SLA, dedicated account manager. |

---

## 3. High-Margin Expansion Vectors

### Vector 1: Transaction Fee Revenue Share (Payment Take-Rate)
Qmova embeds payment processing directly into customer journeys via **Stripe Connect** and **Paystack Subaccounts**:
- **Mechanism**: When a customer prepays a deposit during booking, pays an upfront triage fee, settles a consultation bill on their phone, or pre-orders food from the wait screen, Qmova executes a split transaction.
- **Monetization**: Qmova can levy a platform application fee (e.g., **0.5% – 1.5% + fixed fee**) on all Gross Merchandise Value (GMV) passing through the platform. For a busy clinic processing R300,000 in monthly consultation fees across 5 doctors, a 1% take-rate generates R3,000 in pure recurring revenue from a single tenant—surpassing the SaaS subscription itself.

### Vector 2: WhatsApp Messaging Margins & Overages
- **Direct WhatsApp Automation**: The platform dispatches automated messages for ticket generation, 5-minute arrival warnings, stage progression, and receipt delivery.
- **Monetization**: Included quotas cover standard usage (e.g. 1,000 messages/mo). Excess messages are billed at **R0.35 – R0.50 per message**, against wholesale API delivery costs of ~R0.10, yielding a 70%+ gross margin on communication overages.

### Vector 3: Hardware Bundles & Deployment Services
Many non-technical business owners want turnkey setups for physical branches:
- **Kiosk Enclosure & Tablet Kits**: Pre-configured Android/iPad tablets locked to `/kiosk/[tenantId]` via Kiosk Browser MDM. Sold at a 40% retail markup.
- **Thermal Receipt Printers (ESC/POS)**: Integrated Bluetooth/USB ESC/POS receipt printers for elderly or non-smartphone customers who prefer a paper ticket.
- **Waiting Room Signage TV Sticks**: Pre-configured Amazon Fire TV or Google TV dongles booting directly into `/tv/[tenantId]`.

### Vector 4: White-Label & Custom Domain Add-On
Enterprise brands and upscale medical centers do not want customer-facing URLs containing `qmova.yqbuddy.com`:
- **Custom Domain Add-on**: Priced at **R299/mo per domain**, providing automated SSL provisioning via Caddy reverse proxy for `wait.clinicbrand.co.za`.
- **Watermark Removal**: Starter and Standard plans include a `Powered by Qmova` badge on wait screens and WhatsApp messages. White-labeling unlocks higher perceived brand value.

---

## 4. Financial Unit Economics & Customer Lifetime Value (LTV)

```
[ Customer Acquisition Cost (CAC) ] ~ R800 - R1,500 (Google Search Ads, B2B Cold Outreach, Free Trial)
[ Average Revenue Per Account (ARPU) ] ~ R1,100 / month (Blend of Standard, Premium, and Payments)
[ Gross Margin ] ~ 82% (Serverless compute, Redis, and database costs scale sub-linearly)
[ Net Revenue Retention (NRR) ] ~ 118% (Expansion via added locations, staff seats, and payment GMV)
[ Target Payback Period ] ~ 1.2 months
[ Estimated 24-Month LTV ] ~ R22,000 - R35,000 per tenant
```

### Strategic Moat
Once a business installs physical QR signage at their entrance, equips reception with the `Service Desk`, trains staff on `My Desk`, and links their Paystack/Stripe merchant payouts, **switching costs are exceptionally high**. Churn drops below 1.5% monthly after the 60-day activation milestone.

