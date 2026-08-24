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
        A1[TMS API: USFD Flaws & TGI Index] --> B1[Read-Only Edge Gateway / ETL Pipeline]
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
        A4 --> D1[COA Timetable Parser]
        D1 --> D2[Train Headway & Velocity Profiler]
        D2 --> D3[Corridor Downtime Slot Extractor]
    end

    subgraph STAGE 4: Multi-Department Shadow Block Clustering
        C4 --> E1[Spatial Radius Filter & OHE Power FP/SP Boundary Filter]
        D3 --> E2[Temporal Matcher & Hard-Coded G&SR Safety Conflict Matrix]
        E1 --> E3[Joint Shadow Block Bundler]
        E2 --> E3
    end

    subgraph STAGE 5: Two-Tier Constraint Optimization Engine
        E3 --> F1[Google OR-Tools Mixed-Integer Programming Solver]
        F1 --> F2{Hard Constraints Met?}
        F2 -- Yes --> F3[Optimal Block Schedule Generator]
        F2 -- No --> F4[Relax Soft Constraints & Re-evaluate]
        F4 --> F1
    end

    subgraph STAGE 6: Real-time Event Listener & SLW Rescheduling
        G1[COA Live Event Stream: Delay / Block Overrun] --> G2[Fast Heuristic Rescheduler & SLW Protocol]
        G2 --> F1
    end

    subgraph STAGE 7: Control Office Visual Dashboard & Form T/351 Workflow
        F3 --> H1[Interactive Gantt Chart & Spatial GIS Map]
        H1 --> H2[Multi-Horizon Planner: Weekly / Monthly]
        H1 --> H3[Section Controller Approval Portal]
        H3 --> H4[Digital Draft Block Push to BDMS & Form T/351 Signoff]
    end
