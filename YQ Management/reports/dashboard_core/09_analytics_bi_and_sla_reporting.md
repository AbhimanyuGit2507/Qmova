# Analytics, Business Intelligence & SLA Reports (`/dashboard/analytics`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/dashboard/analytics.tsx`
- **Route Path**: `/dashboard/analytics`
- **Target Audience**: Business owners, clinic medical directors, regional franchise operators, and operations analysts evaluating performance metrics and staff productivity.
- **Key Dependencies**: React (`useState`, `useMemo`), Next.js `dynamic`, TanStack Query, Framer Motion, `VisitsAreaChart` (dynamic client-side chart component), `DatePicker`, `AdminLayout`, `useLocation`, `useAuth`, Lucide Icons (`BarChart2`, `Clock`, `Users`, `Medal`, `Star`, `Download`), `CustomerDrawer`.

---

## 2. Frontend Architecture & BI Dashboards
- **Executive KPI Scorecard**:
  - Total Visits Completed today and in selected period.
  - Average Wait Time (minutes elapsed from `waitingStart` to `calledAt`).
  - Average Service Duration (minutes elapsed from `startedAt` to `completedAt`).
  - SLA Compliance Rate (percentage of visits completed within configured SLA policy thresholds).
  - Customer CSAT Score (average star rating 1.0–5.0 with total rating count).
- **Interactive Visualizations**:
  1. **Volume Area Chart (`VisitsAreaChart`)**: Dynamic time-series chart plotting completed vs. cancelled visits over the selected date range.
  2. **24x7 Peak Hour Heatmap (`PeakHourHeatmap`)**: 7-day x 24-hour heat grid highlighting lobby congestion intensity, allowing managers to visually identify peak staffing requirements.
  3. **Staff Leaderboard**: Provider ranking table displaying total customers served, average service duration, customer review ratings, and SLA breach counters.
  4. **Customer Feedback Carousel**: Recent verbatim reviews and star ratings.
- **Data Export Engine**: One-click CSV and Excel export button generating detailed operational logs for external BI pipelines (PowerBI, Tableau).

---

## 3. Backend Integration & Analytics Aggregation
- **API Endpoints**:
  - `GET /analytics?locationId=...&startDate=...&endDate=...` (`backend/src/analytics/analytics.controller.ts`).
  - `GET /analytics/leaderboard`.
  - `GET /analytics/peak-hours`.
  - `GET /analytics/sla-compliance`.
- **Database Query Optimizations**:
  Calculations leverage PostgreSQL indexed timestamp fields (`waitingStart`, `calledAt`, `completedAt`) and aggregation functions (`AVG`, `COUNT`, `PERCENTILE_CONT`), preventing memory bloat on the Node.js server.

---

## 4. Architecture & System Design
- **Client-Side Dynamic Loading**: Recharts / chart libraries are dynamically imported (`next/dynamic` with `ssr: false`) to minimize initial page bundle weight.
- **SLA Policy Correlation**: Correlates visit wait times against `SlaPolicy` thresholds (`warningThresholdMins`, `breachThresholdMins`) to compute automated breach percentages.

---

## 5. Business Abstraction & Value Proposition
- **Data-Driven Staffing Optimization**: Eliminates guesswork in staff scheduling. Operations directors use the Peak Hour Heatmap to allocate more nurses or tellers to high-density Friday afternoons while reducing overhead during quiet Tuesday mornings.
- **Continuous Quality Control**: The staff leaderboard and CSAT ratings incentivize customer care excellence across physical branch networks.

