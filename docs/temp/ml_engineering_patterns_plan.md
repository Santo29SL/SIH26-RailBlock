# TASK: Implement verified ML engineering patterns for the Criticality Scoring Engine (ml/ + backend sync + doc sync)

## Context
This is the SIH 26027 railway maintenance-prioritization system. Stage 2 trains XGBoost on SYNTHETIC labels (simulated failure-within-30-days via a hazard function — not regression onto our own formula) and serves a Criticality Index (CI 0–100) plus probability-space SHAP explanations via FastAPI. An external research pass verified the engineering patterns below against official docs (XGBoost, LightGBM, SHAP, scikit-learn). Implement them exactly. Do not invent libraries, endpoints, or file formats beyond what is specified.

## Scope of files
- `ml/config.py` (NEW), `ml/data/synthetic_generator.py`, `ml/train.py`, `ml/evaluate.py`, `ml/explainer.py`, `ml/requirements-ml.txt`, tests under `ml/tests/` (NEW)
- `backend/app/services/ml_risk_engine.py` (pure inference + rule-based fallback)
- Pre-flight targets (PART 0): `backend/app/services/rescheduler.py`, `backend/app/services/adapters.py`, `backend/app/core/permissions.py`, `backend/app/services/optimizer.py`
- Doc-sync targets (CHANGE 10): the proposal markdown and the AI/ML spec markdown, if present in the workspace
- Canonical endpoint: `POST /api/v1/risk/predict`

