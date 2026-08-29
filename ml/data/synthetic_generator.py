"""Generate domain-realistic synthetic railway maintenance risk data."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "department_code",
    "usfd_flaw_severity",
    "point_failure_risk",
    "ohe_insulator_wear",
]
TARGET_COLUMN = "criticality_index"


def generate_dataset(n_samples: int = 10_000, seed: int = 42) -> pd.DataFrame:
    """Return a reproducible dataset covering Track, Signal and Traction defects."""
    if n_samples < 100:
        raise ValueError("n_samples must be at least 100")

    rng = np.random.default_rng(seed)
    department = rng.choice([0, 1, 2], n_samples, p=[0.45, 0.30, 0.25])
    gmt = np.clip(rng.gamma(3.0, 18.0, n_samples) + 5.0, 5.0, 150.0)
    overdue = np.clip(rng.gamma(1.8, 8.0, n_samples), 0.0, 60.0)
    speed = np.clip(rng.gamma(1.6, 20.0, n_samples), 0.0, 120.0)

    track = department == 0
    signal = department == 1
    traction = department == 2

    tgi = np.where(track, rng.beta(2.1, 2.5, n_samples) * 100.0, rng.uniform(0, 12, n_samples))
    usfd = np.where(
        track,
        rng.choice([0, 1, 2, 3], n_samples, p=[0.58, 0.24, 0.12, 0.06]),
        0,
    )
    point_risk = np.where(signal, rng.beta(1.8, 2.2, n_samples) * 100.0, rng.uniform(0, 8, n_samples))
    ohe_wear = np.where(traction, rng.beta(2.0, 2.0, n_samples) * 100.0, rng.uniform(0, 8, n_samples))

    # Non-linear degradation and threshold effects reflect domain escalation rules.
    traffic_amplifier = 3.5 * np.square(gmt / 150.0)
    track_risk = track * (
        0.26 * tgi
        + 5.0 * usfd
        + 7.0 * (usfd == 2)
        + 22.0 * (usfd == 3)
        + 0.0009 * tgi * gmt
    )
    signal_risk = signal * (0.22 * point_risk + 10.0 * (point_risk > 70) + 7.0 * (point_risk > 88))
    traction_risk = traction * (0.22 * ohe_wear + 9.0 * (ohe_wear > 65) + 8.0 * (ohe_wear > 85))
    common_risk = 0.15 * speed + 0.32 * overdue + 0.12 * gmt + traffic_amplifier
    interaction = 0.0012 * speed * overdue + 0.001 * gmt * overdue
    noise = rng.normal(0.0, 1.25, n_samples)
    criticality = np.clip(common_risk + track_risk + signal_risk + traction_risk + interaction + noise, 0, 100)

    return pd.DataFrame(
        {
            "tgi_deviation": tgi,
            "speed_restriction_kmh": speed,
            "days_overdue": overdue,
            "section_gmt_density": gmt,
            "department_code": department,
            "usfd_flaw_severity": usfd,
            "point_failure_risk": point_risk,
            "ohe_insulator_wear": ohe_wear,
            TARGET_COLUMN: criticality,
        }
    ).round(4)


def save_dataset(output: Path, n_samples: int = 10_000, seed: int = 42) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)
    generate_dataset(n_samples, seed).to_csv(output, index=False)
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("criticality_dataset.csv"))
    args = parser.parse_args()
    print(save_dataset(args.output, args.samples, args.seed))
