"""Domain-Realistic Indian Railways Defect Dataset Generator.

Generates 6,000+ synthetic maintenance defect records grounded in Indian Railways track standards (IRPWM),
statutory G&SR safety rules, and real IR traffic parameters (GMT density, speed restrictions, USFD flaws,
S&T point latencies, and TRD OHE wire wear limits).

Incorporates:
1. Statutory USFD defect classes: Good (0), OBS (1), OBSW (2), IMR (3), IMRW (4) per IRPWM.
2. Track Geometry Index (TGI) derivation from TRC sub-indices (Gauge, Unevenness, Twist, Alignment, Curvature).
3. Non-linear physical hazard compound rules (IMRW safety floors, high GMT compounding, OHE wear limits).
"""

from __future__ import annotations

import logging
import os
from enum import IntEnum
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = os.path.dirname(__file__)
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "ir_defects_dataset.csv")


class USFDClassification(IntEnum):
    """Statutory USFD defect classifications per Indian Railways P-Way Manual (IRPWM)."""
    GOOD = 0   # Healthy rail / weld
    OBS = 1    # Observed Rail Flaw (T2 category — periodic monitoring)
    OBSW = 2   # Observed Weld Flaw (T2 category — periodic monitoring)
    IMR = 3    # Immediate Removal Rail (T1 category — urgent possession & renewal)
    IMRW = 4   # Immediate Removal Weld (T1 category — critical fracture hazard)


