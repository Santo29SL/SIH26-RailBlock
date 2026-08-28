# SIH PS 26027: AI / ML Module Specification (Aswin's Scope)
## Stage 2: AI Risk & Criticality Scoring Engine ($CI \in [0, 100]$) & Explainable AI (SHAP)

---

## 1. System Overview & Objective

The goal of this module is to replace manual, subjective railway maintenance prioritization with an objective, data-driven **Criticality Index ($CI \in [0, 100]$)** using a **Two-Mode Scoring Architecture**:
1. **Mode 1 (Operational Baseline — Deployed):** A transparent, expert-weighted linear scoring formula with deterministic coefficients calibrated to Indian Railways domain guidelines.
2. **Mode 2 (Planning & Research — ML Upgrade Path):** Gradient Boosted Decision Trees (`XGBoost` / `LightGBM` / `CatBoost`) paired with **SHAP (SHapley Additive exPlanations)**, activated as historical defect-to-failure records accumulate post-pilot.

Both modes share identical semantic outputs ($CI \in [0, 100]$), enabling seamless downstream execution in Stage 4 (Clustering) and Stage 5 (OR-Tools CP-SAT).

### Architecture & Workflow

```mermaid
flowchart TD
    subgraph ML_OFFLINE ["🔬 ML Workspace (Aswin's Workspace: ml/)"]
        GEN[ml/data/synthetic_generator.py<br/><i>Realistic IR defect degradation data</i>]
        TRAIN[ml/train.py<br/><i>Train XGBoost & LightGBM with 5-fold CV</i>]
        EVAL[ml/evaluate.py<br/><i>Evaluate R², RMSE, MAE & feature importances</i>]
        EXPL[ml/explainer.py<br/><i>SHAP TreeExplainer & controller reasoning</i>]
        ART[backend/data/ml_models/criticality_xgboost_v2.joblib<br/><i>Exported Model Artifact</i>]
        GEN --> TRAIN --> EVAL --> EXPL --> ART
    end

    subgraph BACKEND_ONLINE ["⚡ Backend Inference (FastAPI: backend/app/)"]
        SVC[backend/app/services/ml_risk_engine.py<br/><i>joblib.load() & <2ms inference</i>]
        API[POST /api/v1/risk/predict<br/><i>FastAPI Endpoint for Controllers & Gantt</i>]
        ART -.-> SVC --> API
    end
```

---

## 2. Mathematical Formulation & Feature Specifications

### 2.1 Criticality Index Formula (Mode 1 & Ground Truth)
$$CI = w_1 \cdot \text{TGI\_Deviation} + w_2 \cdot \Delta v_{\text{SpeedRestriction}} + w_3 \cdot \text{DaysOverdue} + w_4 \cdot \text{SectionGMTDensity} + \text{DefectSeverityPenalty}$$

* **Severity Mapping:** The `DefectSeverityPenalty` term is strictly driven by the statutory Indian Railways USFD classification (`IMRW` and `OBSW` receive the highest penalties; `IMR` / `OBS` moderate; `Good` = 0).

### 2.2 Feature Specifications

| Feature Name | Type | Range / Values | Department | Description |
| :--- | :---: | :---: | :---: | :--- |
| **`tgi_deviation`** | `float` | `0.0` to `100.0` | Track (TMS) | Deviation from standard Track Geometry Index ($100 - \text{TGI}$) computed across Gauge, Cross-Level, Twist, Longitudinal Level, Alignment, and Curvature. |
| **`speed_restriction_kmh`**| `float` | `0.0` to `120.0` | All | Speed drop delta: $\text{MPS} - v_{\text{TSR}}$ (e.g. $110 - 30 = 80\text{ km/h}$). |
| **`days_overdue`** | `float` | `0.0` to `60.0` | All | Days elapsed past statutory maintenance deadline. |
| **`section_gmt_density`** | `float` | `5.0` to `150.0` | All | Annual Gross Million Tonnes carried by section (traffic density). |
| **`department_code`** | `int` | `0` (Track), `1` (Signal), `2` (Traction) | All | Department identifier code. |
| **`usfd_classification`** | `str` / `int` | `Good` (0), `OBS` (1), `OBSW` (2), `IMR` (3), `IMRW` (4) | Track (TMS) | Ultrasonic Flaw Detection category per IRPWM (T1 = IMR/IMRW, T2 = OBS/OBSW). |
| **`point_failure_risk`** | `float` | `0.0` to `100.0` | Signal (SMMS) | S&T Point machine electromechanical locking delay/failure probability. |
| **`ohe_insulator_wear`** | `float` | `0.0` to `100.0` | Traction (TDMS) | OHE contact wire stagger wear & insulator degradation percentage. |

---

## 3. Dedicated Workspace Structure (`ml/`)

All AI/ML development takes place inside the root **`ml/`** directory:

```
ml/
├── data/
│   └── synthetic_generator.py   # Generates domain-realistic IR degradation dataset
├── models/                      # Local model checkpoint storage
├── train.py                     # Standalone training script with Optuna / Hyperparameter tuning
├── evaluate.py                  # Benchmarking & cross-validation metrics (R², RMSE, MAE)
├── explainer.py                 # SHAP TreeExplainer & natural language reasoning templates
├── requirements-ml.txt          # Python dependencies for ML (xgboost, lightgbm, shap, etc.)
└── README.md                    # Quickstart instructions
```

