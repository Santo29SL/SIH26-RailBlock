"""Probability-Space SHAP TreeExplainer & Controller Reasoning Generator.

Implements Phase 2 explainability requirements:
- Probability-space attributions via shap.TreeExplainer(booster, data=background, model_output="probability", feature_perturbation="interventional").
- Additivity guarantee: base_value + Σ attributions ≈ predicted failure probability (within 1e-3).
- Criticality Index (CI 0-100) derivation from calibrated probabilities via frozen percentile ci_map.json.
- Human-readable domain-tailored reasoning strings for Indian Railways Section Controllers.
- CLI --selftest runner for automated verification.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap
import xgboost as xgb

# Add repo root to path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.config import (
    ARTIFACT_DIR,
    BOUNDS,
    DEPARTMENTS,
    FEATURE_DISPLAY_NAMES,
    SEED,
    USFD_ENUM,
    USFD_ORDINAL_TO_STR,
    USFD_STR_TO_ORDINAL,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class RiskExplainer:
    """Probability-space SHAP Explainer and controller reasoning builder."""

    def __init__(self, artifact_dir: Optional[Path | str] = None):
        self.artifact_dir = Path(artifact_dir) if artifact_dir else ARTIFACT_DIR
        self.booster: Optional[xgb.Booster] = None
        self.calibrator: Any = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.feature_order: List[str] = []
        self.sorted_p: List[float] = []
        self.base_value: float = 0.08
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Load artifact bundle from ARTIFACT_DIR."""
        if not self.artifact_dir.exists():
            logger.warning(f"Artifact directory {self.artifact_dir} does not exist. Run ml/train.py first.")
            return

        # 1. Load schema
        schema_path = self.artifact_dir / "schema.json"
        if schema_path.exists():
            with open(schema_path, "r") as f:
                schema_data = json.load(f)
                self.feature_order = schema_data.get("feature_order", [])

        # 2. Load model.json
        model_path = self.artifact_dir / "model.json"
        if model_path.exists():
            self.booster = xgb.Booster()
            self.booster.load_model(str(model_path))

        # 3. Load calibrator.joblib
        calibrator_path = self.artifact_dir / "calibrator.joblib"
        if calibrator_path.exists():
            self.calibrator = joblib.load(calibrator_path)

        # 4. Load ci_map.json
        ci_map_path = self.artifact_dir / "ci_map.json"
        if ci_map_path.exists():
            with open(ci_map_path, "r") as f:
                ci_data = json.load(f)
                self.sorted_p = ci_data.get("sorted_p", [])

        # 5. Load background.npz and initialize TreeExplainer
        bg_path = self.artifact_dir / "background.npz"
        if bg_path.exists() and self.booster is not None:
            bg_data = np.load(bg_path)
            background = bg_data["background"]
            masker = shap.maskers.Independent(background, max_samples=200)
            self.explainer = shap.TreeExplainer(
                self.booster,
                data=masker,
                model_output="probability",
                feature_perturbation="interventional",
            )
            self.base_value = float(self.explainer.expected_value)
            logger.info(
                f"✅ RiskExplainer initialized in probability space (base_value = {self.base_value:.4f})."
            )

    def is_ready(self) -> bool:
        """Check if all model and explainer artifacts are loaded and ready."""
        return (
            self.booster is not None
            and self.calibrator is not None
            and self.explainer is not None
            and len(self.sorted_p) > 0
            and len(self.feature_order) > 0
        )

    def encode_feature_dict(self, raw_features: Dict[str, Any]) -> pd.DataFrame:
        """Encode raw feature dictionary into 1-row DataFrame aligned with feature_order."""
        dept_raw = str(raw_features.get("department_code", raw_features.get("department", "TRACK"))).upper()
        raw_usfd = raw_features.get("usfd_flaw_severity", raw_features.get("usfd_classification", 0))

        if isinstance(raw_usfd, str):
            usfd_val = float(USFD_STR_TO_ORDINAL.get(raw_usfd.strip().upper(), 0))
        else:
            try:
                usfd_val = float(raw_usfd) if raw_usfd is not None else 0.0
            except (ValueError, TypeError):
                usfd_val = 0.0

        row: Dict[str, float] = {
            "tgi_deviation": float(raw_features.get("tgi_deviation", 0.0)),
            "speed_restriction_kmh": float(raw_features.get("speed_restriction_kmh", 0.0)),
            "days_overdue": float(raw_features.get("days_overdue", 0.0)),
            "section_gmt_density": float(raw_features.get("section_gmt_density", 5.0)),
            "point_failure_risk": float(raw_features.get("point_failure_risk", 0.0)),
            "ohe_insulator_wear": float(raw_features.get("ohe_insulator_wear", 0.0)),
            "usfd_flaw_severity": usfd_val,
        }

        # One-hot dummies for department
        for d in DEPARTMENTS:
            row[f"department_code_{d}"] = 1.0 if dept_raw == d else 0.0

        # Construct DataFrame in exact feature_order
        df_row = pd.DataFrame([row])[self.feature_order]
        return df_row

    def explain(
        self,
        raw_features: Dict[str, Any],
        request_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate probability-space SHAP explanations and Criticality Index."""
        if not self.is_ready():
            raise RuntimeError("RiskExplainer artifacts are not loaded. Run ml/train.py first.")

        df_row = self.encode_feature_dict(raw_features)
        X_mat = df_row.to_numpy(dtype=np.float64)

        # 1. Calibrated probability and Criticality Index
        calib_prob = float(self.calibrator.predict_proba(df_row)[:, 1][0])
        calib_prob = max(0.0, min(1.0, calib_prob))

        # Percentile rank mapping via frozen sorted_p
        sorted_arr = np.array(self.sorted_p)
        ci = float(100.0 * np.searchsorted(sorted_arr, calib_prob, side="right") / len(sorted_arr))
        ci = max(0.0, min(100.0, ci))

        # 2. Probability-space SHAP values
        shap_res = self.explainer(X_mat)
        phi_values = shap_res.values[0]
        base_val = float(self.explainer.expected_value)

        # 3. Format feature attributions
        attributions: Dict[str, float] = {}
        top_positive_drivers: List[str] = []

        usfd_code = int(df_row["usfd_flaw_severity"].iloc[0])
        usfd_name = USFD_ORDINAL_TO_STR.get(usfd_code, "Good")

        for feat_name, phi_val in zip(self.feature_order, phi_values):
            # Skip unselected zero department dummies
            if feat_name.startswith("department_code_") and df_row[feat_name].iloc[0] == 0.0:
                continue

            readable_name = FEATURE_DISPLAY_NAMES.get(feat_name, feat_name)
            if feat_name == "usfd_flaw_severity":
                readable_name = f"USFD rail flaw ({usfd_name})"
            elif feat_name == "speed_restriction_kmh":
                readable_name = f"Speed restriction delta ({df_row[feat_name].iloc[0]:.0f} km/h)"
            elif feat_name == "days_overdue":
                readable_name = f"Days overdue ({df_row[feat_name].iloc[0]:.0f})"
            elif feat_name == "section_gmt_density":
                readable_name = f"Section GMT density ({df_row[feat_name].iloc[0]:.1f})"
            elif feat_name == "tgi_deviation":
                readable_name = f"TGI deviation ({df_row[feat_name].iloc[0]:.1f})"

            attr_rounded = round(float(phi_val), 2)
            attributions[readable_name] = attr_rounded

            if attr_rounded >= 0.02:
                top_positive_drivers.append(f"{readable_name} (+{attr_rounded:.2f})")

        # 4. Human-readable reasoning string
        if top_positive_drivers:
            drivers_text = ", ".join(top_positive_drivers[:4])
            reasoning = (
                f"Base failure rate {base_val:.0%}. {drivers_text} → "
                f"{calib_prob:.0%} simulated 30-day failure probability; "
                f"CI {ci:.0f} = riskier than {ci:.0f}% of the current backlog."
            )
        else:
            reasoning = (
                f"Base failure rate {base_val:.0%} with nominal asset degradation metrics → "
                f"{calib_prob:.0%} simulated 30-day failure probability; "
                f"CI {ci:.0f} = riskier than {ci:.0f}% of the current backlog."
            )

        return {
            "request_code": request_code or "MR-TRK-104",
            "failure_probability": round(calib_prob, 2),
            "criticality_index": round(ci, 1),
            "model_used": "xgb_isotonic_ci_v1",
            "shap_explanation": {
                "space": "probability",
                "base_value": round(base_val, 2),
                "feature_attributions": attributions,
                "human_readable_reasoning": reasoning,
            },
        }


def run_selftest() -> bool:
    """Execute automated self-test validating probability additivity across 50 random samples."""
    logger.info("Executing RiskExplainer self-test suite...")
    explainer = RiskExplainer()

    if not explainer.is_ready():
        logger.error("❌ RiskExplainer artifacts not found. Run ml/train.py first.")
        return False

    rng = np.random.default_rng(SEED)
    n_tests = 50
    additivity_errors: List[float] = []

    for i in range(n_tests):
        raw_feat = {
            "tgi_deviation": float(rng.uniform(0.0, 100.0)),
            "speed_restriction_kmh": float(rng.uniform(0.0, 120.0)),
            "days_overdue": float(rng.uniform(0.0, 60.0)),
            "section_gmt_density": float(rng.uniform(5.0, 150.0)),
            "department_code": rng.choice(DEPARTMENTS),
            "usfd_flaw_severity": int(rng.choice([0, 1, 2, 3, 4])),
            "point_failure_risk": float(rng.uniform(0.0, 100.0)),
            "ohe_insulator_wear": float(rng.uniform(0.0, 100.0)),
        }

        df_row = explainer.encode_feature_dict(raw_feat)
        X_mat = df_row.to_numpy(dtype=np.float64)

        # Raw booster probability
        dmat = xgb.DMatrix(X_mat, feature_names=explainer.feature_order)
        raw_prob = float(explainer.booster.predict(dmat)[0])

        # SHAP calculation
        shap_res = explainer.explainer(X_mat)
        phi_sum = float(np.sum(shap_res.values[0]))
        base_val = float(explainer.explainer.expected_value)

        # Verify additivity: base_value + sum(phi) ≈ raw_prob
        error = abs((base_val + phi_sum) - raw_prob)
        additivity_errors.append(error)
        assert error < 1e-3, f"Sample {i+1}: Additivity violated (error = {error:.6f})!"

        # Explain call contract verification
        res = explainer.explain(raw_feat, request_code=f"MR-TEST-{i+1:03d}")
        assert "failure_probability" in res
        assert "criticality_index" in res
        assert "shap_explanation" in res
        assert res["shap_explanation"]["space"] == "probability"
        assert 0.0 <= res["criticality_index"] <= 100.0
        assert 0.0 <= res["failure_probability"] <= 1.0

    max_err = max(additivity_errors)
    mean_err = np.mean(additivity_errors)
    logger.info(
        f"✅ Self-test passed across {n_tests} samples! Max Additivity Error: {max_err:.2e}, Mean: {mean_err:.2e}"
    )

    # Sample output display
    sample_feat = {
        "tgi_deviation": 82.5,
        "speed_restriction_kmh": 80.0,
        "days_overdue": 14.0,
        "section_gmt_density": 45.2,
        "department_code": "TRACK",
        "usfd_flaw_severity": 3,  # IMR
        "point_failure_risk": 0.0,
        "ohe_insulator_wear": 0.0,
    }
    sample_res = explainer.explain(sample_feat, request_code="MR-TRK-104")
    logger.info("Sample Explanation Response:")
    print(json.dumps(sample_res, indent=2))
    return True


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Probability-space SHAP explainer for RailBlock.")
    parser.add_argument("--selftest", action="store_true", help="Run automated additivity self-test")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.selftest or len(sys.argv) == 1:
        success = run_selftest()
        if not success:
            sys.exit(1)
