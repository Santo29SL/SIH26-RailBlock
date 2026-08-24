# 🚆 AI-Powered Railway Maintenance Block Planner

An AI-assisted railway maintenance scheduling system designed to **automatically coordinate maintenance activities across Track, Signalling, and Traction departments while minimizing disruption to train operations**.

> **SIH Problem Statement:** AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 📌 Overview

Railway infrastructure requires regular maintenance of:

* 🛤️ Tracks and rails
* 🚦 Signalling systems
* ⚡ Traction/OHE infrastructure

Different departments may independently request maintenance blocks for the same railway section. This can result in unnecessary blocks, increased asset downtime, and disruption to train operations.

This project proposes a centralized intelligent system that combines maintenance requests with railway network and train movement data to generate an **optimized maintenance-block schedule**.

### Core idea

```text
Maintenance Data
       +
Train Movement Data
       +
Railway Network
       +
Maintenance Constraints
       ↓
AI / Optimization Engine
       ↓
Optimal Maintenance Blocks
       ↓
Minimum Train Disruption
```

---

## 🎯 Objectives

The system aims to:

* Coordinate maintenance requests from multiple departments.
* Identify maintenance activities that can potentially be grouped.
* Find suitable maintenance windows based on train traffic.
* Respect maintenance deadlines and durations.
* Consider resource and compatibility constraints.
* Minimize train disruption.
* Minimize unnecessary maintenance blocks.
* Reduce asset downtime.
* Maximize railway infrastructure availability.

---

## 🏗️ System Architecture

```text
                  ┌─────────────────────┐
                  │    Railway Data     │
                  │                     │
                  │ TMS / SMMS / TDMS   │
                  │ Train Timetable     │
                  │ Railway Network     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Apache Airflow    │
                  │  Workflow Pipeline  │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Data Processing   │
                  │  Pandas / Python    │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   ML Prediction     │
                  │ Train Impact/Risk   │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   OR-Tools          │
                  │ Optimization Engine │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │     PostgreSQL      │
                  │      Database       │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │      FastAPI        │
                  │     Backend API     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    React Frontend   │
                  │ Dashboard / Map /   │
                  │ Gantt / Analytics   │
                  └─────────────────────┘
```

---

## 🧩 Technology Stack

| Component              | Technology        |
| ---------------------- | ----------------- |
| Backend                | Python, FastAPI   |
| Database               | PostgreSQL        |
| Data Processing        | Pandas, NumPy     |
| Optimization           | Google OR-Tools   |
| Machine Learning       | Scikit-learn      |
| Workflow Orchestration | Apache Airflow    |
| Frontend               | React             |
| Visualization          | Recharts          |
| Maps                   | Leaflet           |
| Containerization       | Docker            |
| API Documentation      | OpenAPI / Swagger |

---

## 📂 Project Structure

```text
railway-block-planner/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   └── services/
│   │
│   ├── tests/
│   └── requirements.txt
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── synthetic/
│
├── ml/
│   ├── notebooks/
│   ├── models/
│   └── scripts/
│
├── airflow/
│   ├── dags/
│   └── plugins/
│
├── frontend/
│
├── docs/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔄 How It Works

### 1. Maintenance Requests

The system receives maintenance requirements from different railway departments.

Example:

```text
M001
Department: Track
Section: SEC_A
Duration: 120 minutes
Priority: HIGH
Deadline: 28-Aug-2026
```

```text
M002
Department: Signal
Section: SEC_A
Duration: 60 minutes
Priority: MEDIUM
Deadline: 28-Aug-2026
```

```text
M003
Department: Traction
Section: SEC_A
Duration: 120 minutes
Priority: HIGH
Deadline: 29-Aug-2026
```

---

### 2. Data Integration

Maintenance requests from Track, Signalling, and Traction systems are converted into a common structure.

```text
TMS  ─────┐
          │
SMMS ─────┼──→ Unified Maintenance Data
          │
TDMS ─────┘
```

---

### 3. Train Impact Calculation

The system checks train movements for the affected railway section.

For example:

```text
SEC_A

10:00 → Train 1
10:20 → Train 2
10:40 → Train 3

