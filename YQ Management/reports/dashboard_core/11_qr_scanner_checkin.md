# QR Scanner & Check-In Station (`/dashboard/scan`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/scan/index.tsx`
- **Supporting Component**: `frontend/src/components/ScannerInterface.tsx`
- **Route Path**: `/dashboard/scan`
- **Target Audience**: Front desk receptionists, security entrance guards, gate attendants, and staff operating physical check-in podiums.
- **Key Dependencies**: React, Next.js `useRouter`, `AdminLayout`, `ScannerInterface`, Framer Motion, Lucide Icons (`ScanLine`).

---

## 2. Frontend Architecture & Hardware Scanner Integration
- **Camera-Based Optical Recognition**:
  - Leverages browser MediaDevices API (`navigator.mediaDevices.getUserMedia`) to access high-resolution front-facing or rear-facing device cameras.
  - Continuous video feed analysis scanning for standard QR code matrices.
  - Optical bounding box animation indicating active scanning focus.
- **Hardware Barcode Reader Compatibility**:
  - In addition to camera video feeds, the scanner interface includes a global keypress buffer listener (`KeyboardEvent`). Physical USB or Bluetooth 2D barcode scan guns (Honeywell, Zebra) that emulate HID keyboards type the token string and emit `Enter`, which the component captures instantly without requiring mouse focus.
- **Scan Success Routing Flow**:
  ```typescript
  onScanSuccess={(data) => {
    if (data?.valid) {
      if (data.tokenId) {
        router.push(`/dashboard/service-desk?visitId=${data.tokenId}`);
      } else {
        router.push('/dashboard/service-desk');
      }
    }
  }}
  ```
  Immediately resolves the customer record and redirects the operator to the live `Service Desk` with the scanned visitor highlighted.

---

## 3. Backend Integration & Access Verification
- **API Endpoints**:
  - `POST /public-checkin/verify` (`backend/src/public-checkin/public-checkin.controller.ts`).
  - `POST /visits/:id/checkin` (Transitions `CREATED` or `SCHEDULED` to `CHECKED_IN`).
- **Cryptographic Token Verification**:
  Scanned QR codes contain signed tokens or access URLs (`https://app.qmova.com/customer/status/:accessToken`). The backend validates the token, confirms tenant match, and updates arrival timestamps (`checkedInAt = now()`).

---

## 4. Architecture & System Design
- **Sub-Second Optical Latency**: Client-side WASM/JS barcode decoding executes locally in web workers without round-trip network lag, allowing rapid back-to-back scanning.
- **Camera Permission Fallback**: If browser camera permissions are blocked, displays clean manual text entry fallback where staff can type the 4-character ticket token (e.g. `A042`).

---

## 5. Business Abstraction & Value Proposition
- **Contactless Lobby Ingestion**: Speeds up physical lobby throughput. A customer arriving for an appointment simply presents their phone screen to the receptionist's scanner; within 0.2 seconds their arrival is logged, their file is loaded, and their assigned doctor is notified.

