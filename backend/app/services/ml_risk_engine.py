"""Stage 2: AI Risk & Criticality Scoring Engine (Inference Service).

Loads the verified artifact bundle from backend/data/ml_models/criticality_v1:
- model.json (XGBoost booster native serialization)
- calibrator.joblib (Fitted isotonic calibrator)
- schema.json (Feature order, dtypes, and domain bounds)
- enums.json (USFD enum Good=0 to IMRW=4, departments)
- ci_map.json (Frozen calibration split probabilities for percentile ranking)
- background.npz (Stratified background samples for SHAP)
- model_card.json (Model metadata, SHA256 integrity hash, metrics, disclaimer)

Provides:
- Startup bundle integrity & compatibility validation
- Probability-space SHAP explanations via shap.TreeExplainer (initialized once at startup)
- Deterministic rule_based_ci fallback (rule_based_v1)
- Sub-2ms online inference without inline training or runtime crashes
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap
import xgboost as xgb

logger = logging.getLogger(__name__)

# Feature column definitions
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

DEFAULT_ARTIFACT_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "data"
    / "ml_models"
    / "criticality_v1"
)

# v1 Rule-based CI weights and formulation
# CI = 0.30·tgi_deviation + 0.25·speed_restriction_kmh/1.2 + 0.20·min(days_overdue,60)/60·100 + 0.15·section_gmt_density/1.5 + severity_penalty
# where severity_penalty ∈ {Good: 0, OBS: 5, OBSW: 10, IMR: 25, IMRW: 35}, clipped to [0, 100].
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
    """Compute v1 Rule-Based Criticality Index (CI in [0, 100]) and breakdown.

    Used as the transparent deterministic fallback and ablation comparison baseline.
    Formula:
      CI = 0.30*tgi_deviation + 0.25*(speed_restriction_kmh/1.2)
         + 0.20*(min(days_overdue,60)/60)*100 + 0.15*(section_gmt_density/1.5)
         + severity_penalty
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
    return round(ci, 1), breakdown


