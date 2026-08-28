# Two-Mode AI Risk Scoring Architecture with Probability-Space SHAP and Hazard Simulation

We implement a Two-Mode AI Risk & Criticality Scoring Architecture ($CI \in [0, 100]$):
1. **Mode 2 (Deployed Primary):** Monotone-constrained Gradient Boosted Trees (`XGBoost` / `LightGBM`) trained on simulated 30-day failure hazard outcomes with domain randomization and feature interactions (`usfd × GMT`, `OHE × GMT`, `point × overdue`), post-hoc isotonic-calibrated, and served with interventional probability-space **SHAP (SHapley Additive exPlanations)** attributions satisfying:
   $$\text{base} + \sum_{i=1}^M \phi_i \approx P(\text{failure}_{30\text{d}})$$
2. **Mode 1 (Deterministic Fallback & Evaluation Baseline):** A transparent expert-weighted linear formula calibrated to IRPWM guidelines incorporating the **Availability-Impact Dimension** ($\text{MPS} - v_{\text{TSR}}$):
   $$CI = 0.30 \cdot \text{TGI} + 0.25 \cdot \frac{\Delta v_{\text{TSR}}}{1.2} + 0.20 \cdot \frac{\min(\text{Overdue}, 60)}{60} \cdot 100 + 0.15 \cdot \frac{\text{GMT}}{1.5} + \text{Penalty}$$
   where $\text{Penalty} \in \{\text{Good}: 0, \text{OBS}: 5, \text{OBSW}: 10, \text{IMR}: 25, \text{IMRW}: 35\}$.

Relying solely on black-box ML risks service unavailability if model checkpoints are uninitialized, while pure linear scoring cannot capture non-linear degradation physics or multi-asset compounding risks. By coupling monotone boosting with isotonic calibration and probability-space SHAP, we achieve monotonic safety guarantees, game-theoretic explainability, and zero-downtime deterministic fallback.
