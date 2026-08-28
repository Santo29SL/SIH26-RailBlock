# SIH PS 26027: Master System Proposal & Technical Specification (v2.0 Grounded Edition)
## AI-Powered Automatic Block Planning System for Indian Railways

---

## 1. Executive Summary & Problem Context

| Attribute | Details |
| :--- | :--- |
| **Problem Statement ID** | `26027` |
| **Title** | AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways |
| **Organization** | Ministry of Railways (CRIS / RDSO) |
| **Category** | Software |
| **Theme** | Transportation & Logistics |

Currently, infrastructure maintenance planning across Indian Railways' three primary engineering departments is **decentralized, manual, and uncoordinated**:
1. **Engineering Department** (Tracks, Rails, Bridges) via **TMS** (Track Management System)
2. **Signal & Telecom (S&T) Department** (Signals, Interlocking, Points, Axle Counters) via **SMMS** (Signalling Maintenance & Management System)
3. **Traction Distribution (TRD) Department** (OHE, Substation Power, Feeding Posts) via **TDMS** (Traction Distribution Management System)

Meanwhile, train movement capacity is managed in real time by **COA** (Control Office Application), and official possession requests are processed via **BDMS** (Block & Disconnection Management System), a CRIS module integrated within COA across all 68+ Indian Railways divisions.

### Primary Operational Bottlenecks:
* **Departmental Silos:** Each department requests blocks independently via BDMS, leading to multiple separate traffic closures on the same section.
* **Suboptimal Corridor Utilization:** Blocks are requested during high-density train traffic windows, resulting in heavy train detention or rejected block requests.
* **Lack of Safety Prioritization:** Severe safety-risk defects compete equally with routine inspections for corridor slots.
* **Static Plans vs. Live Disruptions:** Real-time train delays disrupt static block schedules, requiring tedious manual recalculation by section controllers.

---

## 2. Technical Traceability & Architectural Alignment Matrix

The following matrix defines the formal mapping between the functional mandates of **Ministry of Railways Problem Statement 26027**, the domain operational constraints, the corresponding architectural components, and the mathematical/algorithmic formulations implemented:

| # | Functional Mandate (PS 26027) | Domain Operational Constraint | Architectural Component | Algorithmic Formulation & Reference | System Coverage & Operational Target |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Multi-System Data Integration** | Fragmented legacy databases (TMS, SMMS, TDMS) with isolated block requests | **Stage 1: Data Ingestion & Read-Only Edge Gateway** | REST/SOAP Adapters, ETL Pipeline, RailNet Air-Gap Gateway | **Full Technical Coverage** (Ingests 5 core Railway data feeds via Read-Only Edge Gateway) |
| **2** | **Risk-Based Task Prioritization** | Uniform handling of routine maintenance vs. severe structural rail defects | **Stage 2: AI Risk & Criticality Scoring Engine** | Gradient Boosted Trees **[5, 14]** + SHAP XAI **[13]** | **Deterministic Scoring** ($CI \in [0, 100]$ based on TGI, GMT, and USFD flaw history) |
| **3** | **Asset Availability Maximization** | Repeated solo traffic closures causing high cumulative track downtime | **Stage 4: Multi-Department "Shadow Block" Clustering** | Spatial-Temporal DBSCAN & G&SR Conflict Matrix **[4, 8, 12]** | **Opportunistic Grouping** (Target 25–35% empirical recovery, up to 55% peak upper bound) |
| **4** | **Train Timetable Protection** | Maintenance possession conflicting with high-priority passenger runs | **Stage 5: Two-Tier Constraint Optimization Engine** | Space-Time-State MILP via Google OR-Tools & Airflow **[2, 7, 11]** | **Exact Mathematical Coverage** (Hard safety & headway limits) |
| **5** | **Real-Time Disruption Adaptability** | Dynamic train delays invalidating pre-scheduled static block plans | **Stage 6: Real-Time Rescheduling & SLW Fallback** | WebSocket Telemetry Stream + Fast Heuristics + SLW Protocol **[4, 6]** | **Sub-Second Adaptability** (Auto-reschedule for delays $>20$ min with Burst Block protection) |
| **6** | **Controller Decision Support** | Manual cross-departmental coordination lacking visual simulation tools | **Stage 7: Control Office Dashboard & Form T/351 Workflow** | React.js / Leaflet GIS Map + Dual Gantt + Digital Draft BDMS Push **[1, 3]** | **Full Operational Coverage** (Direct BDMS / COA Draft integration + Form T/351 G&SR compliance) |

