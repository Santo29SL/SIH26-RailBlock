"""Domain-Realistic Indian Railways Defect Dataset Generator.

Generates 5,000+ synthetic maintenance defect records grounded in Indian Railways track standards (IRPWM),
statutory G&SR safety rules, and real IR traffic parameters (GMT density, speed restrictions, USFD flaws,
S&T point latencies, and TRD OHE wire wear limits).
"""

import os
import logging
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = os.path.dirname(__file__)
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "ir_defects_dataset.csv")

def generate_ir_defects_dataset(n_samples: int = 6000, random_seed: int = 42) -> pd.DataFrame:
    """Generate domain-grounded synthetic dataset for Indian Railways defect criticality scoring."""
    np.random.seed(random_seed)

    logger.info(f"Generating {n_samples} synthetic IR defect samples...")

    # Feature distributions
    tgi = np.random.uniform(0.0, 100.0, n_samples)
    speed_rest = np.random.uniform(0.0, 100.0, n_samples)
    days_overdue = np.random.exponential(scale=10.0, size=n_samples)
    days_overdue = np.clip(days_overdue, 0.0, 60.0)

    gmt = np.random.uniform(5.0, 150.0, n_samples)
    dept = np.random.choice([0, 1, 2], n_samples, p=[0.45, 0.30, 0.25])  # 0: TRACK, 1: SIGNAL, 2: TRACTION

    # Department-specific indicators
    usfd = np.where(dept == 0, np.random.choice([0, 1, 2, 3], n_samples, p=[0.40, 0.30, 0.20, 0.10]), 0)
    point_risk = np.where(dept == 1, np.random.uniform(0.0, 100.0, n_samples), 0.0)
    ohe_wear = np.where(dept == 2, np.random.uniform(0.0, 100.0, n_samples), 0.0)

    # Base continuous linear & non-linear combinations
    ci_raw = (
        0.25 * tgi
        + 0.20 * speed_rest
        + 1.10 * days_overdue
        + 0.10 * gmt
        + 9.0 * usfd
        + 0.18 * point_risk
        + 0.18 * ohe_wear
    )

    # Non-linear domain physical rules:
    # 1. USFD flaw severity 3 (IMR - Immediate Removal) imposes a hard safety floor boost
    imr_mask = (usfd == 3)
    ci_raw[imr_mask] = np.maximum(85.0, ci_raw[imr_mask] + 35.0)

    # 2. Severe days overdue (>30 days) on high traffic density (>60 GMT) compound risk
    overdue_gmt_compound = (days_overdue > 30.0) & (gmt > 60.0)
    ci_raw[overdue_gmt_compound] += 18.0

    # 3. S&T point risk > 80% on high GMT track causes high signal failure risk
    signal_high_risk = (dept == 1) & (point_risk > 80.0) & (gmt > 50.0)
    ci_raw[signal_high_risk] += 15.0

    # 4. OHE wire wear > 70% (nearing 20% condemnation limit) causes high dewirement risk
    ohe_high_wear = (dept == 2) & (ohe_wear > 70.0)
    ci_raw[ohe_high_wear] += 14.0

    # Add Gaussian noise
    noise = np.random.normal(0.0, 1.8, n_samples)
    ci = np.clip(ci_raw + noise, 0.0, 100.0)
    ci = np.round(ci, 2)

    df = pd.DataFrame(
        {
            "tgi_deviation": np.round(tgi, 2),
            "speed_restriction_kmh": np.round(speed_rest, 2),
            "days_overdue": np.round(days_overdue, 2),
            "section_gmt_density": np.round(gmt, 2),
            "department_code": dept.astype(int),
            "usfd_flaw_severity": usfd.astype(int),
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
