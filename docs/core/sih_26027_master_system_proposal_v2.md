# SIH PS 26027: Master System Proposal & Technical Specification (v2.2 Verified Edition)
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
| **2** | **Risk-Based Task Prioritization** | Uniform handling of routine maintenance vs. severe structural rail defects | **Stage 2: AI Risk & Criticality Scoring Engine** | Two-Mode Scoring: Isotonic-Calibrated Gradient Boosted Trees (Khalilzadeh et al., 2025; Chen & Guestrin, 2016) + Probability-Space SHAP (Lundberg & Lee, 2017) with Deterministic Rule-Based Fallback | **Dual-Engine Scoring** ($CI \in [0, 100]$ based on simulated failure hazard, TGI, GMT, and USFD flaw history) |
| **3** | **Asset Availability Maximization** | Repeated solo traffic closures causing high cumulative track downtime | **Stage 4: Multi-Department "Shadow Block" Clustering** | Spatial-Temporal Clustering & G&SR Conflict Matrix (Wildeman, Dekker & Smit, 1997; Zhang, Gao et al., 2019) | **Opportunistic Grouping** (Target 25–35% empirical recovery, up to 55% peak upper bound) |
| **4** | **Train Timetable Protection** | Maintenance possession conflicting with high-priority passenger runs | **Stage 5: Two-Tier Constraint Optimization Engine** | Assignment formulation via Google OR-Tools CP-SAT (constraint programming) (Ji et al., 2026; Zhang, Gao et al., 2019; Peng & Ouyang, 2011) | **Exact Mathematical Coverage** (VIP zero-detention, gap exclusivity, machine capacity limits) |
| **5** | **Real-Time Disruption Adaptability** | Dynamic train delays invalidating pre-scheduled static block plans | **Stage 6: Real-Time Rescheduling & SLW Fallback** | WebSocket Telemetry Stream + Fast Heuristics + SLW Protocol (Zhang, D'Ariano, He & Peng, 2019; Luan et al., 2017) | **Sub-Second Adaptability** (Auto-reschedule for delays $>20$ min with Burst Block protection) |
| **6** | **Controller Decision Support** | Manual cross-departmental coordination lacking visual simulation tools | **Stage 7: Control Office Dashboard & Form T/351 Workflow** | React.js / Leaflet GIS Map + Dual Gantt + Digital Draft BDMS Push | **Full Operational Coverage** (Direct BDMS / COA Draft integration + Form T/351 G&SR compliance) |
| **7** | **Multi-Horizon Planning (weekly & monthly)** | Static single-horizon plans unable to support long-term maintenance | **Stage 7: Multi-Horizon Planner (7-day / 30-day re-run of Stage 5)** | Rolling-horizon re-optimization | **PS-mandated coverage** (weekly + monthly block plans generated from the same optimizer), exposed via POST /api/v1/optimizer/run?horizon_days=7|30. |

### 2.1 Quantitative Operational Performance Metrics

The architectural design targets the following empirical performance benchmarks across section operations:

- **Track Downtime Efficiency:** Reduces cumulative track possession time per section from 5.5 hours (uncoordinated solo blocks) to 2.5 hours (Joint Shadow Block), yielding a **peak theoretical recovery of 55%** and an **empirical operational recovery averaging 25% – 35%** across routine multi-department schedules.
- **Possession Proposal Latency (Two-Tier Architecture):** Heavy CP-SAT optimization runs **offline as a nightly batch job (Apache Airflow DAG in production; APScheduler/CLI trigger in the MVP)** for base 7-day plans, while **real-time dynamic rescheduling is sub-second end-to-end (the block time-shift itself executes in $< 1\text{ ms}$)** for localized time shifts when train delays occur.
- **Network Train Detention:** Minimizes delay propagation across passenger corridors, targeting up to a **70% reduction in total train detention minutes** (accounting for IRPWM post-maintenance Temporary Speed Restriction recovery curves). This figure is a **simulation-based target**, to be validated via Monte Carlo simulation over synthetic scenarios (see Simulation & Validation Methodology section); field validation requires a CRIS pilot deployment.

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
        E3 --> F1["Google OR-Tools CP-SAT Solver (Constraint Programming)"]
        F1 --> F2{Hard Constraints Met?<br/>VIP Zero Detention & Machine Limits}
        F2 -- Yes --> F3[Optimal Block Schedule Generator]
        F2 -- No --> F4[Relax Soft Constraints & Re-evaluate]
        F4 --> F1
    end

    subgraph STAGE 6: Real-time Event Listener & SLW Rescheduling
        G1[Live Telemetry WebSocket: Delay / Block Overrun] --> G2[Fast Heuristic Rescheduler & TSLW Advisory (GR 3.68; SR 4.42/Ch 15)]
        G2 --> F1
    end

    subgraph STAGE 7: Control Office Visual Dashboard & Form T/351 Workflow
        F3 --> H1[Interactive Dual Gantt Chart & Spatial GIS Map]
        H1 --> H2[In-Memory What-If Simulation with HMAC Commit Tokens]
        H1 --> H5["Multi-Horizon Planner: Weekly / Monthly Re-optimization"]
        H1 --> H3[Section Controller Approval Portal]
        H3 --> H4[Form T/351 PN State Machine & CRIS BDMS JSON Push]
    end
```

### 3.1 Technology Stack & Implementation Specifications

| Tier | Technologies & Frameworks | Implemented Responsibilities |
| :--- | :--- | :--- |
| **Backend API & Core** | Python 3.12, FastAPI, Pydantic v2, `uv` | High-performance asynchronous REST APIs, dependency injection, and data validation |
| **Authentication & Security** | OAuth2 Password Bearer, JWT (`python-jose`), `passlib[bcrypt]` | Token issuing, password hashing, Role-Based Access Control (4+1-tier RBAC) |
| **Middleware & Reliability** | `slowapi` (Limiter), `structlog`, OWASP Security Headers | 120 req/min rate limiting, structured JSON logging, XSS/Clickjacking protection |
| **Optimization Solver** | Google OR-Tools (CP-SAT — constraint programming) | Candidate-block-to-corridor-gap assignment optimization with Tier-1 VIP protection and machine capacity limits |
| **AI / ML & Explainability** | Python, `scikit-learn`, `xgboost`, `lightgbm`, `shap` | Dynamic Criticality Index ($CI \in [0, 100]$) and SHAP feature attribution |
| **Database & ORM** | PostgreSQL 15 (9 Tables), SQLAlchemy 2.0 (Async), Alembic | Relational schema persistence, migrations, and synthetic seed sandbox calibrated to published IR statistics |
| **Real-time Telemetry** | WebSockets (`/api/v1/events/ws/telemetry`), Server-Sent Events | Live train delay broadcast stream and Single Line Working (SLW) alert push |
| **Frontend UI (WIP)** | React (v18+), Vite, TypeScript, TailwindCSS, Leaflet, D3 | Control Office Dual Gantt, Geospatial GIS Map, What-If Slider UI, Form T/351 Portal |
| **Containerization** | Docker, Docker Compose, pgAdmin 4 | Production multi-stage Docker containerization and database management GUI |
| **Batch Orchestration** | Apache Airflow (production DAGs) / APScheduler (MVP) | Nightly full-horizon re-optimization of weekly & monthly block plans |

---

## 4. Stage-by-Stage Detailed Engineering & Algorithm Guide

### Stage 1: Data Ingestion & Schema Normalization
* **Objective:** Ingest disparate data formats from Indian Railways legacy databases via a **Read-Only Edge Gateway** and normalize them into standard JSON schemas.
* **Implemented Adapters (`backend/app/services/adapters.py` & `backend/app/api/ingestion.py`):**
  * `TMSAdapter` (`POST /api/v1/ingest/tms`): Track Geometry Index (TGI - combining Gauge, Cross-Level, Twist, Longitudinal Level, Alignment, and Curvature), Ultrasonic Flaw Detection (USFD) rail flaw classification per Indian Railways practice — **Good / IMR / IMRW / OBS / OBSW** (tabulated as T1 = IMR/IMRW, T2 = OBS/OBSW) with GMT-based re-test intervals — plus chainage markers and duration.
  * `SMMSAdapter` (`POST /api/v1/ingest/smms`): Point machine electromechanical locking risk score, station codes, and asset IDs.
  * `TDMSAdapter` (`POST /api/v1/ingest/tdms`): OHE contact wire wear percentage, Substation Feeding Post (FP) identifiers, and power isolation flags.
  * `COAAdapter`: Train timetable numbers, departure/arrival times, priority classes, section movement schedules, **and the goods trains forecast from the Control Office (anticipated freight paths for the planning horizon, not yet present in the published timetable)**.

---

### Stage 2: AI Risk & Criticality Scoring Engine
* **Objective:** Compute a dynamic **Criticality Score ($CI \in [0, 100]$)** for every maintenance job using a **Two-Mode Scoring Engine**: deployed primary (v2) is gradient boosted decision trees (XGBoost/LightGBM) trained on simulated degradation-failure outcomes from the Synthetic Seed Sandbox (hazard-based labels with domain randomization), isotonic-calibrated and served with probability-space SHAP attributions; transparent expert-weighted linear formula (v1) serves as deterministic fallback and ablation baseline.
* **Deterministic Fallback & Baseline Formula (v1):**
  $$CI = 0.30 \cdot \text{TGI} + 0.25 \cdot \frac{\Delta v_{\text{TSR}}}{1.2} + 0.20 \cdot \frac{\min(\text{Overdue}, 60)}{60} \cdot 100 + 0.15 \cdot \frac{\text{GMT}}{1.5} + \text{Penalty}$$
* **Severity Mapping:** The severity term is driven by the statutory USFD classification ordinal (`Good=0 < OBS=1 < OBSW=2 < IMR=3 < IMRW=4`, per IRPWM T1/T2 tabulation), with `IMRW` (+35) and `IMR` (+25) (T1) receiving the highest penalties, followed by `OBSW` (+10) and `OBS` (+5) (T2).
* **Availability-Impact Dimension:** the speed-restriction delta ($\text{MPS} - v_{\text{TSR}}$) serves as the direct measure of impact on asset availability — an active TSR on a high-MPS line measurably reduces corridor capacity — so degraded assets that restrict traffic score higher on this PS-mandated dimension, independent of failure risk.
* **Explainable AI (XAI):** Uses SHAP (SHapley Additive exPlanations) (Lundberg & Lee, 2017) in probability space satisfying $\text{base} + \sum \phi_i \approx P(\text{failure})$ to output human-readable reasoning for railway controllers (e.g., *"Base failure rate 8%. USFD IMR flaw +21 pts, 80 km/h TSR +14, 14 days overdue +9, heavy-freight section +6, TGI deviation +3 → 61% simulated 30-day failure probability; CI 88 = riskier than 88% of the current backlog"*).
* **Two-Mode Scoring Engine:** The deployed primary (v2) is an XGBoost/LightGBM model trained on simulated degradation-failure outcomes from the Synthetic Seed Sandbox (hazard-based labels with domain randomization), isotonic-calibrated and served with probability-space SHAP attributions. The deterministic fallback and ablation baseline (v1) is a transparent expert-weighted linear CI used when the model artifact is unavailable and as the comparison baseline in evaluation. Both modes are retrained/recalibrated on real labeled outcomes once a CRIS pilot accrues failure history; the API contract is identical across modes.
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
  6. **Freight Forecast Overlay:** Anticipated goods-train paths from the COA goods trains forecast are included as corridor occupancy for the planning horizon — timetable movements cover the near term, while forecast freight paths (flagged FORECAST_FREIGHT) occupy future corridor capacity in monthly views, so extracted gaps reflect both scheduled and forecast demand before candidate blocks are formed.

---

### Stage 4: Multi-Department "Shadow Blocking" & G&SR Safety Rules
* **Objective:** Combine maintenance requests from Track (TMS), Signal (SMMS), and Electrical (TDMS) into a single corridor window (**Opportunistic Maintenance / Multi-Component Grouping** (Wildeman, Dekker & Smit, 1997; Zhang, Gao, Yang, Kumar & Gao, 2019)).

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

### Stage 5: Two-Tier Constraint Optimization Engine (Google OR-Tools CP-SAT)
* **Objective:** Solve the mathematical assignment problem: assign joint maintenance blocks to available corridor slots over weekly and monthly horizons via constraint programming (OR-Tools CP-SAT) (Ji et al., 2026; Zhang, Gao et al., 2019; Peng & Ouyang, 2011).
* **Decision Variables:**
  * $y_{m, g} \in \{0, 1\}$: 1 if Candidate Joint Block $m$ is assigned to Corridor Gap $g$, 0 otherwise.
* **Objective Function:**
  $$\max \sum_{m, g} y_{m, g} \cdot \left[ \text{CriticalityScore}(m) + \alpha \cdot \text{ShadowOverlapHours}(m) - \beta \cdot \text{TrainDetentionMinutes}(m, g) \right]$$
* **Detention Term Clarification:** `TrainDetentionMinutes(m, g)` represents scheduled overlap minutes for low-priority freight services (held in loop sidings) during non-VIP gaps. VIP/Tier-1 passenger classes are excluded from detention entirely via the hard zero-detention constraint (Hard Constraint 4).
* **Hard Constraints (Must Never Be Violated):**
  1. **Corridor Duration Bound:** Block duration cannot exceed gap duration ($D_m \le T_g$).
  2. **Gap Exclusivity:** At most one major block per section per gap window ($\sum_m y_{m, g} \le 1$).
  3. **Job Request Uniqueness:** Each maintenance request can be scheduled at most once across all selected blocks ($\sum_{m \in \mathcal{M}_r} \sum_g y_{m, g} \le 1$).
  4. **Tier 1 VIP Passenger Protection:** Hard zero-detention constraint ($\text{Detention}(m, g) = 0$ for all gaps adjacent to Rajdhani, Vande Bharat, Shatabdi, Tejas, Duronto, Gatimaan).
  5. **Machine Resource Capacity Limits:** Total heavy machines (Tamping Machines, Tower Wagons, BCMs) allocated across all concurrent section blocks cannot exceed active regional fleet capacity:
     $$\sum_{m \in \mathcal{M}_{\text{res}}} \sum_{g \in \mathcal{G}_t} y_{m, g} \le \text{Capacity}(\text{res}), \quad \forall \text{res} \in \mathcal{R}, \forall t$$

---

### Stage 6: Real-time Rescheduling & Single Line Working (SLW) Fallback
* **Objective:** Keep maintenance plans resilient to real-time train disruptions and block overruns (Zhang, D'Ariano, He & Peng, 2019; Luan et al., 2017). For demonstration and testing, a Simulated COA Event Injector UI control fires synthetic delay/overrun events into the telemetry stream.
* **Implementation (`backend/app/services/rescheduler.py` & `backend/app/api/optimizer.py`):**
  * **Minor Delays ($\le 20\text{ min}$):** Absorbed directly into the $\ge 15\text{ min}$ statutory safety buffers.
  * **Major Delays ($> 20\text{ min}$):** Fast greedy heuristic rescheduler shifts block start/end times in $< 1\text{ ms}$ without global CP-SAT re-solving.
  * **Block Overrun Disruption ($+15\text{ min}$ overrun with queued trains):**
    * Triggers a **Temporary Single Line Working (TSLW) advisory** for the adjacent double line, per **GR 3.68** (Regulations for Single Line Working on Double Line during total interruption of communication), zonal **Subsidiary Rules Chapter 4** (SR 4.42 — SLW speed restrictions; SR 4.09 — clamping/padlocking of points), and zonal **SR Chapter 15** procedures. Written authority is issued via **Form T/D 602** (Line Clear Ticket + Authority to Pass Signals at 'ON' + Caution Order).
    * Enforces statutory caution-order speed restrictions:
      * **First / Pilot Train:** 25 km/h (caution order speed restriction)
      * **Facing Points / Crossovers:** 15 km/h
      * **Subsequent Trains:** booked speed (a 40 km/h cap applies only to wrong-direction working on automatic block sections per TSL procedure)
    * Generates a draft Caution Order + T/D 602 support sheet and a control-phone script for the Section Controller; freight regulation (holding trains in sidings) is presented as controller decision support, not as a codified statutory instrument.

---

### Stage 7: Control Office Dashboard & Form T/351 Statutory Workflow
* **Objective:** Provide Section Controllers, Station Masters, and Engineers with an intuitive UI and statutory verification workflows.
* **Features (`backend/app/api/blocks.py`, `backend/app/api/optimizer.py`):**
  * **In-Memory What-If Simulation:** `POST /api/v1/optimizer/simulate` computes time-shift impacts in-memory and returns a cryptographically signed **HMAC-SHA256 Commit Token** with a 15-minute expiration window.
  * **Token Commit Action:** `POST /api/v1/optimizer/commit-simulation` verifies the HMAC token signature and persists the simulated schedule directly to PostgreSQL without draft DB pollution.
  * **Statutory Form T/351 State Machine:**
    $$\text{PROPOSED} \longrightarrow \text{APPROVED} \longrightarrow \text{ACTIVE (with Disconnection PN)} \longrightarrow \text{COMPLETED (with Reconnection PN \& TSR)}$$
  * **CRIS BDMS JSON Exporter:** `GET /api/v1/blocks/{id}/export-bdms` outputs standard CRIS BDMS draft block possession payloads.
  * **Form T/351 Notice Exporter:** `GET /api/v1/blocks/{id}/t351-notice` outputs official Disconnection Notice records with Private Number validation tokens.

---

## 5. Academic Literature Review & Algorithmic Foundations

Research in railway infrastructure management models this challenge as the **Integrated Train Timetabling and Maintenance Possession Scheduling (TTP-MPS)** problem (Luan et al., 2017; Ji et al., 2026; Lidén, 2015).

### Approaches Integrated in This System:
1. **Constraint Programming via CP-SAT (Ji et al., 2026; Zhang, Gao et al., 2019):** The integrated scheduling problem is reformulated as a candidate-block-to-corridor-gap assignment, solved exactly with Google OR-Tools CP-SAT under hard safety and capacity constraints.
2. **Maintenance Activity Grouping (Wildeman, Dekker & Smit, 1997; Zhang, Gao et al., 2019):** The Shadow Block mechanism implements opportunistic multi-component grouping, with the highest-criticality job as the primary anchor and flexible internal offsets for secondary activities.
3. **Two-Tier Decomposition (this system):** Offline full-horizon CP-SAT optimization for base plans, combined with sub-second greedy heuristics for real-time disruption response — mirroring the master/sub-problem structure of decomposition approaches in the literature (Zhang, D'Ariano, He & Peng, 2019).

### Future Work (research extensions, not in MVP scope):
- **Logic-Based Benders Decomposition:** Master problem assigns possession windows network-wide; sub-problem validates train timetabling feasibility and returns Benders cuts. Required for scaling beyond single-division scope.
- **Multi-Agent Reinforcement Learning / Digital Twins:** Department-level agents negotiating shadow-block overlaps in a simulated control environment.

---

## 6. Data Architecture, Security & Complete API Catalog

### 6.1 Air-Gapped Network Architecture & Legacy Edge Gateway
To comply with Indian Railways (RailNet) cybersecurity policies, the system operates through a **Read-Only Legacy Edge Gateway**:
* **Read-Only DB Sync:** Pulls batch database snapshots from TMS, SMMS, and TDMS without requiring direct write access to legacy production databases.
* **Draft Proposal Export:** Generates structured JSON draft proposals pushed to BDMS for human Station Master verification and statutory Form T/351 execution.

### 6.1.1 Synthetic Seed Sandbox (Data Provenance)
Live TMS/SMMS/TDMS/COA feeds are RailNet-internal and cannot be accessed during development. The MVP therefore ships with a **Synthetic Seed Sandbox**: deterministic seed data whose structure mirrors the published schemas of TMS, SMMS, and TDMS, and whose distributions are calibrated to published Indian Railways statistics — 68 divisions, 13,000+ passenger trains daily, USFD classification per IRPWM, and a track machine fleet of 883 TMMs (PIB 2018) with 1,100+ inducted since 2014. Each legacy system is wrapped in an **adapter with an identical interface** for both mock and live connectors; a CRIS pilot deployment swaps mock connectors for live adapters without changes to Stages 2–7.

---

### 6.2 Authentication, RBAC & API Security Layer
* **Password Hashing:** `bcrypt` with automatic salt generation and 72-byte truncation protection.
* **JWT Tokens:** Signed `HS256` Bearer tokens with 480-minute TTL containing `sub`, `role`, `user_id`, `email`.
* **Role-Based Access Control (4+1-tier RBAC):**
  1. `ADMIN`: Full administrative access and system user management.
  2. `SECTION_CONTROLLER`: Block generation, What-If simulation, and schedule commitment.
  3. `STATION_MASTER`: Private Number issuance and Form T/351 Disconnection/Reconnection authorization.
  4. `DEPARTMENT_ENGINEER`: Maintenance request creation and progress tracking.
  5. `DIVISIONAL_AUTHORITY`: Approval of traffic blocks exceeding 4 hours and non-interlocking (NI) works exceeding 3 days, per Railway Board letter dated 16.06.2022 (DRM ≤ 4 hr; GM sanction for NI ≤ 3 days).
* **Rate Limiting:** `slowapi` enforcing `120 requests/minute` per remote IP.
* **OWASP Middleware:** Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.
* **Departmental Consent Workflow:** A Shadow Block (multi-department joint possession) requires explicit consent from each participating department's engineer before it reaches the Section Controller for granting — enforcing the RDSO principle that "each maintenance block granted will be simultaneously utilized by all departments."

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
│ role (ADMIN, SECTION_CONTROLLER, STATION_MASTER,                   │
│       DEPARTMENT_ENGINEER, DIVISIONAL_AUTHORITY),                   │
│ department, is_active, created_at, updated_at                      │
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
| | `GET` | `/api/v1/blocks/{id}/td602-sheet`| Export Form T/D 602 SLW authority & caution order support sheet | Station Master / Controller |
| **Optimizer** | `POST` | `/api/v1/optimizer/run?horizon_days=7|30` | Execute Stages 3 $\to$ 4 $\to$ 5 solver over the requested horizon (7 = weekly plan, 30 = monthly plan) & persist | Controller |
| | `POST` | `/api/v1/optimizer/simulate` | In-memory What-If simulation with HMAC token | Controller |
| | `POST` | `/api/v1/optimizer/commit-simulation`| Commit simulated schedule using HMAC token | Controller |
| | `POST` | `/api/v1/optimizer/reschedule`| Real-time fast rescheduling & SLW fallback | Controller |
| **Live Telemetry** | `WS` | `/api/v1/events/ws/telemetry` | WebSocket live train delay & SLW broadcast | Authenticated |
| **Health Checks** | `GET` | `/` | Root API metadata & Swagger docs link | Public |
| | `GET` | `/health` | Live PostgreSQL connectivity check | Public |

---

## 6.5 Simulation & Validation Methodology
All quantitative targets (shadow-block downtime recovery, detention reduction) are validated as follows:
1. **Baseline:** Uncoordinated solo blocks scheduled greedily into corridor gaps (current BDMS behavior).
2. **Monte Carlo Simulation:** 500 randomized scenario runs over the synthetic seed sandbox, varying defect arrival rates, train delay distributions, and department request mixes.
3. **Reporting:** Mean ± standard deviation of (a) cumulative track possession hours per section, (b) total train detention minutes, (c) shadow-block overlap hours, comparing optimized vs. baseline.
4. **Honesty Boundary:** These are simulation results on synthetic data calibrated to public statistics; field validation requires a CRIS pilot. No field performance is claimed.

---

## 6.6 Three-Minute Demo Script
1. **(0:00–0:40) The Problem:** Show the uncoordinated Gantt — three separate department blocks on one section = 5.5 hrs track closed.
2. **(0:40–1:30) The AI:** Ingest synthetic defects via the TMS/SMMS/TDMS adapters; show Criticality Index scores with SHAP-style reasoning.
3. **(1:30–1:55) The Optimization:** Click "Optimize" — CP-SAT assigns a joint Shadow Block; track closed time drops to 2.5 hrs (55% reduction).
4. **(1:55–2:15) Monthly Horizon:** Toggle horizon_days to 30 — the planner re-runs CP-SAT over the monthly corridor view; the monthly block plan renders, and forecast freight paths (beyond the timetable) are visibly already occupying future capacity.
5. **(2:15–2:45) Real-Time Resilience:** Inject a mock 25-minute train delay via the Simulated COA Event Injector; watch the fast heuristic reschedule within seconds, VIP trains untouched.
6. **(2:45–3:00) Statutory Closure:** Push the draft block to BDMS JSON export + Form T/351 notice with Private Number state machine.

---

## 7. References

### A. Academic Literature (all verified)

1. Luan, X., Miao, J., Meng, L., Corman, F., & Lodewijks, G. (2017). Integrated optimization on train scheduling and preventive maintenance time slots planning. *Transportation Research Part C: Emerging Technologies*, 80, 329–359.
2. Ji, H., Zhang, C., Yin, J., & Yang, L. (2026). A data-driven optimization approach for the integrated train scheduling and maintenance planning in high-speed railways. *Computers & Operations Research*, 185, 107261. DOI: 10.1016/j.cor.2025.107261
3. Zhang, C., Gao, Y., Yang, L., Kumar, U., & Gao, Z. (2019). Integrated optimization of train scheduling and maintenance planning on high-speed railway corridors. *Omega*, 87, 86–104.
4. Zhang, Y., D'Ariano, A., He, B., & Peng, Q. (2019). Microscopic optimization model and algorithm for integrating train timetabling and track maintenance task scheduling. *Transportation Research Part B: Methodological*, 127, 237–278.
5. Lidén, T. (2015). Railway infrastructure maintenance – a survey of planning problems and conducted research. *Transportation Research Procedia*, 10, 574–583. DOI: 10.1016/j.trpro.2015.09.011
6. Peng, F., & Ouyang, Y. (2011). A heuristic approach to the railroad track maintenance scheduling problem. *Computer-Aided Civil and Infrastructure Engineering*, 26(2), 129–145. DOI: 10.1111/j.1467-8667.2010.00670.x
7. Peng, F., & Ouyang, Y. (2012). Track maintenance production team scheduling in railroad networks. *Transportation Research Part B: Methodological*, 46(10), 1474–1488.
8. Wildeman, R. E., Dekker, R., & Smit, A. C. J. M. (1997). A dynamic policy for grouping maintenance activities. *European Journal of Operational Research*, 99(3), 530–551.
9. Khalilzadeh, M., Pamucar, D., & Heidari, A. (2025). Reducing train delays with machine learning-based predictive maintenance for railways. *Decision Making: Applications in Management and Engineering*, 8(2), 265–284. DOI: 10.31181/dmame8220251514
10. Mutlu, U., & Kaewunruen, S. (2026). Digitalised predictive maintenance in railways: A systematic review of AI, BIM, and digital twins. *Infrastructures*, 11(3), 87.
11. Lundberg, S. M., & Lee, S.-I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems 30 (NeurIPS)*.
12. Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785–794. DOI: 10.1145/2939672.2939785

### B. Statutory & Normative Sources (Indian Railways)

- General & Subsidiary Rules (G&SR:2018) — GR 3.68 (SLW on double line); zonal SRs Chapter 4 (SR 4.42, SR 4.09) and Chapter 15.
- Form T/D 602 — Temporary Single Line Working line clear authority (Line Clear Ticket + Authority to Pass Signals at 'ON' + Caution Order).
- Form T/351 — S&T Disconnection/Reconnection Notice.
- Indian Railways Permanent Way Manual (IRPWM) — USFD classification (Good/IMR/IMRW/OBS/OBSW; T1/T2 tabulation); track geometry parameters.
- Railway Board letter dated 16.06.2022 — delegation: DRM traffic blocks ≤ 4 hours; GM sanction of NI works ≤ 3 days.
- RDSO guidance — "Since granting of maintenance blocks is an expensive proposition, each maintenance block granted will be simultaneously utilized by all departments."
- Indian Railways Rolling Block Programme guidelines — 26-week rolling schedule, weekly review.
- Press Information Bureau (2018) — Track Maintenance Machine fleet: 883 machines; Ministry of Railways — 1,100+ machines inducted since 2014.