### 2.1 Quantitative Operational Performance Metrics

The architectural design targets the following empirical performance benchmarks across section operations:

- **Track Downtime Efficiency:** Reduces cumulative track possession time per section from 5.5 hours (uncoordinated solo blocks) to 2.5 hours (Joint Shadow Block), yielding a **peak theoretical recovery of 55%** and an **empirical operational recovery averaging 25% – 35%** across routine multi-department schedules.
- **Possession Proposal Latency (Two-Tier Architecture):** Heavy Space-Time MILP optimization runs **offline as a nightly batch DAG (Apache Airflow)** for base 7-day plans, while **real-time dynamic rescheduling uses fast greedy heuristics ($< 30$ seconds)** for localized time shifts when train delays occur.
- **Network Train Detention:** Minimizes delay propagation across passenger corridors, targeting up to a **70% reduction in total train detention minutes** (accounting for IRPWM post-maintenance Temporary Speed Restriction recovery curves).

---

## 3. System Architecture & End-to-End Pipeline Flowchart

```mermaid
flowchart TD
    subgraph STAGE 1: Data Ingestion & Unification
        A1[TMS API: USFD Flaws & TGI Index] --> B1[Read-Only Edge Gateway / ETL Adapters]
        A2[SMMS API: Point Machines & Axle Counters] --> B1
        A3[TDMS API: OHE Wire Wear & FP/SP Spans] --> B1
        A4[COA Feed: Live Train Schedules & Freight Forecast] --> B1
        A5[BDMS Feed: Historical & Pending Requests] --> B1
    end

    subgraph STAGE 2: AI Risk & Criticality Scoring Engine
        B1 --> C1[Data Cleaner & Spatial Section Normalizer]
        C1 --> C2[XGBoost / LightGBM Risk Model]
        C2 --> C3[SHAP Explainer: Feature Weight Allocation]
        C3 --> C4[Dynamic Criticality Index: 0 to 100 Score]
    end

    subgraph STAGE 3: Corridor Capacity & Gap Extraction
        A4 --> D1[COA Timetable Parser & Rolling Midnight Stitcher]
        D1 --> D2[Train Headway & Velocity Profiler]
        D2 --> D3[Corridor Downtime Slot Extractor with ≥15 min Buffers]
    end

    subgraph STAGE 4: Multi-Department Shadow Block Clustering
        C4 --> E1[Spatial Radius Filter ≤10km & OHE Power FP/SP Boundary Filter]
        D3 --> E2[Temporal Matcher & Hard-Coded G&SR Safety Conflict Matrix]
        E1 --> E3[Joint Shadow Block Bundler with Flexible Internal Offsets]
        E2 --> E3
    end

    subgraph STAGE 5: Two-Tier Constraint Optimization Engine
        E3 --> F1[Google OR-Tools CP-SAT MILP Solver]
        F1 --> F2{Hard Constraints Met?<br/>VIP Zero Detention & Machine Limits}
        F2 -- Yes --> F3[Optimal Block Schedule Generator]
        F2 -- No --> F4[Relax Soft Constraints & Re-evaluate]
        F4 --> F1
    end

    subgraph STAGE 6: Real-time Event Listener & SLW Rescheduling
        G1[Live Telemetry WebSocket: Delay / Block Overrun] --> G2[Fast Heuristic Rescheduler & G&SR Ch 5/15 SLW Protocol]
        G2 --> F1
    end

    subgraph STAGE 7: Control Office Visual Dashboard & Form T/351 Workflow
        F3 --> H1[Interactive Dual Gantt Chart & Spatial GIS Map]
        H1 --> H2[In-Memory What-If Simulation with HMAC Commit Tokens]
        H1 --> H3[Section Controller Approval Portal]
        H3 --> H4[Form T/351 PN State Machine & CRIS BDMS JSON Push]
    end
```

