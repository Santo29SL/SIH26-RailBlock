# RailBlock Stage 2: AI Risk & Criticality Scoring Engine Evaluation Report

## Executive Summary
- **Primary Model:** Monotone-Constrained XGBoost Classifier + Post-Hoc Isotonic Calibration
- **Evaluation Protocol:** 5-Fold StratifiedGroupKFold cross-validation grouped by `section_id` (40 train sections, 10 dedicated calibration sections).
- **Headline Delta:** XGBoost vs v1 Rule-Based baseline on **Precision@25**: `19.4%` vs `18.5%` (**Δ = +0.9%** absolute boost).

---

## 1. In-Distribution Cross-Validation Benchmark

| Model / Metric | PR-AUC (Mean / Worst) | Precision@10 | Precision@25 | Precision@50 | NDCG@10 | NDCG@25 | NDCG@50 | Spearman ρ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost** | **0.2270** / `0.2041` | `26.5%` / `21.9%` | `19.4%` / `15.8%` | `15.5%` / `12.5%` | `0.9045` | `0.9243` | `0.9492` | `0.8905` |
| **LightGBM** | **0.2154** / `0.1807` | `26.8%` / `21.9%` | `19.4%` / `15.0%` | `15.8%` / `13.7%` | `0.8828` | `0.9080` | `0.9358` | `0.8603` |
| **Rule-based v1** | **0.2060** / `0.1718` | `23.6%` / `18.8%` | `18.5%` / `15.6%` | `15.0%` / `12.0%` | `0.8745` | `0.8765` | `0.9097` | `0.7551` |

> **Note on Ranking Graded Relevance:** NDCG@{10,25,50} and Spearman $\rho$ are computed against the continuous ground-truth latent `hazard_prob`.

---

## 2. Post-Hoc Isotonic Calibration Verification (Dedicated Split)

| Decile | Sample Count | Mean Predicted Probability | Observed Failure Rate | Absolute Gap |
| :---: | :---: | :---: | :---: | :---: |
| 1 | 154 | 0.0382 | 0.0260 | 0.0122 |
| 2 | 247 | 0.0518 | 0.0648 | 0.0130 |
| 3 | 64 | 0.0518 | 0.0312 | 0.0206 |
| 4 | 127 | 0.0815 | 0.0709 | 0.0107 |
| 5 | 239 | 0.1240 | 0.1297 | 0.0057 |
| 6 | 104 | 0.1346 | 0.1346 | 0.0000 |
| 7 | 136 | 0.2531 | 0.2574 | 0.0043 |
| 8 | 78 | 0.4177 | 0.4103 | 0.0075 |

---

## 3. Robustness & Generalization Analysis

### 3.1 Covariate Regime-Shift (Heavy-Freight Corridor Shift)
- **Shifted Dataset Base Rate:** `50.6%` (elevated traffic and asset degradation).
- **Shifted PR-AUC:** `0.7242`
- **Shifted Precision@25:** `77.7%`
- **Shifted NDCG@25:** `0.9536`
- **Shifted Spearman ρ:** `0.9135`

### 3.2 Label-Noise Degradation Curve

| Injected Label Noise | PR-AUC | Precision@25 | Performance Retention |
| :---: | :---: | :---: | :---: |
| **0% (Clean)** | `0.2442` | `20.4%` | `100.0%` |
| **2% Noise** | `0.1515` | `15.0%` | `62.0%` |
| **5% Noise** | `0.2415` | `23.2%` | `98.9%` |

---

## Disclaimer
Trained on simulated labels only. No real IR failure data was used. Absolute CI values are not field probabilities until recalibrated on real labeled outcomes in a CRIS pilot.
