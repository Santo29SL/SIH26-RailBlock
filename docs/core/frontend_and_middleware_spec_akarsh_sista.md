# SIH PS 26027: Frontend & Middleware Specification (Akarsh & Sista's Scope)
## Stage 7: Control Office Application Visual Dashboard, GIS Track Map, Gantt Timelines & Middleware

---

## 1. System Overview & Objective

The goal of this module is to build the complete **Control Office Application (COA) Visual Dashboard** and **Middleware Client Layer** for Section Controllers, Station Masters, Departmental Engineers, and Divisional Authorities.

The frontend is an interactive Single Page Application (SPA) built with **React (v18+) + TypeScript + Vite + TailwindCSS**, communicating with the already-built **FastAPI Backend Core**.

```mermaid
flowchart TD
    subgraph FRONTEND_SPA ["💻 Frontend Application (React + Vite + TailwindCSS)"]
        GANTT[1. Dual-Swimlane Gantt Timeline<br/><i>Trains vs Joint Shadow Blocks</i>]
        MAP[2. Leaflet Geospatial GIS Track Map<br/><i>Defect Pins & Substation FP/SP Zones</i>]
        SIM[3. 'What-If' Simulation Slider Sandbox<br/><i>Live Impact Meters & Commit Tokens</i>]
        STAT[4. Statutory Portals<br/><i>Form T/351 & Form T/D 602 TSLW Support</i>]
        TSR[5. TSR Speed Recovery Curve Chart<br/><i>Speed Relaxation Visualizer</i>]
        HORIZON[6. Multi-Horizon Planner View<br/><i>24h Tactical / 7d Weekly / 30d Master</i>]
    end

    subgraph MIDDLEWARE_LAYER ["🔌 Middleware Client Layer"]
        AUTH[JWT Auth & 5-Role Route Guards<br/><i>Admin, Controller, SM, Engineer, Div Authority</i>]
        CLIENT[Centralized Axios / TanStack Query Client<br/><i>Auto-refreshing Bearer Tokens</i>]
        WS[Live WebSocket Telemetry Stream Listener<br/><i>Real-time delay popup toasts & SLW alerts</i>]
        INJECT[Simulated COA Event Injector<br/><i>Test Harness for Delays & Overruns</i>]
    end

    subgraph BACKEND_APIS ["⚡ Backend Core (FastAPI: localhost:8000)"]
        API1[GET /api/v1/sections & /train-movements]
        API2[POST /api/v1/optimizer/run & /simulate]
        API3[POST /api/v1/blocks/{id}/transition]
        API4[GET /api/v1/blocks/{id}/export-bdms & /t351-notice]
        API5[POST /api/v1/auth/login & /me]
        API6[WS /api/v1/events/ws/telemetry]
    end

    FRONTEND_SPA <--> MIDDLEWARE_LAYER <--> BACKEND_APIS
```

---

## 2. Recommended Frontend Architecture & Directory Structure