class RiskScoringEngine:
    """Production AI Risk & Criticality Scoring Engine with XGBoost + SHAP and Rule-Based Fallback."""

    def __init__(self, artifact_dir: Optional[Path | str] = None):
        env_dir = os.getenv("CRITICALITY_ARTIFACT_DIR")
        if artifact_dir:
            self.artifact_dir = Path(artifact_dir)
        elif env_dir:
            self.artifact_dir = Path(env_dir)
        else:
            self.artifact_dir = DEFAULT_ARTIFACT_DIR

        self.booster: Optional[xgb.Booster] = None
        self.calibrator: Any = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.feature_order: List[str] = []
        self.sorted_p: List[float] = []
        self.base_value: float = 0.08
        self.model_card: Dict[str, Any] = {}
        self.model_version: str = "criticality_v1"
        self.model_name: str = "xgb_isotonic_ci_v1"
        self.is_ready_flag: bool = False

        self._load_and_validate_bundle()

    def is_ready(self) -> bool:
        """Return True if the model bundle is loaded and fully validated."""
        return self.is_ready_flag

    def _load_and_validate_bundle(self) -> None:
        """Load and strictly validate the criticality_v1 artifact bundle."""
        self.is_ready_flag = False
        if not self.artifact_dir.exists():
            logger.warning(
                f"Artifact directory '{self.artifact_dir}' not found. "
                "Active mode: rule_based_v1 deterministic fallback."
            )
            return

        try:
            # 1. Required artifact files check
            required_files = [
                "model.json",
                "calibrator.joblib",
                "schema.json",
                "enums.json",
                "ci_map.json",
                "background.npz",
                "model_card.json",
            ]
            for fname in required_files:
                fpath = self.artifact_dir / fname
                if not fpath.exists():
                    logger.warning(f"Required artifact '{fname}' missing from {self.artifact_dir}. Fallback to rule_based_v1.")
                    return

            # 2. Load model card & verify SHA-256 integrity
            model_card_path = self.artifact_dir / "model_card.json"
            with open(model_card_path, "r") as f:
                self.model_card = json.load(f)

            model_path = self.artifact_dir / "model.json"
            with open(model_path, "rb") as f:
                computed_sha = hashlib.sha256(f.read()).hexdigest()

            expected_sha = self.model_card.get("artifact_sha256")
            if expected_sha and computed_sha != expected_sha:
                logger.warning(
                    f"Integrity check failed: model.json SHA256 ({computed_sha}) does not match model_card.json ({expected_sha})."
                )
                return

            # 3. Load schema
            schema_path = self.artifact_dir / "schema.json"
            with open(schema_path, "r") as f:
                schema_data = json.load(f)
                self.feature_order = schema_data.get("feature_order", [])

            if not self.feature_order:
                logger.warning("Empty feature_order in schema.json.")
                return

            # 4. Load XGBoost booster
            self.booster = xgb.Booster()
            self.booster.load_model(str(model_path))

            if len(self.feature_order) != self.booster.num_features():
                logger.warning(
                    f"Feature mismatch: schema defines {len(self.feature_order)} features but booster expects {self.booster.num_features()}."
                )
                return

            # 5. Load isotonic calibrator
            calibrator_path = self.artifact_dir / "calibrator.joblib"
            self.calibrator = joblib.load(calibrator_path)

            # 6. Load ci_map
            ci_map_path = self.artifact_dir / "ci_map.json"
            with open(ci_map_path, "r") as f:
                ci_data = json.load(f)
                self.sorted_p = ci_data.get("sorted_p", [])

            if not self.sorted_p:
                logger.warning("Empty sorted_p in ci_map.json.")
                return

            # 7. Load background and construct TreeExplainer ONCE
            bg_path = self.artifact_dir / "background.npz"
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

            # 8. Run 1 dummy row validation (model -> calibrator -> CI) asserting finite output
            dummy_features = {
                "tgi_deviation": 50.0,
                "speed_restriction_kmh": 30.0,
                "days_overdue": 10.0,
                "section_gmt_density": 50.0,
                "point_failure_risk": 20.0,
                "ohe_insulator_wear": 20.0,
                "usfd_flaw_severity": 1.0,
                "department_code": "TRACK",
            }
            df_dummy = self.encode_feature_dict(dummy_features)
            dummy_calib_prob = float(self.calibrator.predict_proba(df_dummy)[:, 1][0])
            sorted_arr = np.array(self.sorted_p)
            dummy_ci = float(100.0 * np.searchsorted(sorted_arr, dummy_calib_prob, side="right") / len(sorted_arr))

            if not (np.isfinite(dummy_calib_prob) and 0.0 <= dummy_calib_prob <= 1.0):
                logger.warning(f"Invalid dummy probability output: {dummy_calib_prob}")
                return

            if not (np.isfinite(dummy_ci) and 0.0 <= dummy_ci <= 100.0):
                logger.warning(f"Invalid dummy CI output: {dummy_ci}")
                return

            self.is_ready_flag = True
            logger.info(
                f"✅ AI Risk Engine (criticality_v1 / xgb_isotonic_ci_v1) loaded and validated successfully. "
                f"Base failure rate: {self.base_value:.4f}."
            )
        except Exception as exc:
            logger.warning(f"Failed to load artifact bundle: {exc}. Defaulting to rule_based_v1.")
            self.booster = None
            self.calibrator = None
            self.explainer = None
            self.is_ready_flag = False

    def encode_feature_dict(self, raw_features: Dict[str, Any]) -> pd.DataFrame:
        """Encode raw feature dictionary into a 1-row DataFrame aligned with feature_order."""
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

        order = self.feature_order if self.feature_order else list(row.keys())
        return pd.DataFrame([row])[order]

    def extract_features(
        self, request: Any, target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Extract domain feature dictionary from request payload or database entity."""
        meta: Dict[str, Any] = {}
        req_dict: Dict[str, Any] = {}
        if isinstance(request, dict):
            req_dict = request
            raw_meta = request.get("metadata_json") or request.get("metadata")
            meta = raw_meta if isinstance(raw_meta, dict) else {}
            dept_str = str(request.get("department", "TRACK")).upper()
            deadline = request.get("deadline")
        else:
            raw_meta = getattr(request, "metadata_json", None) or getattr(request, "metadata", None)
            meta = raw_meta if isinstance(raw_meta, dict) else {}
            req_dict = getattr(request, "__dict__", {})
            dept_str = str(getattr(request, "department", "TRACK")).upper()
            deadline = getattr(request, "deadline", None)

        def _get_val(keys: List[str], default: Any) -> Any:
            for k in keys:
                if k in meta and meta[k] is not None:
                    return meta[k]
                if k in req_dict and req_dict[k] is not None:
                    return req_dict[k]
            return default

        # 1. TGI Deviation calculation (direct or derived from TRC components)
        tgi_dev = _get_val(["tgi_deviation", "tgi"], None)
        if tgi_dev is None:
            ui = _get_val(["unevenness_index"], None)
            ti = _get_val(["twist_index"], None)
            gi = _get_val(["gauge_index"], None)
            ai = _get_val(["alignment_index"], None)
            curv_deg = float(_get_val(["curvature_deg"], 0.0))
            if all(v is not None for v in (ui, ti, gi, ai)):
                ci_curv = max(10.0, 100.0 - (curv_deg * 12.0))
                tgi_score = (2.0 * float(ui) + float(ti) + float(gi) + 6.0 * float(ai) + 2.0 * ci_curv) / 12.0
                tgi_dev = 100.0 - tgi_score
            else:
                tgi_dev = 50.0
        tgi = float(tgi_dev)

        # 2. Speed restriction delta km/h
        speed_rest = float(_get_val(["speed_restriction_kmh", "speed_restriction_delta"], 30.0))

        # 3. Days overdue
        days_overdue = _get_val(["days_overdue"], None)
        if days_overdue is None:
            if deadline and target_date:
                if isinstance(deadline, str):
                    try:
                        deadline = date.fromisoformat(deadline)
                    except ValueError:
                        deadline = None
                if isinstance(deadline, date):
                    days_overdue = max(0, (target_date - deadline).days)
                else:
                    days_overdue = 0
            else:
                days_overdue = 0
        days_overdue = float(days_overdue)

        # 4. GMT density
        gmt = float(_get_val(["section_gmt_density", "section_gmt"], 50.0))

        # 5. USFD classification
        raw_usfd = _get_val(["usfd_flaw_severity", "usfd_classification", "usfd_flaw"], 0)
        if isinstance(raw_usfd, str):
            usfd_code = float(USFD_STR_TO_ORDINAL.get(raw_usfd.strip().upper(), 0))
        else:
            try:
                usfd_code = float(raw_usfd) if raw_usfd is not None else 0.0
            except (ValueError, TypeError):
                usfd_code = 0.0

        # 6. Point failure risk and OHE wire wear
        point_risk = float(_get_val(["point_failure_risk", "point_risk"], 20.0 if dept_str == "SIGNAL" else 0.0))
        ohe_wear = float(_get_val(["ohe_insulator_wear", "ohe_wear"], 20.0 if dept_str == "TRACTION" else 0.0))

        return {
            "tgi_deviation": min(100.0, max(0.0, tgi)),
            "speed_restriction_kmh": min(120.0, max(0.0, speed_rest)),
            "days_overdue": min(60.0, max(0.0, days_overdue)),
            "section_gmt_density": min(150.0, max(5.0, gmt)),
            "department_code": dept_str,
            "usfd_flaw_severity": min(4.0, max(0.0, usfd_code)),
            "point_failure_risk": min(100.0, max(0.0, point_risk)),
            "ohe_insulator_wear": min(100.0, max(0.0, ohe_wear)),
        }

    def predict_risk(
        self,
        request: Any,
        target_date: Optional[date] = None,
        scoring_mode: str = "AUTO",
    ) -> Dict[str, Any]:
        """Predict failure probability and Criticality Index with probability-space SHAP explanations."""
        features_dict = self.extract_features(request, target_date)
        req_code = request.get("request_code") if isinstance(request, dict) else getattr(request, "request_code", None)

        mode = str(scoring_mode).upper()
        use_ml = (mode == "MODE_2" or mode == "AUTO") and self.is_ready()

        if not use_ml:
            # Execute deterministic rule_based_v1 fallback
            ci, breakdown = rule_based_ci(features_dict)
            calib_prob = round(min(1.0, max(0.0, ci / 100.0)), 2)
            base_val = 0.08

            usfd_code = int(features_dict.get("usfd_flaw_severity", 0))
            usfd_name = USFD_ORDINAL_TO_STR.get(usfd_code, "Good")

            attributions = {
                f"USFD rail flaw ({usfd_name})": round(breakdown["usfd_severity_penalty"] / 100.0, 2),
                f"Speed restriction delta ({features_dict['speed_restriction_kmh']:.0f} km/h)": round(breakdown["speed_restriction_kmh"] / 100.0, 2),
                f"Days overdue ({features_dict['days_overdue']:.0f})": round(breakdown["days_overdue"] / 100.0, 2),
                f"Section GMT density ({features_dict['section_gmt_density']:.1f})": round(breakdown["section_gmt_density"] / 100.0, 2),
                f"TGI deviation ({features_dict['tgi_deviation']:.1f})": round(breakdown["tgi_deviation"] / 100.0, 2),
            }

            reasoning = (
                f"Rule-based CI {ci:.0f}/100 computed via statutory baseline formula (rule_based_v1). "
                f"TGI deviation +{breakdown['tgi_deviation']:.1f}, TSR +{breakdown['speed_restriction_kmh']:.1f}, "
                f"Overdue +{breakdown['days_overdue']:.1f}, GMT density +{breakdown['section_gmt_density']:.1f}, "
                f"USFD penalty +{breakdown['usfd_severity_penalty']:.1f}."
            )

            return {
                "request_code": req_code,
                "failure_probability": calib_prob,
                "criticality_index": round(ci, 1),
                "model_used": "rule_based_v1",
                "scoring_mode": "MODE_1",
                "shap_explanation": {
                    "space": "probability",
                    "base_value": round(base_val, 2),
                    "feature_attributions": attributions,
                    "human_readable_reasoning": reasoning,
                },
                "extracted_features": features_dict,
            }

        # Execute Mode 2 (XGBoost + Isotonic Calibrator + Interventional SHAP TreeExplainer)
        df_row = self.encode_feature_dict(features_dict)
        X_mat = df_row.to_numpy(dtype=np.float64)

        # 1. Calibrated probability
        calib_prob = float(self.calibrator.predict_proba(df_row)[:, 1][0])
        calib_prob = max(0.0, min(1.0, calib_prob))

        # 2. Criticality Index from frozen calibration percentile map
        sorted_arr = np.array(self.sorted_p)
        ci = float(100.0 * np.searchsorted(sorted_arr, calib_prob, side="right") / len(sorted_arr))
        ci = max(0.0, min(100.0, ci))

        # 3. Probability-space SHAP TreeExplainer values
        shap_res = self.explainer(X_mat)
        phi_values = shap_res.values[0]
        base_val = float(self.explainer.expected_value)

        # 4. Human-readable feature attributions
        attributions = {}
        top_positive_drivers = []

        usfd_code = int(df_row["usfd_flaw_severity"].iloc[0])
        usfd_name = USFD_ORDINAL_TO_STR.get(usfd_code, "Good")

        for feat_name, phi_val in zip(self.feature_order, phi_values):
            if feat_name.startswith("department_code_") and df_row[feat_name].iloc[0] == 0.0:
                continue

            readable_name = FEATURE_DISPLAY_NAMES.get(feat_name, feat_name)
            val = df_row[feat_name].iloc[0]
            if feat_name == "usfd_flaw_severity":
                readable_name = f"USFD rail flaw ({usfd_name})"
            elif feat_name == "speed_restriction_kmh":
                readable_name = f"Speed restriction delta ({val:.0f} km/h)"
            elif feat_name == "days_overdue":
                readable_name = f"Days overdue ({val:.0f})"
            elif feat_name == "section_gmt_density":
                readable_name = f"Section GMT density ({val:.1f})"
            elif feat_name == "tgi_deviation":
                readable_name = f"TGI deviation ({val:.1f})"

            attr_rounded = round(float(phi_val), 2)
            attributions[readable_name] = attr_rounded

            if attr_rounded >= 0.02:
                top_positive_drivers.append(f"{readable_name} (+{attr_rounded:.2f})")

        # 5. Domain-tailored reasoning
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
            "request_code": req_code,
            "failure_probability": round(calib_prob, 2),
            "criticality_index": round(ci, 1),
            "model_used": "xgb_isotonic_ci_v1",
            "scoring_mode": "MODE_2",
            "shap_explanation": {
                "space": "probability",
                "base_value": round(base_val, 2),
                "feature_attributions": attributions,
                "human_readable_reasoning": reasoning,
            },
            "extracted_features": features_dict,
        }

    def get_model_card(self) -> Dict[str, Any]:
        """Return model metadata card or fallback operational metadata."""
        if self.is_ready() and self.model_card:
            card = dict(self.model_card)
            card["status"] = "ready"
            card["active_scoring_mode"] = "xgb_isotonic_ci_v1"
            return card

        return {
            "model_name": "rule_based_v1",
            "version": "rule_based_v1",
            "status": "degraded",
            "active_scoring_mode": "rule_based_v1",
            "disclaimer": "Trained on simulated labels only. Deterministic rule-based fallback active.",
            "bounds": BOUNDS,
            "feature_order": CONTINUOUS_FEATURES + ORDINAL_FEATURES,
        }


# Singleton engine instance
risk_engine = RiskScoringEngine()