### 3.1 Technology Stack & Implementation Specifications

| Tier | Technologies & Frameworks | Implemented Responsibilities |
| :--- | :--- | :--- |
| **Backend API & Core** | Python 3.12, FastAPI, Pydantic v2, `uv` | High-performance asynchronous REST APIs, dependency injection, and data validation |
| **Authentication & Security** | OAuth2 Password Bearer, JWT (`python-jose`), `passlib[bcrypt]` | Token issuing, password hashing, 4-tier Role-Based Access Control (RBAC) |
| **Middleware & Reliability** | `slowapi` (Limiter), `structlog`, OWASP Security Headers | 120 req/min rate limiting, structured JSON logging, XSS/Clickjacking protection |
| **Optimization Solver** | Google OR-Tools (CP-SAT MILP) | Space-Time-State constraint optimization with Tier-1 VIP protection and machine capacity limits |
| **AI / ML & Explainability** | Python, `scikit-learn`, `xgboost`, `lightgbm`, `shap` | Dynamic Criticality Index ($CI \in [0, 100]$) and SHAP feature attribution |
| **Database & ORM** | PostgreSQL 15 (9 Tables), SQLAlchemy 2.0 (Async), Alembic | Relational schema persistence, migrations, and real Indian Railways seed datasets |
| **Real-time Telemetry** | WebSockets (`/api/v1/events/ws/telemetry`), Server-Sent Events | Live train delay broadcast stream and Single Line Working (SLW) alert push |
| **Frontend UI (WIP)** | React (v18+), Vite, TypeScript, TailwindCSS, Leaflet, D3 | Control Office Dual Gantt, Geospatial GIS Map, What-If Slider UI, Form T/351 Portal |
| **Containerization** | Docker, Docker Compose, pgAdmin 4 | Production multi-stage Docker containerization and database management GUI |

---

## 4. Stage-by-Stage Detailed Engineering & Algorithm Guide

### Stage 1: Data Ingestion & Schema Normalization
* **Objective:** Ingest disparate data formats from Indian Railways legacy databases via a **Read-Only Edge Gateway** and normalize them into standard JSON schemas.
* **Implemented Adapters (`backend/app/services/adapters.py` & `backend/app/api/ingestion.py`):**
  * `TMSAdapter` (`POST /api/v1/ingest/tms`): Track Geometry Index (TGI - combining Gauge, Cross-Level, Twist, Longitudinal Level, Alignment, and Versine), Ultrasonic Flaw Detection (USFD) rail flaw severity (0 to 3), chainage markers, and duration.
  * `SMMSAdapter` (`POST /api/v1/ingest/smms`): Point machine electromechanical locking risk score, station codes, and asset IDs.
  * `TDMSAdapter` (`POST /api/v1/ingest/tdms`): OHE contact wire wear percentage, Substation Feeding Post (FP) identifiers, and power isolation flags.
  * `COAAdapter`: Train timetable numbers, departure/arrival times, priority classes, and section movement schedules.

---

### Stage 2: AI Risk & Criticality Scoring Engine
* **Objective:** Compute a dynamic **Criticality Score ($CI \in [0, 100]$)** for every maintenance job using gradient boosted regression trees (XGBoost/LightGBM) **[5, 14]**.
* **Mathematical Formula:**
  $$CI = w_1 \cdot \text{TGI\_Deviation} + w_2 \cdot \Delta v_{\text{SpeedRestriction}} + w_3 \cdot \text{DaysOverdue} + w_4 \cdot \text{SectionGMTDensity} + \text{DefectSeverityPenalty}$$
* **Explainable AI (XAI):** Uses SHAP (SHapley Additive exPlanations) **[13]** to output human-readable reasoning for railway controllers (e.g., *"Job #402 rated 88/100 because USFD rail flaw is critical and TGI deviation breached safety thresholds"*).
* **Endpoints:** `POST /api/v1/risk/predict` and `GET /api/v1/risk/model-info`.

---