14:00 → Train 4
15:00 → Train 5
```

A block from:

```text
10:00 – 12:00
```

would have greater operational impact than:

```text
14:00 – 16:00
```

if the latter period has fewer train movements.

---

### 4. Maintenance Grouping

The system identifies maintenance activities that occur on the same section and can potentially be performed together.

```text
SEC_A
│
├── Track Repair
├── Signal Inspection
└── OHE Maintenance
```

Compatible jobs may be grouped into a common block subject to configured constraints.

---

### 5. Optimization

Google OR-Tools is used to find an efficient schedule.

The optimizer considers:

* Maintenance duration
* Deadlines
* Train traffic
* Number of blocks
* Resource availability
* Maintenance compatibility
* Asset downtime

The objective is to minimize the overall operational cost.

Conceptually:

```text
Total Cost =

Train Disruption
+ Maintenance Delay
+ Number of Blocks
+ Asset Downtime
```

---

### 6. Recommended Block

The system generates a recommendation such as:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━
     RECOMMENDED BLOCK
━━━━━━━━━━━━━━━━━━━━━━━━━━

Section: SEC_A

Time:
14:00 – 16:00

Maintenance:
✓ Track Repair
✓ Signal Inspection
✓ OHE Inspection

Train Impact:
LOW

Maintenance Jobs:
3

Status:
RECOMMENDED
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 🤖 AI / ML Component

Machine learning will be used as an additional prediction layer.

Potential features include:

* Railway section
* Time of day
* Day of week
* Number of trains
* Train type
* Historical delay
* Maintenance duration
* Block duration

The model can estimate:

```text
Expected Train Delay
        ↓
Expected Operational Impact
```

This prediction can then be supplied to the optimization engine.

### ML Pipeline

```text
Historical Data
      ↓
Data Cleaning
      ↓
Feature Engineering
      ↓
ML Model
      ↓
Impact Prediction
      ↓
OR-Tools Optimizer
```

Initial models may include:

* Random Forest
* Gradient Boosting

---

# 🔄 Apache Airflow

Apache Airflow will orchestrate the complete data pipeline.

Airflow is **not the optimization algorithm**.

Its responsibility is to execute and monitor the workflow.

```text
Fetch Data
    ↓
Validate Data
    ↓
Clean Data
    ↓
Transform Data
    ↓
Feature Engineering
    ↓
ML Prediction
    ↓
Run Optimizer
    ↓
Save Results
```

### Responsibilities

| Component    | Responsibility         |
| ------------ | ---------------------- |
| Airflow      | Workflow orchestration |
| Pandas       | Data processing        |
| Scikit-learn | Prediction             |
| OR-Tools     | Optimization           |
| PostgreSQL   | Data storage           |
| FastAPI      | Backend/API            |
| React        | Visualization          |

---

# 🗄️ Database

The initial PostgreSQL database will contain tables such as:

```text
sections
maintenance_requests
trains
train_movements
resources
compatibility_rules
blocks
block_jobs
```

### Example relationship

```text
Section
   │
   ├── Maintenance Request
   │
   ├── Train Movement
   │
   └── Maintenance Block
