"""Domain-Realistic Indian Railways Defect Dataset Generator (Hazard & Domain Randomization).

Generates synthetic maintenance defect records grounded in Indian Railways track standards (IRPWM),
statutory G&SR safety rules, and real IR traffic parameters (GMT density, speed restrictions, USFD flaws,
S&T point latencies, and TRD OHE wire wear limits).

Engineering Design (Phase 2):
1. Hazard Outcome: Each record gets a ground-truth hazard probability
   hazard_prob = sigmoid(logit_base + Σ β_k·f_k + Σ γ_ij·interaction_ij)
   Interactions modeled:
   - usfd_flaw_severity × section_gmt_density
   - ohe_insulator_wear × section_gmt_density
   - point_failure_risk × days_overdue
2. Domain Randomization: Coefficients (β, γ, logit_base) are sampled from prior ranges per generator seed.
3. Latent Section Regimes: Latent section-level traffic and hazard offsets (section_id output for SGKF).
4. Binary Classification Label: failure_30d = Bernoulli(hazard_prob) with 2-5% label noise.
5. Base Rate Constraint: 5% to 15% positive base rate (asserted at runtime).
6. Robustness Shift Mode: --shift flag generates out-of-distribution regimes for evaluation.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np
import pandas as pd

# Add repo root to path for imports
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.config import (
    BOUNDS,
    DATA_DIR,
    DATASET_PATH,
    DEPARTMENTS,
    SEED,
    USFD_ENUM,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def sigmoid(z: np.ndarray | float) -> np.ndarray | float:
    """Standard numerically stable logistic sigmoid function."""
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30.0, 30.0)))


def generate_ir_defects_dataset(
    n_samples: int = 6000,
    seed: int = SEED,
    label_noise: float = 0.03,
    shift: bool = False,
    n_sections: int = 50,
    output_path: Optional[str | Path] = None,
) -> pd.DataFrame:
    """Generate synthetic Indian Railways defect records with hazard-based failure labels.

    Args:
        n_samples: Number of records to generate (default 6000).
        seed: Random seed for domain randomization and sampling.
        label_noise: Fraction of binary failure labels to randomly invert (default 0.03).
        shift: If True, generate covariate-shifted out-of-distribution regime.
        n_sections: Number of latent railway sections.
        output_path: Destination path for CSV output.

    Returns:
        pd.DataFrame containing feature columns, latent section_id, hazard_prob, and failure_30d.
    """
    rng = np.random.default_rng(seed)
    logger.info(
        f"Generating {n_samples} samples (seed={seed}, shift={shift}, label_noise={label_noise:.1%})..."
    )

    # 1. Section-level latent regimes
    section_ids = [f"SEC_{i:03d}" for i in range(1, n_sections + 1)]
    if not shift:
        sec_gmt_means = rng.uniform(25.0, 100.0, n_sections)
        sec_hazard_offsets = rng.normal(0.0, 0.15, n_sections)
    else:
        # Shift regime: heavier freight traffic corridors, elevated ambient stress
        sec_gmt_means = rng.uniform(60.0, 140.0, n_sections)
        sec_hazard_offsets = rng.normal(0.20, 0.20, n_sections)

    sample_sec_idx = rng.choice(n_sections, n_samples)
    section_col = np.array([section_ids[i] for i in sample_sec_idx])

    # 2. Department selection (TRACK: 45%, SIGNAL: 30%, TRACTION: 25%)
    dept_choices = np.array(DEPARTMENTS)
    dept_col = rng.choice(dept_choices, n_samples, p=[0.45, 0.30, 0.25])

    # 3. Continuous feature generation
    # GMT density drawn from section distribution
    gmt_std = 8.0 if not shift else 12.0
    gmt_raw = rng.normal(sec_gmt_means[sample_sec_idx], gmt_std)
    min_gmt, max_gmt = (20.0, 150.0) if shift else BOUNDS["section_gmt_density"]
    gmt_col = np.clip(gmt_raw, min_gmt, max_gmt)

    # Track Geometry Index (TGI) deviation [0, 100]
    if not shift:
        tgi_col = np.clip(rng.beta(2.0, 5.0, n_samples) * 100.0, BOUNDS["tgi_deviation"][0], BOUNDS["tgi_deviation"][1])
    else:
        tgi_col = np.clip(rng.beta(3.0, 4.0, n_samples) * 100.0, BOUNDS["tgi_deviation"][0], BOUNDS["tgi_deviation"][1])

    # Temporary Speed Restriction delta [0, 120] km/h
    tsr_scale = 15.0 if not shift else 25.0
    tsr_col = np.clip(rng.exponential(tsr_scale, n_samples), BOUNDS["speed_restriction_kmh"][0], BOUNDS["speed_restriction_kmh"][1])

    # Days overdue [0, 60]
    overdue_scale = 6.0 if not shift else 10.0
    overdue_col = np.clip(rng.exponential(overdue_scale, n_samples), BOUNDS["days_overdue"][0], BOUNDS["days_overdue"][1])

    # Department-specific features
    # Track: USFD Flaw Severity ordinal [0=Good, 1=OBS, 2=OBSW, 3=IMR, 4=IMRW]
    usfd_probs = [0.60, 0.18, 0.11, 0.07, 0.04] if not shift else [0.45, 0.22, 0.15, 0.11, 0.07]
    usfd_raw = rng.choice([0, 1, 2, 3, 4], n_samples, p=usfd_probs)
    usfd_col = np.where(dept_col == "TRACK", usfd_raw, 0)

    # Signal: Point failure risk [0, 100]
    point_raw = np.clip(rng.beta(1.5, 4.0, n_samples) * 100.0, BOUNDS["point_failure_risk"][0], BOUNDS["point_failure_risk"][1])
    point_col = np.where(dept_col == "SIGNAL", point_raw, 0.0)

    # Traction: OHE wire wear [0, 100]
    ohe_raw = np.clip(rng.beta(2.0, 4.0, n_samples) * 100.0, BOUNDS["ohe_insulator_wear"][0], BOUNDS["ohe_insulator_wear"][1])
    ohe_col = np.where(dept_col == "TRACTION", ohe_raw, 0.0)

    # 4. Domain Randomization of Hazard Model Parameters
    if not shift:
        logit_base = rng.uniform(-4.8, -4.4)
        b_tgi = rng.uniform(0.015, 0.022)
        b_tsr = rng.uniform(0.010, 0.018)
        b_overdue = rng.uniform(0.025, 0.040)
        b_gmt = rng.uniform(0.005, 0.010)
        b_usfd = rng.uniform(0.35, 0.50)
        b_point = rng.uniform(0.012, 0.022)
        b_ohe = rng.uniform(0.012, 0.022)

        g_usfd_gmt = rng.uniform(0.002, 0.004)
        g_ohe_gmt = rng.uniform(0.0001, 0.0002)
        g_point_overdue = rng.uniform(0.0002, 0.0005)
    else:
        # Shifted coefficients
        logit_base = rng.uniform(-4.3, -3.9)
        b_tgi = rng.uniform(0.018, 0.026)
        b_tsr = rng.uniform(0.014, 0.022)
        b_overdue = rng.uniform(0.030, 0.048)
        b_gmt = rng.uniform(0.008, 0.014)
        b_usfd = rng.uniform(0.40, 0.55)
        b_point = rng.uniform(0.015, 0.026)
        b_ohe = rng.uniform(0.015, 0.026)

        g_usfd_gmt = rng.uniform(0.003, 0.005)
        g_ohe_gmt = rng.uniform(0.00015, 0.00025)
        g_point_overdue = rng.uniform(0.0003, 0.0006)

    # 5. Latent Hazard Logit & Probability Calculation
    logit = (
        logit_base
        + sec_hazard_offsets[sample_sec_idx]
        + b_tgi * tgi_col
        + b_tsr * tsr_col
        + b_overdue * overdue_col
        + b_gmt * gmt_col
        + b_usfd * usfd_col
        + b_point * point_col
        + b_ohe * ohe_col
        + g_usfd_gmt * (usfd_col * gmt_col)
        + g_ohe_gmt * (ohe_col * gmt_col)
        + g_point_overdue * (point_col * overdue_col)
    )

    hazard_prob = sigmoid(logit)

    # 6. Binary label generation from Bernoulli(hazard_prob) with label noise
    raw_labels = (rng.binomial(1, hazard_prob) == 1).astype(int)
    labels = raw_labels.copy()

    if label_noise > 0.0:
        noise_mask = rng.uniform(0.0, 1.0, n_samples) < label_noise
        labels[noise_mask] = 1 - labels[noise_mask]

    base_rate = float(np.mean(labels))
    logger.info(f"Generated dataset base positive failure rate: {base_rate:.2%}")

    if not shift:
        assert 0.05 <= base_rate <= 0.15, (
            f"Base failure rate {base_rate:.2%} is outside required range [5%, 15%]."
        )

    # 7. Construct DataFrame
    df = pd.DataFrame(
        {
            "section_id": section_col,
            "department_code": dept_col,
            "tgi_deviation": np.round(tgi_col, 2),
            "speed_restriction_kmh": np.round(tsr_col, 2),
            "days_overdue": np.round(overdue_col, 2),
            "section_gmt_density": np.round(gmt_col, 2),
            "usfd_flaw_severity": usfd_col.astype(int),
            "point_failure_risk": np.round(point_col, 2),
            "ohe_insulator_wear": np.round(ohe_col, 2),
            "hazard_prob": np.round(hazard_prob, 4),
            "failure_30d": labels.astype(int),
        }
    )

    # Output path resolution
    if output_path is None:
        target_csv = DATASET_PATH if not shift else (DATA_DIR / "ir_defects_dataset_shift.csv")
    else:
        target_csv = Path(output_path)

    target_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(target_csv, index=False)
    logger.info(f"✅ Saved {len(df)} samples to {target_csv}")
    return df


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Generate synthetic Indian Railways defect dataset.")
    parser.add_argument("--n-samples", type=int, default=6000, help="Number of records to generate")
    parser.add_argument("--seed", type=int, default=SEED, help="Random seed")
    parser.add_argument("--label-noise", type=float, default=0.03, help="Fraction of label flips (0.0 to 0.05)")
    parser.add_argument("--shift", action="store_true", help="Generate covariate-shifted regime")
    parser.add_argument("--output", type=str, default=None, help="Custom output CSV path")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    generate_ir_defects_dataset(
        n_samples=args.n_samples,
        seed=args.seed,
        label_noise=args.label_noise,
        shift=args.shift,
        output_path=args.output,
    )