All frontend development should reside in the root **`frontend/`** folder:

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance with JWT interceptor & refresh
│   │   ├── auth.ts                # Login, registration, current user queries
│   │   ├── sections.ts            # Railway sections & train movement queries
│   │   ├── optimizer.ts           # /run, /simulate, /commit-simulation queries
│   │   ├── blocks.ts              # Block details, transitions, BDMS & T/351 exports
│   │   └── events.ts              # WebSocket listener for live delay alerts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Header, active division selector, user profile
│   │   │   ├── Sidebar.tsx        # Navigation menu
│   │   │   └── RoleGuard.tsx      # 5-Role RBAC Route protection
│   │   ├── gantt/
│   │   │   ├── DualGanttChart.tsx # Top Swimlane (Trains) + Bottom Swimlane (Blocks)
│   │   │   ├── ShadowBadge.tsx    # Joint Shadow Block multi-dept badge
│   │   │   └── TimelineScrubber.tsx # 24h, 7d, 30d zoom/scrubber
│   │   ├── map/
│   │   │   ├── GisTrackMap.tsx    # Leaflet track rendering & defect pins
│   │   │   ├── DefectPin.tsx      # Color-coded defect markers
│   │   │   └── PowerZoneLayer.tsx # Substation FP/SP power boundary overlays
│   │   ├── simulator/
│   │   │   ├── WhatIfSlider.tsx   # Interactive time-shift drag slider
│   │   │   ├── ImpactMeter.tsx    # Live train detention & feasibility gauge
│   │   │   ├── CommitModal.tsx    # Token-signed proposal commit confirmation
│   │   │   └── SimulatedEventInjector.tsx # Test control for firing synthetic delays
│   │   ├── statutory/
│   │   │   ├── FormT351Modal.tsx  # Station Master Private Number workflow
│   │   │   ├── FormTD602Modal.tsx # Statutory Form T/D 602 SLW authority modal
│   │   │   ├── ConsentSignoff.tsx # Pre-approval multi-department consent flow
│   │   │   ├── PrintableT351.tsx  # Formatted printable disconnection notice
│   │   │   └── PrintableTD602.tsx # Formatted printable Form T/D 602 support sheet
│   │   ├── horizon/
│   │   │   └── MultiHorizonPlanner.tsx # Toggle between 24h, 7-day, and 30-day views
│   │   └── charts/
│   │       └── TSRRecoveryChart.tsx # Line graph of speed recovery curve
│   ├── pages/
│   │   ├── DashboardPage.tsx      # Main Control Office operational view
│   │   ├── MapViewPage.tsx        # Full GIS inspection page
│   │   ├── SimulationPage.tsx     # Dedicated What-If sandbox page
│   │   ├── StatutoryPage.tsx      # Form T/351 & T/D 602 records & BDMS exports
│   │   ├── MultiHorizonPage.tsx   # Weekly & monthly corridor planning view
│   │   └── LoginPage.tsx          # JWT Login & role selection
│   ├── types/                     # TypeScript interfaces matching backend schemas
│   │   ├── auth.ts
│   │   ├── section.ts
│   │   ├── optimizer.ts
│   │   └── block.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tailwind.config.js
```

---

## 3. Detailed UI View Specifications

### View 1: Dual-Swimlane Interactive Gantt Timeline
* **Top Swimlane (Train Runs):**
  * Horizontal colored bars for trains fetched from `GET /api/v1/train-movements?section_id={id}`.
  * Color Hierarchy:
    * **Red:** Tier 1 VIP Trains (Rajdhani, Vande Bharat, Shatabdi)
    * **Orange:** Tier 2 Mail / Express / Superfast
    * **Blue:** Tier 2 Passenger / EMU
    * **Grey:** Tier 3 Freight / Goods
* **Bottom Swimlane (Maintenance Blocks):**
  * Horizontal colored bars for scheduled blocks fetched from `GET /api/v1/blocks?section_id={id}`.
  * Status Colors: `PROPOSED` (Yellow), `APPROVED` (Green), `ACTIVE` (Red stripes), `COMPLETED` (Blue).
  * **Joint Shadow Block Badge:** Visual badge showing bundled departments (`[TRACK + SIGNAL + TRACTION]`).
* **Interactivity:**
  * 24h to 7-day zoom controls and horizontal timeline scrubber.
  * Hover tooltip showing train number, delay, block duration, and included jobs.

---

### View 2: Interactive Geospatial GIS Track Map (Leaflet.js)
* **Track Layout:** Render railway section track geometry using Leaflet Polyline components.
* **Defect Status Pins:**
  * **Critical Defect ($CI > 80$):** Red marker with pulse hazard animation.
  * **Moderate Defect ($50 \le CI \le 80$):** Yellow marker.
  * **Low Risk Defect ($CI < 50$):** Green marker.
  * Clicking a pin opens a modal displaying asset details, defect type (USFD classification Good/IMR/IMRW/OBS/OBSW, TGI curvature), and SHAP explainability factors.
* **Traction Power Boundaries:** Visual FP/SP (Feeding Post / Sectioning Post) substation zones ($40\text{--}80\text{ km}$ spans).

---

### View 3: "What-If" Disruption Simulator & Simulated Event Injector
* **Interaction:** Drag a slider to shift a block's start/end time by $\pm 15$ to $\pm 180$ minutes.
* **Live Calculation:** On slider change, send request to `POST /api/v1/optimizer/simulate`:
  ```json
  {
    "block_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "proposed_start_time": "02:30:00",
    "proposed_end_time": "05:00:00"
  }
  ```
* **Live Impact Gauges:**
  * **Train Detention Delta:** e.g., `+30 min detention`
  * **Conflicting Trains:** List of impacted train numbers (e.g., `#12622 Mail Express`)
  * **Feasibility Status:** Feasible vs Infeasible (VIP Conflict)
* **One-Click Commit:** Clicking "Apply Changes" calls `POST /api/v1/optimizer/commit-simulation` with the returned HMAC `commit_token`.
* **Simulated COA Event Injector:** UI drawer control to inject mock delay/overrun events directly into the telemetry stream for live demonstrations.

---

### View 4: Statutory Portals (Form T/351 & Form T/D 602 TSLW)
* **Form T/351 Disconnection / Reconnection Notice:**
  1. Auto-populates Form T/351 Disconnection Notice from block data.
  2. Input box for **Station Master Private Number (PN)** for block granting (`ACTIVE`).
  3. Input box for **Reconnection Private Number (PN)** and **Temporary Speed Restriction (TSR)** value for block clearance (`COMPLETED`).
* **Departmental Consent Sign-off Workflow:**
  * Pre-approval consent checkboxes for Track (PWI), S&T (SSE), and TRD engineers prior to final Section Controller granting.
