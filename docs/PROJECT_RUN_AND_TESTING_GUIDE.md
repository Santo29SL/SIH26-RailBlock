# 🚆 RailBlock — Complete System Architecture, Run & Testing Guide
> **Smart India Hackathon 2026 | Problem Statement 26027**  
> **Ministry of Railways (CRIS / RDSO)**

---

## 📖 Table of Contents
1. [System Architecture & Core Layers](#1-system-architecture--core-layers)
2. [Quickstart — Run Everything in 1 Command](#2-quickstart--run-everything-in-1-command)
3. [Master Access Table (URLs, Ports & Credentials)](#3-master-access-table-urls-ports--credentials)
4. [Step-by-Step UI & Testing Guide (Click-by-Click)](#4-step-by-step-ui--testing-guide-click-by-click)
   - [A. RailBlock Frontend Dashboard (Port 5173)](#a-railblock-frontend-dashboard-http-localhost-5173)
   - [B. Swagger API & AI Model Testing (Port 8000)](#b-swagger-api--ai-model-testing-http-localhost-8000docs)
   - [C. Apache Airflow Data Pipelines (Port 8080)](#c-apache-airflow-data-pipelines-http-localhost-8080)
   - [D. dbt Data Lineage Visualization (Port 8085)](#d-dbt-data-lineage-visualization-http-localhost-8085)
   - [E. pgAdmin Database Inspection (Port 5050)](#e-pgadmin-database-inspection-http-localhost-5050)
5. [Project Directory Anatomy](#5-project-directory-anatomy)
6. [Daily Management & Maintenance Commands](#6-daily-management--maintenance-commands)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. System Architecture & Core Layers

RailBlock integrates 5 interdependent systems into a unified railway possession planning engine:

```text
 ┌──────────────────────────────────────────────────────────┐
 │ 1. Frontend UI (Port 5173 - React 18 + Vite + Leaflet)   │
 │    Interactive map, Gantt chart, What-If simulator       │
 └────────────────────────────┬─────────────────────────────┘
                              │ REST / WebSockets
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │ 2. Backend Core (Port 8000 - FastAPI + Async SQLAlchemy) │
 │    - AI Risk Engine: XGBoost + SHAP (Mode 2) & Rule (Mode 1)
 │    - Gap Extractor: Finds free track intervals (>= 15m buffer)
 │    - Clustering: Bundles nearby jobs into Joint Shadow Blocks
 │    - Solver: Google OR-Tools CP-SAT (Zero VIP train detention)
 │    - Rescheduler: Sub-second greedy shifts for live delays   │
 └─────────────┬──────────────────────────────┬─────────────┘
               │                              │
               ▼                              ▼
 ┌───────────────────────────┐  ┌───────────────────────────┐
 │ 3. PostgreSQL Database    │  │ 4. Apache Airflow         │
 │    (Port 5433 / 5432)     │  │    (Port 8080)            │
 │    - 8.9k railway stations│  │    - Nightly CRIS ingest  │
 │    - 8k+ train timetables │  │    - Weekly capacity calc │
 │    - Maintenance defects  │  │    - Weekly ML retraining │
 │    - Users & permissions  │  └─────────────┬─────────────┘
 └─────────────┬─────────────┘                │
               │                              ▼
               │                ┌───────────────────────────┐
               │                │ 5. dbt Data Lineage       │
               │                │    (Port 8085)            │
               └───────────────►│    - Staging, Int & Marts │
                                │    - Interactive DAG graph│
                                └───────────────────────────┘
```

---

## 2. Quickstart — Run Everything in 1 Command

### Prerequisites:
- **Docker Desktop** installed and actively running on your laptop.

### Terminal Command:
Open your terminal, navigate to the project root, and execute:

```bash
cd /Users/santhoshsl/RailBlock

# Launch all 6 services simultaneously
docker compose -f docker-compose.yml -f docker-compose.airflow.yml up -d
```

### What Happens Automatically:
1. Provisions **PostgreSQL 15** on port `5433` (internal `5432`).
2. Runs database migrations (`alembic upgrade head`).
3. Seeds the database with **8,900+ Indian railway stations**, train timetables, and sample maintenance defect requests.
4. Compiles and starts the **FastAPI Backend Core** with Google OR-Tools and the XGBoost Risk Engine.
5. Builds and serves the **React + Vite Frontend**.
6. Initializes the **Apache Airflow** webserver & scheduler with pre-loaded DAGs.
7. Serves the **dbt Documentation & Lineage Graph**.

### Verify Running Status:
```bash
docker compose -f docker-compose.yml -f docker-compose.airflow.yml ps
```

---

## 3. Master Access Table (URLs, Ports & Credentials)

| Service | Local URL | Credentials / Login | Primary Purpose |
| :--- | :--- | :--- | :--- |
| 🖥️ **Frontend Dashboard** | **[http://localhost:5173](http://localhost:5173)** | *None needed* | Main operator dashboard, interactive GIS track map, and Gantt charts |
| ⚡ **Swagger API Docs** | **[http://localhost:8000/docs](http://localhost:8000/docs)** | See Auth step below | Interactive testing interface for all backend APIs & AI engines |
| 📜 **ReDoc Specs** | **[http://localhost:8000/redoc](http://localhost:8000/redoc)** | *Public* | Clean, printable technical API documentation |
| 🌪️ **Apache Airflow** | **[http://localhost:8080](http://localhost:8080)** | **User:** `admin`<br>**Pass:** `admin` | View and trigger automated data engineering pipelines |
| 📊 **dbt Data Lineage** | **[http://localhost:8085](http://localhost:8085)** | *None needed* | View the interactive SQL dependency lineage graph |
| 🐘 **pgAdmin 4 (DB GUI)** | **[http://localhost:5050](http://localhost:5050)** | **Email:** `admin@railblock.dev`<br>**Pass:** `admin` | Web-based visual GUI for database inspection |
| 💓 **Health Endpoint** | **[http://localhost:8000/health](http://localhost:8000/health)** | *Public* | Quick JSON verification confirming database connectivity |

---

## 4. Step-by-Step UI & Testing Guide (Click-by-Click)

### A. RailBlock Frontend Dashboard ([http://localhost:5173](http://localhost:5173))
1. Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome or Safari.
2. Explore the live interactive railway corridor map displaying stations and tracks between New Delhi and Kanpur.
3. Inspect train movements and proposed shadow blocks on the timeline visualizer.

---

### B. Swagger API & AI Model Testing ([http://localhost:8000/docs](http://localhost:8000/docs))

#### 1. Seed Demo Accounts & Authenticate
1. Open **[http://localhost:8000/docs](http://localhost:8000/docs)**.
2. Expand `POST /api/v1/auth/seed-users` $\to$ click **Try it out** $\to$ **Execute** *(creates default railway accounts)*.
3. Expand `POST /api/v1/auth/login` $\to$ click **Try it out** $\to$ enter:
   - `username`: `controller_ndls`
   - `password`: `Password123!`
4. Click **Execute** and copy the `access_token` string from the JSON response.
5. Click the green **Authorize** button at the top-right of Swagger UI, paste the token into the value field, and click **Authorize**. You are now authenticated!

#### 2. Test Stage 2 AI Risk & SHAP Explainability
1. Expand `POST /api/v1/risk/predict` $\to$ click **Try it out**.
2. Paste this sample payload:
```json
{
  "department": "TRACK",
  "activity_type": "RAIL_RENEWAL",
  "priority": "CRITICAL",
  "metadata_json": {
    "tgi_deviation": 88.5,
    "speed_restriction_kmh": 30.0,
    "usfd_flaw_severity": 3.0,
    "days_overdue": 14,
    "section_gmt_density": 95.0
  }
}
```
3. Click **Execute**. The response returns:
   - Dynamic **Criticality Index** (e.g. `91.5/100`).
   - Exact **SHAP feature attributions** breaking down the impact of track flaws, speed restrictions, and traffic density.
   - **Human-Readable Natural Language Reasoning** explaining the score.

#### 3. Test Stage 5 Google OR-Tools Optimization Solver
1. Expand `POST /api/v1/optimizer/run` $\to$ click **Try it out**.
2. Paste this payload:
```json
{
  "section_id": "79ab739f-27bb-45e7-9e84-3821b314aa3a",
  "target_date": "2026-08-25",
  "persist_to_db": true
}
```
3. Click **Execute**. The solver calculates candidate shadow blocks and assigns them to available timetable gaps while strictly enforcing **zero detention for VIP trains**.

---

### C. Apache Airflow Data Pipelines ([http://localhost:8080](http://localhost:8080))
1. Open **[http://localhost:8080](http://localhost:8080)**.
2. Sign in with:
   - **Username:** `admin`
   - **Password:** `admin`
3. Under the **DAGs** tab, you will see 3 production pipelines:
   - `nightly_cris_ingestion_dag`: Ingests legacy railway defect telemetry daily.
   - `weekly_master_schedule_dag`: Computes weekly corridor capacity and idle windows.
   - `weekly_ml_retraining_dag`: Retrains the XGBoost risk model against newly resolved defects.
4. Click the blue toggle switch to **Unpause** any DAG.
5. Click the **Play (Trigger DAG)** button under "Actions" to manually run the pipeline.
6. Click into the DAG to view the **Graph View** or **Grid View** showing live task execution.

---

### D. dbt Data Lineage Visualization ([http://localhost:8085](http://localhost:8085))
1. Open **[http://localhost:8085](http://localhost:8085)**.
2. Look at the **bottom-right corner** of the page and click the floating cyan button: **`Lineage Graph`**.
3. An interactive DAG will render, showing how raw staging tables (`stg_tms_defects`, `stg_train_movements`) flow through intermediate clustering logic (`int_joint_shadow_candidates`) to final analytics marts (`fct_ai_criticality_scores`, `fct_scheduled_blocks`).

---

### E. pgAdmin Database Inspection ([http://localhost:5050](http://localhost:5050))
1. Open **[http://localhost:5050](http://localhost:5050)**.
2. Sign in with:
   - **Email:** `admin@railblock.dev`
   - **Password:** `admin`
3. In the left navigation menu, expand:
   **Servers** $\to$ **RailBlock Database**
4. When prompted for password, enter: `postgres`.
5. Navigate to **Databases** $\to$ **`railblock`** $\to$ **Schemas** $\to$ **`public`** $\to$ **Tables** to view `users`, `sections`, `train_movements`, `maintenance_requests`, etc.
6. Right-click any table $\to$ **View/Edit Data** $\to$ **First 100 Rows** to see live rows.

---

## 5. Project Directory Anatomy

```text
RailBlock/
├── backend/                     # FastAPI Backend Application
│   ├── alembic/                 # Database schema migration scripts
│   ├── app/
│   │   ├── api/                 # REST API Routers (auth, blocks, optimizer, risk, events)
│   │   ├── core/                # JWT Auth, RBAC permissions, database connection
│   │   ├── models/              # SQLAlchemy ORM database models (9 tables)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Computational engines:
│   │   │   ├── gap_extractor.py       # Stage 3: Corridor idle slot finder
│   │   │   ├── clustering_service.py  # Stage 4: Joint shadow block bundler
│   │   │   ├── optimizer_service.py   # Stage 5: Google OR-Tools CP-SAT solver
│   │   │   ├── rescheduler_service.py # Stage 6: Real-time greedy rescheduler
│   │   │   └── ml_risk_engine.py      # Stage 2: XGBoost + SHAP scoring engine
│   │   └── main.py              # Application factory & middleware
│   ├── data/
│   │   ├── raw/                 # Indian Railways station markers & train datasets
│   │   └── ml_models/           # Serialized XGBoost model artifacts & SHAP background
│   ├── tests/                   # Automated pytest suite (118 backend tests)
│   └── Dockerfile               # Multi-stage container for backend
│
├── frontend/                    # Web User Interface
│   ├── src/                     # React components, pages, map views, TypeScript types
│   ├── package.json             # Frontend dependencies (React 18, Vite, Leaflet)
│   └── Dockerfile               # Production container for frontend
│
├── ml/                          # Dedicated Machine Learning Workspace
│   ├── data/                    # Synthetic hazard simulation dataset generator
│   ├── train.py                 # Monotone XGBoost/LightGBM model trainer
│   ├── evaluate.py              # Cross-validation & calibration benchmark
│   ├── explainer.py             # SHAP TreeExplainer & reasoning generator
│   └── tests/                   # ML tests (monotonicity, additivity, bounds)
│
├── dags/                        # Apache Airflow Pipeline DAGs
│   ├── nightly_cris_ingestion_dag.py   # Daily defect ingestion pipeline
│   ├── weekly_master_schedule_dag.py   # Weekly timetable capacity extractor
│   └── weekly_ml_retraining_dag.py     # Periodic model retraining pipeline
│
├── dbt/                         # dbt Data Transformation & Lineage
│   ├── models/                  # SQL data models (staging, intermediate, marts)
│   ├── dbt_project.yml          # dbt project configuration
│   └── profiles.yml             # Connection to PostgreSQL database
│
├── docs/                        # Specifications & Architecture Decision Records (ADRs)
├── docker-compose.yml           # Main Docker stack (Postgres, Backend, Frontend, pgAdmin)
├── docker-compose.airflow.yml   # Orchestration Docker stack (Airflow, Scheduler, dbt-docs)
└── README.md                    # Project documentation
```

---

## 6. Daily Management & Maintenance Commands

### Stop All Containers:
```bash
docker compose -f docker-compose.yml -f docker-compose.airflow.yml down
```

### Stop and Wipe Database (Clean Reset):
```bash
docker compose -f docker-compose.yml -f docker-compose.airflow.yml down -v
```

### View Live Logs:
```bash
# Backend logs
docker logs -f railblock-backend

# Frontend logs
docker logs -f railblock-frontend

# Airflow Scheduler logs
docker logs -f railblock-airflow-scheduler

# dbt docs logs
docker logs -f railblock-dbt-docs
```

### Run Automated Tests Inside Docker:
```bash
# Backend pytest suite (118 tests)
docker exec railblock-backend python -m pytest tests/ -v

# ML test suite (9 tests)
docker exec railblock-backend python -m pytest /opt/airflow/ml/tests/ -v
```

---

## 7. Troubleshooting & FAQs

### Q: Why do I get `OSError: [Errno 48] Address already in use` for port 8085 or 8080?
**A:** Docker is already serving Airflow on port 8080 and dbt docs on port 8085. You do not need to run `dbt docs serve` manually in your local terminal — just open [http://localhost:8085](http://localhost:8085) directly in your browser.

### Q: Why is a service marked "unhealthy" on startup?
**A:** PostgreSQL takes 5–10 seconds to initialize database tables and run healthchecks. The backend and Airflow automatically wait for PostgreSQL to become healthy before starting. Run `docker compose ps` to check container status.