## Global rules
- Python 3.12. Pin: `xgboost>=2.0`, `scikit-learn>=1.4`, `shap>=0.47`, `lightgbm>=4.3`, `numpy`, `pandas`, `joblib`, `pydantic>=2`.
- Every random operation uses the single `SEED` from `ml/config.py` (default 42). Same inputs → byte-identical artifacts and scores.
- USFD enum (ordinal, severity-increasing): `Good=0, OBS=1, OBSW=2, IMR=3, IMRW=4`. This exact map lives in `ml/config.py` and is exported into `enums.json`; `ml_risk_engine.py` reads it from the artifact (never redefines it). Other backend modules may import the same map from a shared constants module or `enums.json` — never hardcode a conflicting variant.
- Manual feature encoding in `train.py` with pandas (one-hot `department_code`; ordinal `usfd_flaw_severity`). Do NOT use ColumnTransformer/Pipeline — this keeps the monotone-constraint column mapping simple and avoids the known pipeline/feature-name failure mode (xgboost#9113).
- Keep CLI entry points: `python ml/train.py`, `python ml/evaluate.py`, `python ml/explainer.py --selftest`.

---

## PART 0 — PRE-FLIGHT VERIFICATION (run first; report results; apply fixes only where a check fails)

P1. **SLW correctness** (`rescheduler.py` + any SLW constants/advisory templates):
   - FORBIDDEN: `5.15` as a rule citation, a 45 km/h subsequent-train speed, `First Pilot Train MPS`, `telegraphic SLW advisory`, `siding holding orders`.
   - REQUIRED semantics: GR 3.68 + zonal SR 4.42 / SR 4.09 / SR Chapter 15; Form T/D 602; speeds: pilot 25 km/h (caution order), facing points/crossovers 15 km/h, subsequent trains at booked speed (40 km/h cap only for wrong-direction on automatic block). Freight holding = controller decision support, not a statutory instrument.
   - If any forbidden string or wrong speed exists, rewrite the affected constants/strings to the semantics above.

P2. **USFD enum** (adapters, schemas, validators, seeds):
   - FORBIDDEN: `REM`, a 0–3 USFD severity scale.
   - REQUIRED: ordinal `Good=0, OBS=1, OBSW=2, IMR=3, IMRW=4` (T1 = IMR/IMRW, T2 = OBS/OBSW per IRPWM). If a conflicting enum exists, replace it everywhere and update validation bounds to 0–4.

P3. **RBAC fifth role**: grep for `DIVISIONAL_AUTHORITY`. If absent, add it to `RoleEnum`/permissions with docstring: "Approval of traffic blocks > 4 hours and NI works > 3 days, per Railway Board letter dated 16.06.2022 (DRM ≤ 4 hr; GM sanction for NI ≤ 3 days)." Permission stub is sufficient (no new endpoints required).

P4. **Solver naming & import**: verify `optimizer.py` imports `ortools.sat.python.cp_model`. Update docstrings/README/comments from "MILP"/"CP-SAT MILP" to "OR-Tools CP-SAT (constraint programming)". Do not change solver logic.

P5. **Bootstrap audit** (`ml_risk_engine.py`): report whether `_generate_synthetic_training_data()` and/or inline `xgb.fit()`/`XGBRegressor` still exist (this informs CHANGE 7 — do not fix here).

---

## CHANGE 1 — `ml/config.py` (new file)
Create with: `SEED`; continuous feature list `["tgi_deviation","speed_restriction_kmh","days_overdue","section_gmt_density","point_failure_risk","ohe_insulator_wear"]`; categorical feature `["department_code"]`; `USFD_ENUM` map above; `BOUNDS` dict (tgi_deviation 0–100, speed_restriction_kmh 0–120, days_overdue 0–60, section_gmt_density 5–150, point_failure_risk 0–100, ohe_insulator_wear 0–100); `MONOTONE_POSITIVE` = the continuous features + `usfd_flaw_severity` (all constrained monotonically increasing); department dummies unconstrained. Also `ARTIFACT_DIR = "backend/data/ml_models/criticality_v1"` and the v1 rule-based CI weights (see CHANGE 8).

## CHANGE 2 — Label design: hazard outcome + domain randomization + label noise (`synthetic_generator.py`)
Rewrite the generator so:
1. Each row gets a true hazard probability `hazard_prob = sigmoid(logit_base + Σ β_k·f_k + Σ γ_ij·interaction_ij)` where interactions include at minimum: `usfd_flaw_severity × section_gmt_density`, `ohe_insulator_wear × section_gmt_density`, `point_failure_risk × days_overdue`.
2. **Domain randomization:** the coefficients (β, γ, logit_base) are themselves sampled from prior ranges per generator seed — the model must learn the family of regimes, not one draw.
3. Section-level latent regimes: each `section_id` has its own GMT regime and base-hazard offset; `section_id` is an output column (for GroupKFold) but **must never be a model feature**.
4. Binary label `failure_30d = Bernoulli(hazard_prob)`, then flip 2–5% of labels (configurable `--label-noise`).
5. Base rate lands in 5–15% positives; assert this in code.
6. Output a sidecar column `hazard_prob` for evaluation (NDCG graded relevance, Spearman). HARD RULE: `hazard_prob` and `section_id` are excluded from training features; assert this in `train.py`.
7. `--shift` mode regenerates with different parameter ranges (e.g., GMT restricted to [20,150], different base rate) for the robustness table.

## CHANGE 3 — Training (`train.py`)
1. Load features in fixed order; encode (one-hot department, ordinal USFD); save final column list to `schema.json`.
2. Splits: use `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)` with `groups=section_id` for OOF metrics. Reserve one full group-disjoint set of sections as the **dedicated calibration split** (never used for model selection or early stopping). No plain `KFold` or unstratified `train_test_split` anywhere.
3. Model: `xgb.XGBClassifier(objective="binary:logistic", tree_method="hist", max_bin=512, eval_metric="aucpr", monotone_constraints=<dict keyed by final column names; 1 for every MONOTONE_POSITIVE column; department dummies get 0>, early_stopping_rounds=30, random_state=SEED)`. Also train `lightgbm.LGBMClassifier(monotone_constraints=[...], monotone_constraints_method="intermediate")` for comparison.
4. Calibration: `CalibratedClassifierCV(best_model, method="isotonic", cv="prefit")` fitted ONLY on the dedicated calibration split.
5. CI map: predict calibrated probabilities on the calibration split, sort, store as `ci_map.json` (`{"sorted_p": [...]}`). Serving maps probability → CI via `100.0 * np.searchsorted(sorted_p, p, side="right") / len(sorted_p)`.
6. Save the artifact bundle (CHANGE 5).
7. Never claim SHAP monotonicity in any output.

## CHANGE 4 — Evaluation (`evaluate.py`)
Replace the old R²/RMSE/MAE targets entirely (the task is now binary prioritization). Produce `ml/reports/eval_report.md` containing:
1. **In-distribution table** (XGB vs LightGBM vs Rule-based v1 ablation): PR-AUC (`average_precision_score`, headline), precision@{10,25,50}, NDCG@{10,25,50} using `hazard_prob` as graded relevance, Spearman ρ vs `hazard_prob`. Each as mean and WORST fold across the 5 SGKF folds. No ROC-AUC.
2. **Ablation:** wrap the rule-based v1 CI (CHANGE 8 formula) as a scorer class with the same interface; its CI is used directly as the score for the same ranking metrics. The XGB-vs-Rule delta on precision@25 is the headline comparison.
3. **Calibration check:** decile table of predicted probability vs observed failure rate on the calibration split.
4. **Robustness:** (a) regime-shift table via `--shift` data; (b) label-noise degradation curve (0/2/5%).
5. Footer disclaimer, verbatim: "Trained on simulated labels only. No real IR failure data was used. Absolute CI values are not field probabilities until recalibrated on real labeled outcomes in a CRIS pilot."

## CHANGE 5 — Artifact bundle (replaces bare joblib)
`train.py` writes ONE directory `backend/data/ml_models/criticality_v1/`:
- `model.json` — via `booster.save_model()` (XGBoost native serialization)
- `calibrator.joblib` — the fitted isotonic calibrator
- `schema.json` — final feature order, dtypes, BOUNDS
- `enums.json` — USFD map, department map
- `ci_map.json` — frozen sorted calibration probabilities
- `background.npz` — 200 stratified calibration-split rows (for SHAP)
- `model_card.json` — schema inspired by SageMaker model cards: version, created_at, seeds, library versions, feature_order, generator parameter ranges, base rate, all eval metrics (mean/worst), shift table, noise curve, the simulated-labels disclaimer, and `artifact_sha256` = SHA-256 of `model.json`.
`ml_risk_engine.py` loads the bundle with validation: library-version check vs card, `len(feature_order) == booster.num_features()`, enum values validated against `enums.json`, one dummy row through model→calibrator→CI asserting finite output. Malformed/out-of-range inputs are rejected by Pydantic `Field(ge=, le=)` using BOUNDS — never silently clipped. **Legacy cleanup:** delete or ignore any stale `criticality_xgboost_v1.joblib` / `criticality_xgboost_v2.joblib` artifacts; the loader must never fall back to them.

## CHANGE 6 — SHAP serving (`explainer.py` + `ml_risk_engine.py`)
1. Build `shap.TreeExplainer(booster, data=<background from background.npz>, model_output="probability", feature_perturbation="interventional")` ONCE at FastAPI startup. Never per request; never pickled.
2. Attributions are in PROBABILITY space: `base_value + Σ attributions ≈ calibrated predict_proba`. Guard with `explainer.assert_additivity` in tests (tolerance 1e-3).
3. Response contract (`POST /api/v1/risk/predict`) — replace any prior example with exactly this shape:
```json
{
  "request_code": "MR-TRK-104",
  "failure_probability": 0.61,
  "criticality_index": 88.0,
  "model_used": "xgb_isotonic_ci_v1",
  "shap_explanation": {
    "space": "probability",
    "base_value": 0.08,
    "feature_attributions": {
      "USFD rail flaw (IMR)": 0.21,
      "Speed restriction delta (80 km/h)": 0.14,
      "Days overdue (14)": 0.09,
      "Section GMT density (45.2)": 0.06,
      "TGI deviation (82.5)": 0.03
    },
    "human_readable_reasoning": "Base failure rate 8%. USFD IMR flaw +21 pts, 80 km/h TSR +14, 14 days overdue +9, heavy-freight section +6, TGI deviation +3 → 61% simulated 30-day failure probability; CI 88 = riskier than 88% of the current backlog."
  }
}
```
4. `GET /api/v1/risk/model-info` returns the model card JSON.

## CHANGE 7 — Backend fallback (`ml_risk_engine.py`)
- If PART 0 P5 found `_generate_synthetic_training_data()` or inline training, **delete it permanently**. If it was already removed and a rule-based fallback exists, refactor it to the contract below instead of duplicating.
- Implement `rule_based_ci(features) -> (ci, parts)` = the v1 linear formula with the severity term mapped to USFD classes (IMRW 35 > IMR 25 > OBSW 10 > OBS 5 > Good 0).
- If the artifact bundle is missing or fails validation, return CI from the rule with `model_used: "rule_based_v1"` (HTTP 200, flagged in response) — the API must never train or crash at request time.

## CHANGE 8 — Rule-based v1 definition (used for fallback + ablation; put weights in `ml/config.py`)
`CI = 0.30·tgi_deviation + 0.25·speed_restriction_kmh/1.2 + 0.20·min(days_overdue,60)/60·100 + 0.15·section_gmt_density/1.5 + severity_penalty` where severity_penalty ∈ {0 Good, 5 OBS, 10 OBSW, 25 IMR, 35 IMRW}, clipped to [0,100]. Weights are stated as engineering assumptions pending domain calibration.

## CHANGE 9 — Tests (`ml/tests/`)
1. `test_additivity.py`: for 50 random rows, `base + Σφ ≈ predict_proba` within 1e-3.
2. `test_monotonicity.py`: sweep each monotone feature across BOUNDS with others fixed; calibrated probability never decreases.
3. `test_fallback.py`: hide the artifact dir → endpoint returns 200 with `model_used="rule_based_v1"`.
4. `test_bounds.py`: out-of-range payload → Pydantic 422, not a score.
5. `test_no_leakage.py`: assert `section_id`/`hazard_prob` not in training columns.

## CHANGE 10 — DOC SYNC (only for the files present in the workspace)

10a. **AI/ML spec markdown (Aswin's scope)** — apply if found:
   - Retitle the CI formula section: "v1 Rule-Based CI (evaluation baseline & deterministic fallback)".
   - Add the labeling-strategy paragraph: label = simulated 30-day failure outcome from a hazard function with feature interactions and domain randomization; NOT regression onto the formula.
   - Replace R²/RMSE/MAE targets with the binary prioritization evaluation protocol (PR-AUC headline, precision@K, NDCG@K, Spearman, mean/worst fold, shift + noise robustness).
   - Replace the USFD feature enum (remove `REM`, 0–3) with `Good=0, OBS=1, OBSW=2, IMR=3, IMRW=4`.
   - Replace the SHAP output example with the probability-space contract from CHANGE 6 (base 0.08, attributions summing to failure_probability 0.61).
   - Rename `/risk/score` → `/risk/predict`; rename artifact references to the `criticality_v1` bundle.

10b. **Proposal markdown** — apply ONLY these two bullet replacements:
   - Replace the "**Two-Mode Scoring Engine**" bullet (currently stating v1 rule-based deployed / v2 XGBoost upgrade path) with:
     "* **Two-Mode Scoring Engine:** The deployed primary (v2) is an XGBoost/LightGBM model trained on simulated degradation-failure outcomes from the Synthetic Seed Sandbox (hazard-based labels with domain randomization), isotonic-calibrated and served with probability-space SHAP attributions. The deterministic fallback and ablation baseline (v1) is a transparent expert-weighted linear CI used when the model artifact is unavailable and as the comparison baseline in evaluation. Both modes are retrained/recalibrated on real labeled outcomes once a CRIS pilot accrues failure history; the API contract is identical across modes."
   - Replace the "**Severity Mapping**" bullet with:
     "* **Severity Mapping:** The severity term is driven by the USFD classification ordinal (Good=0 < OBS=1 < OBSW=2 < IMR=3 < IMRW=4, per IRPWM T1/T2 tabulation), with IMR/IMRW (T1) receiving the highest penalties."

---

## SELF-CHECK (run after all edits; fix every hit, then re-run until clean)

Forbidden strings anywhere in `ml/`, `ml_risk_engine.py`, and the Part 0 / CHANGE 10 target files:
- `R²` / `R2` / `rmse` / `MAE` (as targets — the task is binary now)
- `REM` / `0 to 3` (USFD context)
- `risk/score`
- `_generate_synthetic_training_data`
- `XGBRegressor` or `.fit(` inside `ml_risk_engine.py`
- `roc_auc`
- `KFold(` or `train_test_split(` in `train.py`
- `joblib.dump(explainer` / pickling the explainer
- `section_id` or `hazard_prob` inside the training-feature list
- `Rule 5.15` / `45 km/h` (SLW context) / `First Pilot Train MPS` / `telegraphic SLW`
- `criticality_xgboost_v1.joblib` / `criticality_xgboost_v2.joblib` (any live reference)

Required strings (must appear):
- `StratifiedGroupKFold` and `groups=`
- `monotone_constraints` and `max_bin=512`
- `CalibratedClassifierCV` and `cv="prefit"`
- `model_output="probability"` and `feature_perturbation="interventional"`
- `average_precision_score`, `ndcg_score`, `searchsorted`
- `model.json`, `calibrator.joblib`, `schema.json`, `enums.json`, `ci_map.json`, `background.npz`, `model_card.json`
- `save_model`, `sha256`
- `OBSW` and `IMRW`
- `rule_based_v1` and `rule_based_ci`
- `simulated labels`
- `criticality_v1`
- `GR 3.68` and `T/D 602` (rescheduler)
- `DIVISIONAL_AUTHORITY` (permissions, if P3 fix was applied or it already existed)
- `Two-Mode Scoring Engine` (proposal doc, new wording)