* **Temporary Single Line Working (TSLW) / Form T/D 602 Support Sheet:**
  * Displays statutory speed restrictions (25 km/h pilot, 15 km/h facing points/crossovers, booked speed subsequent) per GR 3.68 and zonal SR Chapter 4/15.
  * Formats printable Form T/D 602 authority and control-phone scripts.
* **Divisional Authority Escalation:**
  * Blocks exceeding 4 hours or NI works exceeding 3 days display an escalation badge requiring `DIVISIONAL_AUTHORITY` approval per Railway Board letter dated 16.06.2022.

---

### View 5: Post-Block TSR Speed Recovery Curve Visualizer
* Line chart displaying the post-maintenance speed relaxation curve:
  $$\text{Work Completion} \longrightarrow 20\text{ km/h} \longrightarrow 45\text{ km/h} \longrightarrow 75\text{ km/h} \longrightarrow \text{MPS (110 km/h)}$$

---

## 4. Middleware & Client Integration Specifications

### 1. Centralized API Client (`api/client.ts`)
* Axios instance configured with `baseURL: http://localhost:8000/api/v1`.
* Request interceptor automatically attaches `Authorization: Bearer <access_token>`.
* Response interceptor automatically catches `401 Unauthorized` and calls `POST /api/v1/auth/refresh`.

### 2. Role-Based Route Protection (`components/layout/RoleGuard.tsx`)
* Enforces access across all 5 roles:
  1. `ADMIN`: Full administrative settings & user management.
  2. `SECTION_CONTROLLER`: Optimizer runs, What-If simulation, schedule commit.
  3. `STATION_MASTER`: Private Number issuance, Form T/351 & T/D 602 authorization.
  4. `DEPARTMENT_ENGINEER`: Maintenance request creation & departmental consent.
  5. `DIVISIONAL_AUTHORITY`: Sanction for blocks > 4 hours & NI works > 3 days.

### 3. Live Telemetry Event Stream (`api/events.ts`)
* Connect to `ws://localhost:8000/api/v1/events/ws/telemetry` using browser `WebSocket`.
* When a train delay or block overrun event is received, trigger a floating popup toast alert with one-click navigation to the rescheduler advisory.

---

## 5. Backend REST API Endpoints Contract (Ready to Consume)

All of the following endpoints are **already built, verified, and running** on the backend:

| # | Action / Feature | Method & Endpoint | Request Payload / Params |
| :---: | :--- | :--- | :--- |
| **1** | **User Login** | `POST /api/v1/auth/login` | `{"email": "...", "password": "..."}` |
| **2** | **Current User Profile** | `GET /api/v1/auth/me` | *Bearer Token* |
| **3** | **List Railway Sections** | `GET /api/v1/sections` | — |
| **4** | **List Train Movements** | `GET /api/v1/train-movements?section_id={id}` | `section_id` |
| **5** | **List Maintenance Requests** | `GET /api/v1/maintenance?section_id={id}` | `section_id` |
| **6** | **List Scheduled Blocks** | `GET /api/v1/blocks?section_id={id}` | `section_id` |
| **7** | **Get Block Detail & Jobs** | `GET /api/v1/blocks/{id}` | `id` |
| **8** | **Run Optimizer** | `POST /api/v1/optimizer/run` | `{"section_id": "...", "target_date": "2026-08-25"}` |
| **9** | **Run What-If Simulation** | `POST /api/v1/optimizer/simulate` | `{"block_id": "...", "proposed_start_time": "..."}` |
| **10** | **Commit Simulation** | `POST /api/v1/optimizer/commit-simulation` | `{"commit_token": "..."}` |
| **11** | **Transition Block Status** | `POST /api/v1/blocks/{id}/transition` | `{"target_status": "ACTIVE", "private_number": "SM-104"}` |
| **12** | **Export CRIS BDMS JSON** | `GET /api/v1/blocks/{id}/export-bdms` | `id` |
| **13** | **Export Form T/351 Notice**| `GET /api/v1/blocks/{id}/t351-notice` | `id` |
| **14** | **Predict AI Risk & Criticality** | `POST /api/v1/risk/predict` | `{"department": "TRACK", "metadata_json": {...}}` |
| **15** | **Get AI Model Info** | `GET /api/v1/risk/model-info` | — |
| **16** | **Live Telemetry Stream** | `WS /api/v1/events/ws/telemetry` | *WebSocket Connection* |

---

## 6. Getting Started & Setup Commands

```bash
# 1. Initialize React + Vite + TypeScript in frontend/
npm create vite@latest frontend -- --template react-ts
cd frontend

# 2. Install Dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Install UI & Network Libraries
npm install @tanstack/react-query axios lucide-react leaflet react-leaflet d3 clsx tailwind-merge

# 4. Start Development Server
npm run dev
```

The frontend will run on `http://localhost:5173` and connect to the backend on `http://localhost:8000`.