```

---

# 📊 Data Sources

The project will combine multiple types of data.

### Indian Railway Open Data

Public railway datasets can be used for:

* Train timetables
* Railway stations
* Railway network information
* Train operating statistics

### Maintenance / Research Datasets

Public railway maintenance and track-defect datasets can be used for experimentation and ML.

### Synthetic TMS / SMMS / TDMS Data

Actual department-level TMS/SMMS/TDMS operational data is not expected to be publicly available.

Therefore, the prototype will generate synthetic maintenance records following the expected structure of these systems.

> Synthetic data will be clearly identified as synthetic and will not be represented as actual Indian Railways operational data.

---

# 🚀 Development Roadmap

### Phase 1 — Backend

* [x] Define project architecture
* [ ] Setup GitHub repository
* [ ] Setup PostgreSQL
* [ ] Setup FastAPI
* [ ] Create database models
* [ ] Create CRUD APIs

### Phase 2 — Optimization

* [ ] Build train impact engine
* [ ] Build maintenance grouping
* [ ] Add deadline constraints
* [ ] Add compatibility rules
* [ ] Integrate OR-Tools
* [ ] Generate optimized blocks
* [ ] Add optimization API

### Phase 3 — Machine Learning

* [ ] Prepare training data
* [ ] Feature engineering
* [ ] Train impact prediction model
* [ ] Evaluate model
* [ ] Integrate ML with optimizer

### Phase 4 — Airflow

* [ ] Setup Airflow
* [ ] Create ingestion DAG
* [ ] Create preprocessing tasks
* [ ] Add ML task
* [ ] Add optimization task
* [ ] Store generated schedules

### Phase 5 — Frontend

* [ ] Setup React
* [ ] Dashboard
* [ ] Maintenance management
* [ ] Railway map
* [ ] Gantt chart
* [ ] Optimization results
* [ ] What-if simulation

### Phase 6 — Final Integration

* [ ] Backend + ML integration
* [ ] Airflow + backend integration
* [ ] Frontend + API integration
* [ ] Testing
* [ ] Performance testing
* [ ] Documentation
* [ ] Final demo

---

# 🛠️ Local Development

## Requirements

Install:

* Python 3.11+
* Docker Desktop
* Git
* Node.js (for frontend, later)

---

## Clone Repository

```bash
git clone <repository-url>
cd railway-block-planner
```

---

## Start PostgreSQL

```bash
docker compose up -d
```

---

## Backend Setup

### macOS / Linux

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

### Windows

```powershell
cd backend

python -m venv .venv
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/railway_planner
API_HOST=127.0.0.1
API_PORT=8000
```

> `.env` should never be committed to GitHub.

---

## Run FastAPI

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

---

# 🌿 Git Workflow

The project uses feature branches.

```text
main
 │
 └── develop
      │
      ├── feature/backend
      ├── feature/optimizer
      ├── feature/ml
      ├── feature/airflow
      └── feature/frontend
```

Create a feature branch:

```bash
git checkout -b feature/backend
```

Commit changes:

```bash
git add .
git commit -m "feat: add maintenance API"
```

Push:

```bash
git push -u origin feature/backend
```

Create a Pull Request into `develop`.

---

# 🧪 Testing

Tests will be written using `pytest`.

Run:

```bash
pytest
```

Important test cases include:

```text
✓ Maintenance duration is respected
✓ Deadlines are not violated
✓ Incompatible jobs are not grouped
✓ Resource conflicts are avoided
✓ Correct railway section is selected
✓ Train impact is calculated correctly
✓ Optimizer selects a lower-impact valid schedule
```

---

# 🔐 Safety and Data Disclaimer

This is a **research and hackathon prototype**.

The generated schedules are simulations and must not be used for real railway operations.

A production railway deployment would require:

* Official railway operational data
* Validated infrastructure information
* Official maintenance rules
* Railway-approved safety constraints
* Real-time operational integration
* Extensive testing and validation
* Authorization from the appropriate railway authorities

---

# 👥 Team Development

The project is designed for collaborative development.

Suggested responsibilities:

| Area         | Responsibility                   |
| ------------ | -------------------------------- |
| Backend      | FastAPI, PostgreSQL, APIs        |
| Optimization | OR-Tools, scheduling constraints |
| Data / ML    | Datasets, preprocessing, ML      |
| Airflow      | Pipeline orchestration           |
| Frontend     | React, map, dashboard, Gantt     |

---

# 📌 Current Status

🚧 **Project under active development**

The current focus is on:

```text
PostgreSQL
    ↓
FastAPI
    ↓
Database Models
    ↓
CRUD APIs
    ↓
Train Impact Engine
    ↓
OR-Tools Optimization
```

Airflow and the React frontend will be integrated after the core backend and optimization engine are stable.

---

## 💡 Core Concept

The project can be summarized as:

```text
             MAINTENANCE REQUESTS
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
      TRACK         SIGNAL       TRACTION
        │             │             │
        └─────────────┼─────────────┘
                      ↓
               DATA INTEGRATION
                      +
               TRAIN MOVEMENTS
                      +
              RAILWAY NETWORK
                      ↓
              AI / ML ANALYSIS
                      ↓
               OR-TOOLS SOLVER
                      ↓
             OPTIMAL BLOCK PLAN
                      ↓
             LESS TRAIN DISRUPTION
                      ↓
             BETTER ASSET AVAILABILITY
```

**Built as a research prototype for intelligent railway maintenance scheduling and automated block planning.**