def generate_ir_defects_dataset(n_samples: int = 6000, random_seed: int = 42) -> pd.DataFrame:
    """Generate domain-grounded synthetic dataset for Indian Railways defect criticality scoring."""
    np.random.seed(random_seed)

    logger.info(f"Generating {n_samples} synthetic IR defect samples with statutory USFD and TGI modeling...")

    # 1. Department selection (0: TRACK, 1: SIGNAL, 2: TRACTION)
    dept = np.random.choice([0, 1, 2], n_samples, p=[0.45, 0.30, 0.25])

    # 2. Track Geometry Index (TGI) & Curvature modeling
    # Synthesizing realistic TRC sub-indices (higher is better, 0-100 scale, standard ~ 70-90)
    # Curvature degree D (0.0 to 6.0 degrees)
    curvature_deg = np.random.exponential(scale=1.2, size=n_samples)
    curvature_deg = np.clip(curvature_deg, 0.0, 6.0)

    # Sharp curves (> 2 deg) accelerate alignment and twist degradation
    curve_penalty = np.where(curvature_deg > 2.0, (curvature_deg - 2.0) * 8.0, 0.0)

    ui = np.clip(np.random.normal(78.0, 12.0, n_samples) - (0.5 * curve_penalty), 10.0, 100.0)  # Unevenness
    ti = np.clip(np.random.normal(82.0, 10.0, n_samples) - (0.8 * curve_penalty), 10.0, 100.0)  # Twist
    gi = np.clip(np.random.normal(85.0, 9.0, n_samples) - (0.6 * curve_penalty), 10.0, 100.0)   # Gauge
    ai = np.clip(np.random.normal(75.0, 14.0, n_samples) - (1.2 * curve_penalty), 10.0, 100.0)  # Alignment
    ci_curv = np.clip(100.0 - (curvature_deg * 12.0) + np.random.normal(0, 5, n_samples), 10.0, 100.0)

    # Standard IRPWM TGI formula weighted with curvature
    tgi_score = (2.0 * ui + ti + gi + 6.0 * ai + 2.0 * ci_curv) / 12.0
    tgi_deviation = np.clip(100.0 - tgi_score, 0.0, 100.0)

    # 3. Operational & Traffic parameters
    speed_rest = np.random.uniform(0.0, 100.0, n_samples)  # Delta v in km/h
    days_overdue = np.clip(np.random.exponential(scale=10.0, size=n_samples), 0.0, 60.0)
    gmt = np.random.uniform(5.0, 150.0, n_samples)

    # 4. Department-specific indicators
    # USFD classification for Track (TMS): Good (0), OBS (1), OBSW (2), IMR (3), IMRW (4)
    usfd_classes = [
        USFDClassification.GOOD.value,
        USFDClassification.OBS.value,
        USFDClassification.OBSW.value,
        USFDClassification.IMR.value,
        USFDClassification.IMRW.value,
    ]
    usfd_probs = [0.40, 0.25, 0.15, 0.12, 0.08]
    usfd = np.where(dept == 0, np.random.choice(usfd_classes, n_samples, p=usfd_probs), USFDClassification.GOOD.value)

    point_risk = np.where(dept == 1, np.random.uniform(0.0, 100.0, n_samples), 0.0)
    ohe_wear = np.where(dept == 2, np.random.uniform(0.0, 100.0, n_samples), 0.0)

    # 5. Base linear combination
    # USFD penalty term lookup
    usfd_penalties = np.zeros(n_samples)
    usfd_penalties[usfd == USFDClassification.OBS.value] = 15.0
    usfd_penalties[usfd == USFDClassification.OBSW.value] = 22.0
    usfd_penalties[usfd == USFDClassification.IMR.value] = 35.0
    usfd_penalties[usfd == USFDClassification.IMRW.value] = 45.0

    ci_raw = (
        0.25 * tgi_deviation
        + 0.20 * speed_rest
        + 1.10 * days_overdue
        + 0.10 * gmt
        + usfd_penalties
        + 0.18 * point_risk
        + 0.18 * ohe_wear
    )

    # 6. Non-linear statutory physical hazard rules:
    # Rule A: IMRW (Immediate Removal Weld) flaw imposes strict safety floor of 88.0
    imrw_mask = (usfd == USFDClassification.IMRW.value)
    ci_raw[imrw_mask] = np.maximum(88.0, ci_raw[imrw_mask])

    # Rule B: IMR (Immediate Removal Rail) flaw imposes strict safety floor of 80.0
    imr_mask = (usfd == USFDClassification.IMR.value)
    ci_raw[imr_mask] = np.maximum(80.0, ci_raw[imr_mask])

    # Rule C: Severe days overdue (> 30 days) on high traffic density (> 60 GMT) compound risk
    overdue_gmt_compound = (days_overdue > 30.0) & (gmt > 60.0)
    ci_raw[overdue_gmt_compound] += 18.0

    # Rule D: S&T point risk > 80% on high GMT track causes high signal failure risk
    signal_high_risk = (dept == 1) & (point_risk > 80.0) & (gmt > 50.0)
    ci_raw[signal_high_risk] += 15.0

    # Rule E: OHE wire wear > 70% (nearing condemnation limit) causes high dewirement risk
    ohe_high_wear = (dept == 2) & (ohe_wear > 70.0)
    ci_raw[ohe_high_wear] += 14.0

    # Add minor Gaussian noise
    noise = np.random.normal(0.0, 1.5, n_samples)
    ci = np.clip(ci_raw + noise, 0.0, 100.0)
    ci = np.round(ci, 2)

    df = pd.DataFrame(
        {
            "tgi_deviation": np.round(tgi_deviation, 2),
            "speed_restriction_kmh": np.round(speed_rest, 2),
            "days_overdue": np.round(days_overdue, 2),
            "section_gmt_density": np.round(gmt, 2),
            "department_code": dept.astype(int),
            "usfd_classification": usfd.astype(int),
            "point_failure_risk": np.round(point_risk, 2),
            "ohe_insulator_wear": np.round(ohe_wear, 2),
            "criticality_index": ci,
        }
    )

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    logger.info(f"✅ Generated {len(df)} samples and saved to {OUTPUT_CSV}")
    return df


if __name__ == "__main__":
    generate_ir_defects_dataset()