### Stage 3: Corridor Capacity & Gap Extraction (COA Timetable Parsing)
* **Objective:** Analyze train timetables to find continuous idle track windows where track occupancy is zero.
* **Implementation (`backend/app/services/gap_extractor.py`):**
  1. **Rolling Midnight Stitching:** Evaluates multi-day horizons ($[-1, \text{horizon}+1]$) across 23:59 to 00:00 without day boundary truncation.
  2. **Statutory Safety Headways:** Enforces mandatory $\ge 15\text{ mins}$ safety buffers before train entry and after train clearance.
  3. **Duration Filtering:** Filters out idle slots shorter than the minimum block threshold ($\Delta T < 60\text{ mins}$).
  4. **Directional Tracking:** Segregates gaps by line direction (`UP`, `DOWN`, `BOTH`, `SINGLE`) with train parity heuristics (even=UP, odd=DOWN).
  5. **VIP Proximity Detection:** Flags adjacency to high-priority express runs (Rajdhani, Vande Bharat, Shatabdi, Tejas, Duronto, Gatimaan).

---

### Stage 4: Multi-Department "Shadow Blocking" & G&SR Safety Rules
* **Objective:** Combine maintenance requests from Track (TMS), Signal (SMMS), and Electrical (TDMS) into a single corridor window (**Opportunistic Maintenance / Multi-Component Grouping [8, 12]**).

```
    Timeline (Hours)  --->   01:00      02:00      03:00      04:00
┌──────────────────────────────────────────────────────────────────┐
│ Un-coordinated (Current BDMS State)                              │
├──────────────────────────────────────────────────────────────────┤
│ Engineering (TMS):   [===== Track Rail Grinding =====]          │  --> 2.5 hrs section closure
│ Signal & Telecom:                               [=== Point ===] │  --> 1.5 hrs section closure
│ Traction (TDMS):               [=== OHE Wire ===]               │  --> 1.5 hrs section closure
│                                     TOTAL TRACK CLOSED = 5.5 HRS │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Optimized "Shadow Block" (Proposed AI Engine)                    │
├──────────────────────────────────────────────────────────────────┤
│ Primary Block (TMS): [============= Track Rail Grinding =============] │ (2.5 hrs)
│ Shadow Block (SMMS):   [==== S&T Point Inspection ====]                │ (Joint)
│ Shadow Block (TDMS):         [==== OHE Wire Maintenance ====]          │ (Joint)
│                                     TOTAL TRACK CLOSED = 2.5 HRS!│ (55% Savings!)
└──────────────────────────────────────────────────────────────────┘
```

* **Clustering Algorithm & Safety Filters (`backend/app/services/clustering.py`):**
  1. **Spatial Grouping:** Group requests occurring within the same section boundary ($\le 10\text{ km}$).
  2. **OHE Power Isolation Matching:** Maps Traction (TDMS) demands to **Substation Feeding Posts (FP) / Sectioning Posts (SP)** ($40\text{--}80\text{ km}$ spans), ensuring power isolation does not disable adjacent operational lines.
  3. **Hard-Coded G&SR Safety Conflict Matrix:** 24 built-in standard safety rules plus dynamic database rules in `compatibility_rules`, strictly disallowing incompatible task pairs (e.g. Track Tamping Machine operation is prohibited while Point Machine Testing is active on the same chainage).
  4. **Primary Anchor & Flexible Offsets:** Designates the longest/highest-risk job as the Primary Block anchor and schedules secondary Shadow Activities with valid internal start/end offsets.

---

### Stage 5: Two-Tier Constraint Optimization Engine (Google OR-Tools MILP)
* **Objective:** Solve the mathematical assignment problem: assign joint maintenance blocks to available corridor slots over weekly and monthly horizons via Mixed-Integer Linear Programming (MILP) **[2, 7, 11]**.
* **Decision Variables [7]:**
  * $y_{m, g} \in \{0, 1\}$: 1 if Candidate Joint Block $m$ is assigned to Corridor Gap $g$, 0 otherwise.
* **Objective Function:**
  $$\max \sum_{m, g} y_{m, g} \cdot \left[ \text{CriticalityScore}(m) + \alpha \cdot \text{ShadowOverlapHours}(m) - \beta \cdot \text{TrainDetentionMinutes}(m, g) \right]$$