---

## 4. Aswin's Deliverables & Action Items

### Deliverable 1: Domain-Realistic Dataset Generator (`ml/data/synthetic_generator.py`)
* Model realistic non-linear Indian Railways asset degradation curves:
  * **Track (TMS):** TGI decay rate (incorporating Curvature and Alignment), USFD flaw categorical spikes (`IMRW` / `IMR` $\to$ critical priority boost).
  * **Signal (SMMS):** Point locking latency ($>4.5\text{s}$ indicates imminent failure).
  * **Traction (TDMS):** OHE contact wire wear ($>65\%$ increases parting risk).
  * **Traffic Factor:** Higher GMT tracks amplify risk exponentially.
* Target dataset size: $\ge 5,000$ realistic samples with train/test/val splits.

### Deliverable 2: Model Training & Tuning Pipeline (`ml/train.py`)
* Train and compare regression models:
  1. **`XGBoostRegressor`**
  2. **`LGBMRegressor`** (LightGBM)
  3. **`CatBoostRegressor`** (Optional comparison)
* Perform 5-fold cross-validation and hyperparameter optimization.
* Target validation performance:
  * $R^2 \ge 0.95$
  * $\text{RMSE} \le 3.5$
  * $\text{MAE} \le 2.5$
* Export the final winning model artifact to **`backend/data/ml_models/criticality_xgboost_v2.joblib`**.

### Deliverable 3: SHAP Explainability & Reasoning Generator (`ml/explainer.py`)
* Initialize `shap.TreeExplainer` on the trained model.
* Extract exact positive and negative SHAP impact points for each feature.
* Generate human-readable explanation strings tailored for Section Controllers:
  * *Example (Critical):* `"Job rated 88.4/100 [CRITICAL]: Severe USFD rail flaw (IMRW) (+36.8 pts), 80 km/h speed restriction (+28.2 pts), and 14 days overdue on a 45.2 GMT track."`
  * *Example (Moderate):* `"Job rated 52.1/100 [MODERATE]: S&T point machine locking latency increased (+22.4 pts); recommended for bundling into joint shadow block."`

### Deliverable 4: Production Serving Clean-up (`backend/app/services/ml_risk_engine.py`)
* **Context:** The current `ml_risk_engine.py` contains a temporary bootstrap fallback (`_generate_synthetic_training_data()` and an inline `xgb.fit()` call) to prevent early server crashes if the model file was absent.
* **Action Required after Offline Training:**
  1. Once `ml/train.py` exports the production model artifact (`criticality_xgboost_v1.joblib` or `v2`), **remove the temporary inline training logic (`_generate_synthetic_training_data`) from `ml_risk_engine.py`**.
  2. Ensure `ml_risk_engine.py` functions as a pure, lightweight inference service that dynamically loads the model via `joblib.load(MODEL_PATH)` on startup and returns instant `<2ms` predictions.

---

## 5. Input & Output Data Contracts (API Integration)

The backend endpoint (`POST /api/v1/risk/predict`) and Gantt chart consume the model using this exact contract:

### Input Payload (`POST /api/v1/risk/predict`):
```json
{
  "request_code": "MR-TRK-104",
  "department": "TRACK",
  "activity_type": "RAIL_RENEWAL_USFD",
  "metadata": {
    "tgi_deviation": 82.5,
    "speed_restriction_kmh": 80.0,
    "days_overdue": 14,
    "section_gmt_density": 45.2,
    "usfd_classification": "IMRW",
    "point_failure_risk": 0.0,
    "ohe_insulator_wear": 0.0
  }
}
```

### Output Response (`200 OK`):
```json
{
  "request_code": "MR-TRK-104",
  "criticality_index": 88.4,
  "model_used": "catboost_shap_v2",
  "shap_explanation": {
    "base_value": 48.2,
    "feature_attributions": {
      "USFD Ultrasonic Rail Flaw (IMRW)": 36.8,
      "Temporary Speed Restriction (TSR)": 28.2,
      "Days Maintenance Overdue": 18.4,
      "Traffic GMT Density": 5.0,
      "Track Geometry Index (TGI) Deviation": 4.2
    },
    "human_readable_reasoning": "Job rated 88.4/100 primarily driven by USFD Ultrasonic Rail Flaw (IMRW) (+36.8), Temporary Speed Restriction (TSR) (+28.2), Days Maintenance Overdue (+18.4)."
  }
}
```

---

## 6. How to Run & Verify

1. **Install ML dependencies using `uv`:**
   ```bash
   uv pip install -r ml/requirements-ml.txt
   ```

2. **Generate synthetic data & train the model:**
   ```bash
   uv run python ml/train.py
   ```

3. **Evaluate performance metrics:**
   ```bash
   uv run python ml/evaluate.py
   ```

4. **Verify integration with backend test suite:**
   ```bash
   cd backend
   uv run pytest tests/test_ml_risk_engine.py -v
   ```

All tests should pass with 100% success!
