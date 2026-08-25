# SIH PS 26027: Frontend & Middleware Specification (Akarsh & Sista's Scope)
## Stage 7: Control Office Application Visual Dashboard, GIS Track Map, Gantt Timelines & Middleware

---

## 1. System Overview & Objective

The goal of this module is to build the complete **Control Office Application (COA) Visual Dashboard** and **Middleware Client Layer** for Section Controllers, Station Masters, and Railway Engineers.

The frontend is an interactive Single Page Application (SPA) built with **React (v18+) + TypeScript + Vite + TailwindCSS**, communicating with the already-built **FastAPI Backend Core**.

```mermaid
flowchart TD
    subgraph FRONTEND_SPA ["💻 Frontend Application (React + Vite + TailwindCSS)"]
        GANTT[1. Dual-Swimlane Gantt Timeline<br/><i>Trains vs Joint Shadow Blocks</i>]
        MAP[2. Leaflet Geospatial GIS Track Map<br/><i>Defect Pins & Substation FP/SP Zones</i>]
        SIM[3. 'What-If' Simulation Slider Sandbox<br/><i>Live Impact Meters & Commit Tokens</i>]
        T351[4. Form T/351 Statutory Portal<br/><i>Station Master Private Number Exchange</i>]
        TSR[5. TSR Speed Recovery Curve Chart<br/><i>Speed Relaxation Visualizer</i>]
    end

    subgraph MIDDLEWARE_LAYER ["🔌 Middleware Client Layer"]
        AUTH[JWT Auth & Role-Based Route Guards<br/><i>Controller, Station Master, Engineer</i>]
        CLIENT[Centralized Axios / TanStack Query Client<br/><i>Auto-refreshing Bearer Tokens</i>]
        SSE[Live SSE Telemetry Stream Listener<br/><i>Real-time delay popup toasts</i>]
    end

    subgraph BACKEND_APIS ["⚡ Backend Core (FastAPI: localhost:8000)"]
        API1[GET /api/v1/sections & /train-movements]
        API2[POST /api/v1/optimizer/run & /simulate]
        API3[POST /api/v1/blocks/{id}/transition]
        API4[GET /api/v1/blocks/{id}/export-bdms & /t351-notice]
        API5[POST /api/v1/auth/login & /me]
        API6[GET /api/v1/events/telemetry (SSE)]
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
│   │   └── events.ts              # SSE EventSource listener for live delay alerts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Header, active division selector, user profile
│   │   │   ├── Sidebar.tsx        # Navigation menu
│   │   │   └── RoleGuard.tsx      # RBAC Route protection (Controller vs SM vs Engineer)
│   │   ├── gantt/
│   │   │   ├── DualGanttChart.tsx # Top Swimlane (Trains) + Bottom Swimlane (Blocks)
│   │   │   ├── ShadowBadge.tsx    # Joint Shadow Block multi-dept badge
│   │   │   └── TimelineScrubber.tsx # 24h to 7-day zoom/scrubber
│   │   ├── map/
│   │   │   ├── GisTrackMap.tsx    # Leaflet track rendering & defect pins
│   │   │   ├── DefectPin.tsx      # Color-coded defect markers (🔴/🟡/🟢)
│   │   │   └── PowerZoneLayer.tsx # Substation FP/SP power boundary overlays
│   │   ├── simulator/
│   │   │   ├── WhatIfSlider.tsx   # Interactive time-shift drag slider
│   │   │   ├── ImpactMeter.tsx    # Live train detention & feasibility gauge
│   │   │   └── CommitModal.tsx    # Token-signed proposal commit confirmation
│   │   ├── statutory/
│   │   │   ├── FormT351Modal.tsx  # Station Master Private Number workflow
│   │   │   ├── SignoffSheet.tsx   # PWI, SSE, TRD digital sign-offs
│   │   │   └── PrintableT351.tsx  # Formatted printable disconnection notice
│   │   └── charts/
│   │       └── TSRRecoveryChart.tsx # Line graph of speed recovery curve
│   ├── pages/
│   │   ├── DashboardPage.tsx      # Main Control Office operational view
│   │   ├── MapViewPage.tsx        # Full GIS inspection page
│   │   ├── SimulationPage.tsx     # Dedicated What-If sandbox page
│   │   ├── StatutoryPage.tsx      # Form T/351 records & BDMS exports
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
    * 🔴 **Red:** Tier 1 VIP Trains (Rajdhani, Vande Bharat, Shatabdi)
    * 🟠 **Orange:** Tier 2 Mail / Express / Superfast
    * 🔵 **Blue:** Tier 2 Passenger / EMU
    * ⚫ **Grey:** Tier 3 Freight / Goods
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
  * 🔴 **Critical Defect ($CI > 80$):** Red marker with pulse hazard animation.
  * 🟡 **Moderate Defect ($50 \le CI \le 80$):** Yellow marker.
  * 🟢 **Low Risk Defect ($CI < 50$):** Green marker.
  * Clicking a pin opens a modal displaying asset details, defect type, and SHAP explainability factors.
* **Traction Power Boundaries:** Visual FP/SP (Feeding Post / Sectioning Post) substation zones ($40\text{--}80\text{ km}$ spans).

---

### View 3: "What-If" Disruption Simulator UI
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
  * **Feasibility Status:** 🟢 Feasible vs 🔴 Infeasible (VIP Conflict)
* **One-Click Commit:** Clicking "Apply Changes" calls `POST /api/v1/optimizer/commit-simulation` with the returned HMAC `commit_token`.

---

### View 4: Statutory Form T/351 Portal & Private Number Exchange
* **Disconnection Phase (Block Start):**
  1. Auto-populates Form T/351 Disconnection Notice from block data.
  2. Input box for **Station Master Private Number (PN)**.
  3. Clicking "Authorize Block" calls `POST /api/v1/blocks/{id}/transition` with `target_status: "ACTIVE"` and `private_number`.
* **Field Execution Phase:**
  * Digital acknowledgment checkboxes for PWI (Track), SSE (Signal), and TRD (Traction).
* **Reconnection Phase (Block Clear):**
  1. Input box for **Reconnection Private Number (PN)** and **Temporary Speed Restriction (TSR)** value (e.g., `30 km/h`).
  2. Clicking "Clear Block" calls `POST /api/v1/blocks/{id}/transition` with `target_status: "COMPLETED"`.
* **Export & Print:** Printable / PDF Form T/351 notice generator conforming to Indian Railways G&SR standards.

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

### 2. Live Telemetry Event Stream (`api/events.ts`)
* Connect to `http://localhost:8000/api/v1/events/telemetry` using browser `EventSource`.
* When a train delay event is received, trigger a floating popup toast notification:
  * *"⚠️ Disruption Alert: Train #12622 delayed by 35 mins on MAS-AJJ section. Localized block shift recommended."*

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
| **14** | **Live Telemetry Stream** | `GET /api/v1/events/telemetry` | *SSE Stream* |

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