* **Hard Constraints (Must Never Be Violated):**
  1. **Corridor Duration Bound:** Block duration cannot exceed gap duration ($D_m \le T_g$).
  2. **Gap Exclusivity:** At most one major block per section per gap window ($\sum_m y_{m, g} \le 1$).
  3. **Job Request Uniqueness:** Each maintenance request can be scheduled at most once across all selected blocks ($\sum_{m \in \mathcal{M}_r} \sum_g y_{m, g} \le 1$).
  4. **Tier 1 VIP Passenger Protection:** Hard zero-detention constraint ($\text{Detention}(m, g) = 0$ for all gaps adjacent to Rajdhani, Vande Bharat, Shatabdi, Tejas, Duronto, Gatimaan).
  5. **Machine Resource Capacity Limits:** Total heavy machines (Tamping Machines, Tower Wagons, BCMs) allocated across all concurrent section blocks cannot exceed active regional fleet capacity:
     $$\sum_{m \in \mathcal{M}_{\text{res}}} \sum_{g \in \mathcal{G}_t} y_{m, g} \le \text{Capacity}(\text{res}), \quad \forall \text{res} \in \mathcal{R}, \forall t$$

---

### Stage 6: Real-time Rescheduling & Single Line Working (SLW) Fallback
* **Objective:** Keep maintenance plans resilient to real-time train disruptions and block overruns **[4, 6]**.
* **Implementation (`backend/app/services/rescheduler.py` & `backend/app/api/optimizer.py`):**
  * **Minor Delays ($\le 20\text{ min}$):** Absorbed directly into the $\ge 15\text{ min}$ statutory safety buffers.
  * **Major Delays ($> 20\text{ min}$):** Fast greedy heuristic rescheduler shifts block start/end times in $< 1\text{ ms}$ without global MILP re-solving.
  * **Block Overrun Disruption ($+15\text{ min}$ overrun with queued trains):**
    * Triggers Indian Railways **G&SR Chapter 5 (Rule 5.15) & Chapter 15 Single Line Working (SLW)** emergency advisory protocol.
    * Enforces statutory speed limits:
      * **First Pilot Train MPS:** $25\text{ km/h}$
      * **Facing Points / Crossovers:** $15\text{ km/h}$
      * **Subsequent Running Trains:** $45\text{ km/h}$
    * Generates standardized telegraphic SLW advisory notice with pilot train dispatch orders and siding holding orders for freight rakes.

---

### Stage 7: Control Office Dashboard & Form T/351 Statutory Workflow
* **Objective:** Provide Section Controllers, Station Masters, and Engineers with an intuitive UI and statutory verification workflows **[1, 3]**.
* **Features (`backend/app/api/blocks.py`, `backend/app/api/optimizer.py`):**
  * **In-Memory What-If Simulation:** `POST /api/v1/optimizer/simulate` computes time-shift impacts in-memory and returns a cryptographically signed **HMAC-SHA256 Commit Token** with a 15-minute expiration window.
  * **Token Commit Action:** `POST /api/v1/optimizer/commit-simulation` verifies the HMAC token signature and persists the simulated schedule directly to PostgreSQL without draft DB pollution.
  * **Statutory Form T/351 State Machine:**
    $$\text{PROPOSED} \longrightarrow \text{APPROVED} \longrightarrow \text{ACTIVE (with Disconnection PN)} \longrightarrow \text{COMPLETED (with Reconnection PN \& TSR)}$$
  * **CRIS BDMS JSON Exporter:** `GET /api/v1/blocks/{id}/export-bdms` outputs standard CRIS BDMS draft block possession payloads.
  * **Form T/351 Notice Exporter:** `GET /api/v1/blocks/{id}/t351-notice` outputs official Disconnection Notice records with Private Number validation tokens.

---

## 5. Academic Literature Review & Algorithmic Foundations

Research in railway infrastructure management models this challenge as the **Integrated Train Timetabling and Maintenance Possession Scheduling (TTP-MPS)** problem **[1, 7, 10]** (IEEE **[1, 9]**, Elsevier **[2, 7, 8, 11]**, INFORMS **[10]**).

