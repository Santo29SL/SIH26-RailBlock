"""Configuration constants and schema definitions for RailBlock Stage 2 ML Pipeline.

Provides single source of truth for:
- Random seeds (SEED=42)
- Feature definitions, bounds, and monotonicity constraints
- USFD classification ordinal mappings (Good=0 to IMRW=4)
- Artifact directory paths
- v1 Rule-based Criticality Index (CI) calculation and weights
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Single global random seed for reproducible artifacts
SEED: int = 42

# Feature definitions
CONTINUOUS_FEATURES: List[str] = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "point_failure_risk",
    "ohe_insulator_wear",
]

CATEGORICAL_FEATURES: List[str] = [
    "department_code",
]

ORDINAL_FEATURES: List[str] = [
    "usfd_flaw_severity",
]

DEPARTMENTS: List[str] = [
    "TRACK",
    "SIGNAL",
    "TRACTION",
]

# Statutory USFD rail flaw classification ordinal (IRPWM T1/T2)
USFD_ENUM: Dict[str, int] = {
    "Good": 0,
    "OBS": 1,
    "OBSW": 2,
    "IMR": 3,
    "IMRW": 4,
}

USFD_STR_TO_ORDINAL: Dict[str, int] = {
    "GOOD": 0,
    "OBS": 1,
    "OBSW": 2,
    "IMR": 3,
    "IMRW": 4,
}

USFD_ORDINAL_TO_STR: Dict[int, str] = {
    0: "Good",
    1: "OBS",
    2: "OBSW",
    3: "IMR",
    4: "IMRW",
}

# Domain bounds for feature validation
BOUNDS: Dict[str, Tuple[float, float]] = {
    "tgi_deviation": (0.0, 100.0),
    "speed_restriction_kmh": (0.0, 120.0),
    "days_overdue": (0.0, 60.0),
    "section_gmt_density": (5.0, 150.0),
    "point_failure_risk": (0.0, 100.0),
    "ohe_insulator_wear": (0.0, 100.0),
    "usfd_flaw_severity": (0.0, 4.0),
}

# Monotone positive features: increasing feature value must never decrease failure probability
MONOTONE_POSITIVE: List[str] = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "point_failure_risk",
    "ohe_insulator_wear",
    "usfd_flaw_severity",
]

# Human-readable feature names for SHAP and explanations
FEATURE_DISPLAY_NAMES: Dict[str, str] = {
    "tgi_deviation": "Track Geometry Index (TGI) Deviation",
    "speed_restriction_kmh": "Temporary Speed Restriction (TSR)",
    "days_overdue": "Days Maintenance Overdue",
    "section_gmt_density": "Traffic GMT Density",
    "point_failure_risk": "S&T Point Failure Risk",
    "ohe_insulator_wear": "TRD OHE Wire Wear",
    "usfd_flaw_severity": "USFD Ultrasonic Rail Flaw",
    "department_code_TRACK": "Department: Track",
    "department_code_SIGNAL": "Department: Signal",
    "department_code_TRACTION": "Department: Traction",
}

# Model version identifiers
MODEL_V1_NAME: str = "rule_based_v1"
MODEL_V2_NAME: str = "xgb_isotonic_ci_v1"

# Artifact and data paths
BASE_DIR: Path = Path(__file__).resolve().parent.parent
DATA_DIR: Path = BASE_DIR / "ml" / "data"
DATASET_PATH: Path = DATA_DIR / "ir_defects_dataset.csv"
ARTIFACT_DIR: Path = BASE_DIR / "backend" / "data" / "ml_models" / "criticality_v1"
REPORTS_DIR: Path = BASE_DIR / "ml" / "reports"

# v1 Rule-based CI weights and formulation
# CI = 0.30·tgi_deviation + 0.25·speed_restriction_kmh/1.2 + 0.20·min(days_overdue,60)/60·100 + 0.15·section_gmt_density/1.5 + severity_penalty
V1_RULE_WEIGHTS: Dict[str, Any] = {
    "w_tgi": 0.30,
    "w_tsr_scale": 1.2,
    "w_tsr_coeff": 0.25,
    "w_overdue_coeff": 0.20,
    "w_overdue_max": 60.0,
    "w_gmt_scale": 1.5,
    "w_gmt_coeff": 0.15,
    "usfd_severity_penalties": {
        0: 0.0,   # Good
        1: 5.0,   # OBS
        2: 10.0,  # OBSW
        3: 25.0,  # IMR
        4: 35.0,  # IMRW
    },
}


def rule_based_ci(features: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
    """Compute v1 Rule-Based Criticality Index ($CI \\in [0, 100]$) and breakdown.

    Used as the transparent deterministic fallback and ablation comparison baseline.
    """
    tgi = float(features.get("tgi_deviation", 0.0))
    tsr = float(features.get("speed_restriction_kmh", 0.0))
    overdue = float(features.get("days_overdue", 0.0))
    gmt = float(features.get("section_gmt_density", 5.0))

    raw_usfd = features.get("usfd_flaw_severity", features.get("usfd_classification", 0))
    if isinstance(raw_usfd, str):
        usfd_code = USFD_STR_TO_ORDINAL.get(raw_usfd.strip().upper(), 0)
    else:
        try:
            usfd_code = int(raw_usfd) if raw_usfd is not None else 0
        except (ValueError, TypeError):
            usfd_code = 0

    pts_tgi = V1_RULE_WEIGHTS["w_tgi"] * tgi
    pts_tsr = V1_RULE_WEIGHTS["w_tsr_coeff"] * (tsr / V1_RULE_WEIGHTS["w_tsr_scale"])
    pts_overdue = (
        V1_RULE_WEIGHTS["w_overdue_coeff"]
        * (min(overdue, V1_RULE_WEIGHTS["w_overdue_max"]) / V1_RULE_WEIGHTS["w_overdue_max"])
        * 100.0
    )
    pts_gmt = V1_RULE_WEIGHTS["w_gmt_coeff"] * (gmt / V1_RULE_WEIGHTS["w_gmt_scale"])
    pts_severity = float(V1_RULE_WEIGHTS["usfd_severity_penalties"].get(usfd_code, 0.0))

    raw_ci = pts_tgi + pts_tsr + pts_overdue + pts_gmt + pts_severity
    ci = min(100.0, max(0.0, raw_ci))

    breakdown = {
        "tgi_deviation": round(pts_tgi, 2),
        "speed_restriction_kmh": round(pts_tsr, 2),
        "days_overdue": round(pts_overdue, 2),
        "section_gmt_density": round(pts_gmt, 2),
        "usfd_severity_penalty": round(pts_severity, 2),
    }
    return round(ci, 2), breakdown