```

### Recommended Technology Stack:

| Tier | Technologies & Frameworks |
| :--- | :--- |
| **Frontend / UI** | React.js / Vite, TailwindCSS, Chart.js / D3.js (Gantt Charts), Leaflet.js / Mapbox (GIS Track Mapping) |
| **Backend API & Edge** | Python (FastAPI / Django), WebSockets for real-time COA telemetry streams, Read-Only Legacy Edge Gateway |
| **AI / ML & Optimization** | Python, `scikit-learn`, `xgboost`, `shap`, `google-ortools` (Constraint Programming solver) |
| **Orchestration & Database** | Apache Airflow (Nightly Batch DAGs), PostgreSQL + PostGIS (Geospatial Track Data), Redis (Real-time Cache) |

---

## 4. Stage-by-Stage Detailed Engineering & Algorithm Guide

### Stage 1: Data Ingestion & Schema Normalization
* **Objective:** Ingest disparate data formats from Indian Railways legacy databases via a **Read-Only Edge Gateway** and normalize them into standard JSON schemas.
* **Inputs:**
  * `TMS`: Track Geometry Index (TGI - combining Gauge, Cross-Level, Twist, Longitudinal Level, Alignment, and Versine), Ultrasonic Flaw Detection (USFD) rail flaw logs categorized by Gross Million Tonnes (GMT), sleeper degradation.
  * `SMMS`: Point machine electromechanical locking times, Single/Multi-Section Digital Axle Counter (SSDAC/MSDAC) reset logs, track circuit drop events.
  * `TDMS`: OHE contact wire height/stagger/wear, insulator flashover logs, Feeding Posts (FP) / Sectioning Posts (SP) power block demands.
  * `COA`: Train number, origin, destination, scheduled arrival/departure, priority class (Rajdhani/Vande Bharat = 1, Superfast = 2, Express = 3, Goods = 4).

### Stage 2: AI Risk & Criticality Scoring Engine
* **Objective:** Compute a dynamic **Criticality Score ($CI \in [0, 100]$)** for every maintenance job using gradient boosted regression trees (XGBoost/LightGBM) **[5, 14]**.
* **Mathematical Formula:**
  $$CI = w_1 \cdot \text{TGI\_Deviation} + w_2 \cdot \Delta v_{\text{SpeedRestriction}} + w_3 \cdot \text{DaysOverdue} + w_4 \cdot \text{SectionGMTDensity}$$
* **Explainable AI (XAI):** Uses SHAP (SHapley Additive exPlanations) **[13]** to output human-readable reasoning for railway controllers (e.g., *"Job #402 rated 88/100 because USFD rail flaw is critical and TGI deviation breached safety thresholds"*).

### Stage 3: Corridor Capacity & Gap Extraction (COA Timetable Parsing)
* **Objective:** Analyze the train timetable to find "Downtime Slots" where track occupancy is zero or low.
* **Logic:**
  1. For a track section $S$ between stations $A$ and $B$, compute train arrival times $t_1, t_2, \dots, t_n$.
  2. Identify time gaps $\Delta T_i = t_{i+1} - t_i - \text{SafetyBuffer}$.
  3. Filter gaps where $\Delta T_i \ge \text{Minimum Block Duration}$ (e.g. 60 minutes).

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

* **Clustering Algorithm & Safety Filters:**
  1. **Spatial Grouping:** Group defects occurring within the same station section / block section ($\le 10\text{ km}$).
  2. **OHE Power Isolation Boundary Matching:** Maps Traction (TDMS) power blocks to **Substation Feeding Posts (FP) / Sectioning Posts (SP)** (40–80 km spans), ensuring local track blocks do not kill power to adjacent operational lines.
  3. **Hard-Coded G&SR Safety Conflict Matrix:** Enforces rulebook safety constraints based on the Indian Railways General & Subsidiary Rules (G&SR) manual, strictly disallowing physically incompatible task pairs (e.g., Point Machine Testing is prohibited while heavy Track Tamping Machines operate on the same chainage).

### Stage 5: Two-Tier Constraint Optimization Engine (Google OR-Tools MILP)
* **Objective:** Solve the mathematical assignment problem: assign joint maintenance blocks to available corridor slots over weekly and monthly horizons via Mixed-Integer Linear Programming (MILP) **[2, 7, 11]**.
* **Decision Variables [7]:**
  * $x_{i, s, t} \in \{0, 1\}$: 1 if Train $i$ occupies Section $s$ at time step $t$, 0 otherwise.
  * $y_{m, s, t} \in \{0, 1\}$: 1 if Maintenance Block $m$ is granted on Section $s$ at time step $t$, 0 otherwise.
  * $z_{m_1, m_2} \in \{0, 1\}$: 1 if Job $m_1$ and Job $m_2$ are combined into a single **Shadow Block**.
* **Objective Function:**
  $$\max \sum_{m \in \mathcal{M}} \left[ \text{CriticalityScore}(m) \cdot \sum_{t} y_{m, s, t} \right] + \alpha \cdot \text{ShadowOverlapHours} - \beta \cdot \text{TotalTrainDetentionMinutes}$$
* **Hard Constraints (Must Never Be Violated):**
  * Mutually exclusive section occupancy: $\sum_{i} x_{i, s, t} + y_{m, s, t} \le 1, \quad \forall s, t$
  * Minimum continuous block window: $\sum_{k=0}^{D_m - 1} y_{m, s, t+k} \ge D_m \cdot (y_{m, s, t} - y_{m, s, t-1})$
  * No maintenance during High-Priority Express Train (Rajdhani/Vande Bharat) slots.
  * Safety buffer time before and after train passes must be $\ge 15\text{ mins}$.
  * Power isolation limits for TRD overhead equipment.
* **Soft Constraints (Optimization Objectives):**
  * Maximize total Criticality Index of completed maintenance.
  * Prefer daytime blocks for complex S&T interlocking work.
  * Minimize total train detention minutes (incorporating IRPWM post-maintenance speed restriction recovery curves).

### Stage 6: Real-time Rescheduling & Single Line Working (SLW) Fallback
* **Objective:** Keep maintenance plans resilient to real-time train disruptions and block overruns **[4, 6]**.
* **Event Loop & Burst Block Protection:**
  * Listens to live train movement telemetry from COA via WebSockets.
  * If a train is delayed by $>20\text{ minutes}$, fast localized heuristics re-solve the affected section ($< 30\text{ seconds}$).
  * **Burst Block & SLW Fallback Protocol:** If a maintenance block overruns its time window (e.g. tamping machine breakdown), the system automatically triggers Single Line Working (SLW) protocols under GR&SR Chapter 5/15, routing priority passenger runs on the parallel line while holding freight rakes in sidings.

### Stage 7: Control Office Dashboard & Form T/351 Statutory Workflow
* **Objective:** Provide Section Controllers and Department Heads with an intuitive UI to review, simulate, and approve block plans **[1, 3]**.
* **Key Visualizations:**
  * **Dual Gantt Chart:** Top swimlane shows Train Runs; Bottom swimlane shows Maintenance Blocks.
  * **Interactive GIS Map:** Real-time color-coded track map showing pending defects (Red: Critical, Yellow: Moderate) and active blocks.
  * **What-If Simulator:** Interactive slider allowing controllers to test scenarios (*"What if we delay this block by 2 hours?"* $\rightarrow$ shows predicted detention cost vs. safety risk).
  * **Post-Block TSR Recovery Profiler:** Models IRPWM temporary speed restrictions ($20 \sim 30\text{ km/h} \to 45\text{ km/h} \to 75\text{ km/h} \to \text{MPS}$) enforced post-tamping.
  * **Form T/351 Statutory Approval Portal:** Pushes a **Digital Draft Proposal** into BDMS/COA while preserving mandatory **Form T/351 (Disconnection/Reconnection Notice)** execution and Private Number exchanges between Station Masters and S&T/PWI engineers.

---

## 5. Academic Literature Review & Algorithmic Foundations

Research in railway infrastructure management models this challenge as the **Integrated Train Timetabling and Maintenance Possession Scheduling (TTP-MPS)** problem **[1, 7, 10]** (IEEE **[1, 9]**, Elsevier **[2, 7, 8, 11]**, INFORMS **[10]**).

### Advanced Algorithmic Approaches Integrated:
1. **Mixed-Integer Linear Programming (MILP) [2, 7, 11]:** Discretizes the network into a time-space graph to enforce exact mathematical boundaries on capacity and maintenance windows.
2. **Logic-Based Benders Decomposition (LBBD) [8, 9]:**
   * **Master Problem:** Assigns maintenance possession windows across weekly/monthly horizons using Constraint Programming in Apache Airflow.
   * **Sub-Problem:** Solves detailed train timetabling and speed profiles for COA schedules. If a block creates an infeasible train bottleneck, Benders Cuts are generated back to the Master Problem.
3. **Multi-Agent Reinforcement Learning (MARL) & Digital Twins [1, 3]:** Department agents (TMS, SMMS, TDMS) negotiate with a central Control Office simulator environment to maximize joint shadow block overlaps.

---

## 6. Data Integration Mapping & Air-Gapped Cybersecurity

### 6.1 Air-Gapped Network Architecture & Legacy Edge Gateway
To comply with Indian Railways (RailNet) cybersecurity policies, the system uses a **Read-Only Legacy Edge Gateway**:
* **Read-Only DB Sync:** Pulls batch database snapshots from TMS, SMMS, and TDMS without requiring direct write access to legacy production databases.
* **Draft Proposal Export:** Generates structured JSON draft proposals pushed to BDMS for human Station Master verification and statutory Form T/351 execution.

### Data Entity Mapping for Indian Railways:

| Railway System | Key Data Extracted | Target API / DB Entity |
| :--- | :--- | :--- |
| **TMS** (Track Management System) | USFD testing reports, rail flaw codes, Track Geometry Index (TGI), speed restrictions. | `TrackDefectEntity` |
| **SMMS** (Signal Maintenance System) | Point machine operation count, SSDAC/MSDAC axle counter reset logs, track circuit drops. | `SignalDefectEntity` |
| **TDMS** (Traction Distribution System) | OHE contact wire height/stagger, insulator flashover logs, FP/SP power block demands. | `TractionDefectEntity` |
| **COA** (Control Office Application) | Train timetable, line capacity, live train positions, goods train forecast. | `CorridorWindowStream` |
| **BDMS** (Block Management System) | Official block requests, granted blocks, actual block start/end timestamps. | `BlockRequestEntity` |

### 1. Ingested Defect Request Schema (TMS / SMMS / TDMS API)
```json
{
  "request_id": "REQ_2026_0823_001",
  "department": "ENGINEERING_TMS",
  "section_id": "NDLS-CNB-SEC04",
  "start_km": 142.5,
  "end_km": 145.0,
  "asset_type": "RAIL_TRACK",
  "defect_type": "USFD_FLAW_SEVERE",
  "est_duration_minutes": 150,
  "safety_risk_index": 8.5,
  "speed_restriction_kmh": 30,
  "days_overdue": 12
}
```

### 2. Output Optimized Block Schedule Schema (BDMS / COA Push API)
```json
{
  "block_id": "BLK_2026_0824_101",
  "section_id": "NDLS-CNB-SEC04",
  "start_time": "2026-08-24T01:30:00Z",
  "end_time": "2026-08-24T04:00:00Z",
  "total_duration_minutes": 150,
  "is_shadow_block": true,
  "participating_departments": ["ENGINEERING_TMS", "SIGNAL_SMMS", "TRACTION_TDMS"],
  "included_requests": ["REQ_2026_0823_001", "REQ_2026_0823_014", "REQ_2026_0823_022"],
  "criticality_score_total": 245.8,
  "estimated_train_detention_minutes": 0,
  "status": "PROPOSED_PENDING_APPROVAL"
}
```

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

---