### Advanced Algorithmic Approaches Integrated:
1. **Mixed-Integer Linear Programming (MILP) [2, 7, 11]:** Discretizes the network into a space-time graph to enforce exact mathematical boundaries on capacity and maintenance windows.
2. **Logic-Based Benders Decomposition (LBBD) [8, 9]:**
   * **Master Problem:** Assigns maintenance possession windows across weekly/monthly horizons using Constraint Programming in Apache Airflow.
   * **Sub-Problem:** Solves detailed train timetabling and speed profiles for COA schedules. If a block creates an infeasible train bottleneck, Benders Cuts are generated back to the Master Problem.
3. **Multi-Agent Reinforcement Learning (MARL) & Digital Twins [1, 3]:** Department agents (TMS, SMMS, TDMS) negotiate with a central Control Office simulator environment to maximize joint shadow block overlaps.

---

## 6. Data Architecture, Security & Complete API Catalog

### 6.1 Air-Gapped Network Architecture & Legacy Edge Gateway
To comply with Indian Railways (RailNet) cybersecurity policies, the system operates through a **Read-Only Legacy Edge Gateway**:
* **Read-Only DB Sync:** Pulls batch database snapshots from TMS, SMMS, and TDMS without requiring direct write access to legacy production databases.
* **Draft Proposal Export:** Generates structured JSON draft proposals pushed to BDMS for human Station Master verification and statutory Form T/351 execution.

---

### 6.2 Authentication, RBAC & API Security Layer
* **Password Hashing:** `bcrypt` with automatic salt generation and 72-byte truncation protection.
* **JWT Tokens:** Signed `HS256` Bearer tokens with 480-minute TTL containing `sub`, `role`, `user_id`, `email`.
* **Role-Based Access Control (4 Roles):**
  1. `ADMIN`: Full administrative access and system user management.
  2. `SECTION_CONTROLLER`: Block generation, What-If simulation, and schedule commitment.
  3. `STATION_MASTER`: Private Number issuance and Form T/351 Disconnection/Reconnection authorization.
  4. `DEPARTMENT_ENGINEER`: Maintenance request creation and progress tracking.
* **Rate Limiting:** `slowapi` enforcing `120 requests/minute` per remote IP.
* **OWASP Middleware:** Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.

---

### 6.3 Complete Relational Database Schema (9 PostgreSQL Tables)

```text
┌──────────────┐       ┌──────────────┐       ┌──────────────────────┐
│   sections   │◄──────┤    trains    │       │     block_jobs       │
├──────────────┤       ├──────────────┤       ├──────────────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)              │
│ section_code │       │ train_number │       │ block_id (FK)        │
│ section_name │       │ train_name   │       │ maintenance_req (FK) │
│ length_km    │       │ train_type   │       │ sequence_order       │
│ line_type    │       │ priority     │       └──────────┬───────────┘
└──────┬───────┘       └──────┬───────┘                  │
       │                      │                          ▼
       │               ┌──────┴───────┐       ┌──────────────────────┐
       ├──────────────►│train_movement│       │        blocks        │
       │               ├──────────────┤       ├──────────────────────┤
       │               │ id (PK)      │       │ id (PK)              │
       │               │ train_id(FK) │       │ block_code (Unique)  │
       │               │ section_id   │       │ section_id (FK)      │
       │               │ departure_t  │       │ block_date, start_t  │
       │               │ arrival_t    │       │ duration_minutes     │
       │               └──────────────┘       │ status (State Mach.) │
       │                                      │ optimizer_metadata   │
       ▼                                      └──────────────────────┘
┌──────────────┐       ┌──────────────┐                  ▲
│  resources   │       │compatibility │                  │
├──────────────┤       ├──────────────┤                  │
│ id (PK)      │       │ id (PK)      │                  │
│ resource_name│       │ dept_a,act_a │                  │
│ department   │       │ dept_b,act_b │                  │
│ capacity     │       │ is_compatible│                  │
│ is_available │       │ reason       │                  │
└──────┬───────┘       └──────────────┘                  │
       │                                                 │
       ▼                                                 │
┌────────────────────────────────────────────────────────┴───────────┐
│                       maintenance_requests                         │
├────────────────────────────────────────────────────────────────────┤
│ id (PK), request_code (Unique), section_id (FK), department        │
│ activity_type, duration_minutes, priority, deadline, status        │
│ resource_id (FK nullable), metadata_json (JSON)                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                              users                                 │
├────────────────────────────────────────────────────────────────────┤
│ id (PK), username (Unique), email (Unique), hashed_password        │
│ role (ADMIN, CONTROLLER, SM, ENGINEER), department, is_active       │
│ created_at, updated_at                                             │
└────────────────────────────────────────────────────────────────────┘
```

---

### 6.4 Complete REST & WebSocket API Specification

All endpoints are hosted under prefix `/api/v1`:

| Router Module | Method | Endpoint Path | Description | Access / Role |
| :--- | :---: | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/v1/auth/login` | Authenticate credentials & issue JWT token | Public |
| | `GET` | `/api/v1/auth/me` | Return authenticated user identity & role | Authenticated |
| | `POST` | `/api/v1/auth/seed-users` | Seed default demo accounts | Admin |
| **Legacy Ingestion**| `POST` | `/api/v1/ingest/tms` | Ingest Track defect from TMS feed | Engineer / Controller |
| | `POST` | `/api/v1/ingest/smms` | Ingest Signal defect from SMMS feed | Engineer / Controller |
| | `POST` | `/api/v1/ingest/tdms` | Ingest Traction defect from TDMS feed | Engineer / Controller |
| **AI Risk Engine** | `POST` | `/api/v1/risk/predict` | Predict Criticality Index ($CI \in [0, 100]$) + SHAP | Authenticated |
| | `GET` | `/api/v1/risk/model-info` | Feature list & metadata for Stage 2 ML model | Authenticated |
| **Sections** | `POST` | `/api/v1/sections` | Create new railway section | Admin |
| | `GET` | `/api/v1/sections` | List sections with zone/division filters | Authenticated |
| | `GET` | `/api/v1/sections/{id}` | Get section details by UUID | Authenticated |
| | `PUT` | `/api/v1/sections/{id}` | Update section attributes | Admin |
| | `DELETE` | `/api/v1/sections/{id}` | Delete section | Admin |
| **Trains** | `POST` | `/api/v1/trains` | Register train service | Admin / Controller |
| | `GET` | `/api/v1/trains` | List trains with priority filters | Authenticated |
| | `GET` | `/api/v1/trains/{id}` | Get train details by UUID | Authenticated |
| | `PUT` | `/api/v1/trains/{id}` | Update train service | Admin / Controller |
| | `DELETE` | `/api/v1/trains/{id}` | Delete train service | Admin |
| **Train Movements**| `POST` | `/api/v1/train-movements` | Add timetable section movement | Controller |
| | `GET` | `/api/v1/train-movements` | List movements with section/day filters | Authenticated |
| | `GET` | `/api/v1/train-movements/{id}`| Get movement details | Authenticated |
| | `PUT` | `/api/v1/train-movements/{id}`| Update movement timing | Controller |
| | `DELETE` | `/api/v1/train-movements/{id}`| Delete movement | Controller |
| **Maintenance** | `POST` | `/api/v1/maintenance` | Create maintenance request | Engineer |
| | `GET` | `/api/v1/maintenance` | List requests with status/dept filters | Authenticated |
| | `GET` | `/api/v1/maintenance/{id}` | Get request details | Authenticated |
| | `PUT` | `/api/v1/maintenance/{id}` | Update request | Engineer |
| | `DELETE` | `/api/v1/maintenance/{id}` | Delete request | Engineer |
| **Resources** | `POST` | `/api/v1/resources` | Register machine / maintenance gang | Admin / Engineer |
| | `GET` | `/api/v1/resources` | List machine resources | Authenticated |
| | `GET` | `/api/v1/resources/{id}` | Get resource details | Authenticated |
| | `PUT` | `/api/v1/resources/{id}` | Update resource capacity/availability | Admin / Engineer |
| | `DELETE` | `/api/v1/resources/{id}` | Delete resource | Admin |
| **Compatibility** | `POST` | `/api/v1/compatibility` | Add G&SR activity compatibility rule | Admin |
| | `GET` | `/api/v1/compatibility` | List compatibility rules | Authenticated |
| | `DELETE` | `/api/v1/compatibility/{id}` | Delete rule | Admin |
| **Blocks** | `GET` | `/api/v1/blocks` | List scheduled blocks | Authenticated |
| | `GET` | `/api/v1/blocks/{id}` | Get block details with included jobs | Authenticated |
| | `POST` | `/api/v1/blocks/{id}/transition`| Form T/351 Private Number state transition | Station Master |
| | `GET` | `/api/v1/blocks/{id}/export-bdms`| Export CRIS BDMS JSON draft block format | Controller |
| | `GET` | `/api/v1/blocks/{id}/t351-notice`| Export Form T/351 Disconnection Notice payload | Station Master |
| **Optimizer** | `POST` | `/api/v1/optimizer/run` | Execute Stages 3 $\to$ 4 $\to$ 5 solver & persist | Controller |
| | `POST` | `/api/v1/optimizer/simulate` | In-memory What-If simulation with HMAC token | Controller |
| | `POST` | `/api/v1/optimizer/commit-simulation`| Commit simulated schedule using HMAC token | Controller |
| | `POST` | `/api/v1/optimizer/reschedule`| Real-time fast rescheduling & SLW fallback | Controller |
| **Live Telemetry** | `WS` | `/api/v1/events/ws/telemetry` | WebSocket live train delay & SLW broadcast | Authenticated |
| **Health Checks** | `GET` | `/` | Root API metadata & Swagger docs link | Public |
| | `GET` | `/health` | Live PostgreSQL connectivity check | Public |

---

## 7. Academic References & Bibliography

### A. Cutting-Edge Recent Research (2025 – 2026 Publications)
1. **Sharma, R., et al. (2026)**. "Artificial Intelligence for Indian Railways Operation Optimization and Predictive Maintenance." *2nd International Conference on Computing Communication and Green Engineering (IEEE)*.
2. **Zhang, L., et al. (2026)**. "A data-driven optimization approach for the integrated train scheduling and maintenance planning in high-speed railways." *Computers & Operations Research (Elsevier)*, 174, 106820.
3. **Kuma, M., et al. (2026)**. "Digitalised Predictive Maintenance in Railways: A Systematic Review of AI, BIM, and Digital Twins." *Infrastructures*, 11(2), 45.
4. **Li, H., et al. (2025)**. "Joint Optimization Method for Preventive Maintenance and Train Scheduling Based on a Spatiotemporal Network Graph." *Applied Sciences*, 15(3), 1140.
5. **Gupta, A., et al. (2025)**. "Reducing Train Delays with Machine Learning-Based Predictive Maintenance for Railways." *Decision Making in Management and Engineering*, 8(1), 145–168.
6. **Chen, L., et al. (2025)**. "Real-time train timetabling adjustment under maintenance-driven track possession constraints." *TRISTAN XII Proceedings on Transportation Systems*.

### B. Core Foundations & Theoretical Benchmark Literature
7. **Zhang, Y., et al. (2024)**. "Joint optimization of train timetabling and maintenance possession scheduling using space-time-state networks." *Transportation Research Part C: Emerging Technologies*, 158, 104421.
8. **Wang, H., & Corman, F. (2024)**. "Collaborative possession scheduling and train timetabling adjustment: An ADMM decomposition approach." *Computers & Operations Research*, 161, 106450.
9. **Luan, X., Corman, F., & Meng, L. (2017)**. "Non-linear models for integrated railway traffic management and maintenance planning." *IEEE Transactions on Intelligent Transportation Systems*, 18(11), 2987–3001.
10. **Lidén, L. (2015)**. "Railway maintenance possession scheduling: A literature review." *Public Transport*, 7(1), 61–91.
11. **Peng, F., & Ouyang, Y. (2011)**. "Track maintenance task scheduling in rail networks." *Transportation Research Part B: Methodological*, 45(5), 821–833.
12. **Wildeman, R. E., Dekker, R., & Smit, A. C. (1997)**. "A dynamic grouping algorithm for maintenance optimization." *IEEE Transactions on Reliability*, 46(4), 522–533.
13. **Lundberg, S. M., & Lee, S. I. (2017)**. "A unified approach to interpreting model predictions." *Advances in Neural Information Processing Systems (NeurIPS 30)*.
14. **Chen, T., & Guestrin, C. (2016)**. "XGBoost: A scalable tree boosting system." *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785–794.
