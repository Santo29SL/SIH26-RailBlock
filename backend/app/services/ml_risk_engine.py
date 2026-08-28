"""Stage 2: AI Risk & Criticality Scoring Engine (Inference Service).

Implements the Two-Mode Scoring Architecture:
1. Mode 1 (Operational Baseline): Expert-calibrated linear scoring formula with deterministic
   statutory USFD flaw penalties and full feature attribution breakdowns.
2. Mode 2 (Planning & Research): Pre-trained Gradient Boosted Decision Trees (XGBoost / CatBoost / LightGBM)
   paired with SHAP (SHapley Additive exPlanations) TreeExplainer for sub-2ms online inference.
"""

from __future__ import annotations

import logging
import os
from datetime import date
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap

from app.core.config import settings

logger = logging.getLogger(__name__)

# Feature column definitions
FEATURE_COLUMNS = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "department_code",  # 0: TRACK, 1: SIGNAL, 2: TRACTION
    "usfd_classification",  # 0: Good, 1: OBS, 2: OBSW, 3: IMR, 4: IMRW
    "point_failure_risk",  # 0 to 100
    "ohe_insulator_wear",  # 0 to 100
]

USFD_STR_TO_CODE = {
    "GOOD": 0,
    "OBS": 1,
    "OBSW": 2,
    "IMR": 3,
    "IMRW": 4,
}

USFD_CODE_TO_STR = {
    0: "Good",
    1: "OBS",
    2: "OBSW",
    3: "IMR",
    4: "IMRW",
}

FEATURE_READABLE_NAMES = {
    "tgi_deviation": "Track Geometry Index (TGI) Deviation",
    "speed_restriction_kmh": "Temporary Speed Restriction (TSR)",
    "days_overdue": "Days Maintenance Overdue",
    "section_gmt_density": "Traffic GMT Density",
    "department_code": "Department Type",
    "usfd_classification": "USFD Ultrasonic Rail Flaw",
    "point_failure_risk": "S&T Point Failure Risk",
    "ohe_insulator_wear": "TRD OHE Wire Wear",
}

MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ml_models")
MODEL_V2_PATH = os.path.join(MODEL_CACHE_DIR, "criticality_xgboost_v2.joblib")
MODEL_V1_PATH = os.path.join(MODEL_CACHE_DIR, "criticality_xgboost_v1.joblib")


class RiskScoringEngine:
    """Two-Mode AI Risk and Criticality Scoring Engine."""

    def __init__(self):
        self.model: Any = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.model_version: str = "mode1_deterministic_v1"
        self.algorithm_name: str = "Mode 1: Deterministic Expert Linear Formulation"
        self._load_production_model()

    def _load_production_model(self) -> None:
        """Load pretrained production model checkpoint (v2 or fallback v1)."""
        try:
            target_path = None
            if os.path.exists(MODEL_V2_PATH):
                target_path = MODEL_V2_PATH
            elif os.path.exists(MODEL_V1_PATH):
                target_path = MODEL_V1_PATH

            if target_path:
                logger.info(f"Loading production ML model checkpoint from {target_path}")
                self.model = joblib.load(target_path)
                self.explainer = shap.TreeExplainer(self.model)

                model_cls_name = type(self.model).__name__.lower()
                version_suffix = "v2" if "v2" in target_path else "v1"

                if "catboost" in model_cls_name:
                    self.model_version = f"catboost_shap_{version_suffix}"
                    self.algorithm_name = "Mode 2: CatBoost Regressor + SHAP TreeExplainer"
                elif "xgb" in model_cls_name:
                    self.model_version = f"xgboost_shap_{version_suffix}"
                    self.algorithm_name = "Mode 2: XGBoost Regressor + SHAP TreeExplainer"
                elif "lgbm" in model_cls_name or "lightgbm" in model_cls_name:
                    self.model_version = f"lightgbm_shap_{version_suffix}"
                    self.algorithm_name = "Mode 2: LightGBM Regressor + SHAP TreeExplainer"
                else:
                    self.model_version = f"gbdt_shap_{version_suffix}"
                    self.algorithm_name = "Mode 2: GBDT Regressor + SHAP TreeExplainer"

                logger.info(f"✅ AI Risk Engine ({self.algorithm_name}, version: {self.model_version}) loaded successfully.")
            else:
                logger.info("No ML model checkpoint found. Active mode: Mode 1 (Deterministic Operational Baseline).")
        except Exception as e:
            logger.warning(f"Failed to load ML model checkpoint ({e}); defaulting to Mode 1.")
            self.model = None
            self.explainer = None
            self.model_version = "mode1_deterministic_v1"
            self.algorithm_name = "Mode 1: Deterministic Expert Linear Formulation"

    def extract_features(
        self, request: Any, target_date: Optional[date] = None
    ) -> Dict[str, float]:
        """Extract ML feature dictionary from maintenance request object or dictionary."""
        meta = {}
        if isinstance(request, dict):
            meta = request.get("metadata_json") or request.get("metadata") or request
            dept_str = str(request.get("department", "TRACK")).upper()
            deadline = request.get("deadline")
        else:
            meta = getattr(request, "metadata_json", {}) or {}
            dept_str = str(getattr(request, "department", "TRACK")).upper()
            deadline = getattr(request, "deadline", None)

        dept_code_map = {"TRACK": 0, "SIGNAL": 1, "TRACTION": 2}
        dept_code = dept_code_map.get(dept_str, 0)

        # 1. TGI Deviation calculation (direct or derived from TRC components)
        tgi_dev = meta.get("tgi_deviation", meta.get("tgi"))
        if tgi_dev is None:
            # Check for raw TRC sub-indices
            ui = meta.get("unevenness_index")
            ti = meta.get("twist_index")
            gi = meta.get("gauge_index")
            ai = meta.get("alignment_index")
            curv_deg = float(meta.get("curvature_deg", 0.0))
            if all(v is not None for v in (ui, ti, gi, ai)):
                ci_curv = max(10.0, 100.0 - (curv_deg * 12.0))
                tgi_score = (2.0 * float(ui) + float(ti) + float(gi) + 6.0 * float(ai) + 2.0 * ci_curv) / 12.0
                tgi_dev = 100.0 - tgi_score
            else:
                tgi_dev = 50.0
        tgi = float(tgi_dev)

        # 2. Speed restriction delta km/h
        speed_rest = float(meta.get("speed_restriction_kmh", meta.get("speed_restriction_delta", 30.0)))

        # 3. Days overdue
        days_overdue = meta.get("days_overdue")
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
        gmt = float(meta.get("section_gmt_density", meta.get("section_gmt", 50.0)))

        # 5. USFD classification (accepts string "IMRW", "OBS", etc., or integer code 0-4)
        raw_usfd = meta.get("usfd_classification", meta.get("usfd_flaw_severity", meta.get("usfd_flaw", 0)))
        if isinstance(raw_usfd, str):
            usfd_code = float(USFD_STR_TO_CODE.get(raw_usfd.strip().upper(), 0))
        else:
            try:
                usfd_code = float(raw_usfd)
            except (ValueError, TypeError):
                usfd_code = 0.0

        # 6. Point failure risk and OHE wire wear
        point_risk = float(meta.get("point_failure_risk", meta.get("point_risk", 0.0 if dept_code != 1 else 20.0)))
        ohe_wear = float(meta.get("ohe_insulator_wear", meta.get("ohe_wear", 0.0 if dept_code != 2 else 20.0)))

        return {
            "tgi_deviation": min(100.0, max(0.0, tgi)),
            "speed_restriction_kmh": min(120.0, max(0.0, speed_rest)),
            "days_overdue": min(60.0, max(0.0, days_overdue)),
            "section_gmt_density": min(150.0, max(5.0, gmt)),
            "department_code": float(dept_code),
            "usfd_classification": min(4.0, max(0.0, usfd_code)),
            "point_failure_risk": min(100.0, max(0.0, point_risk)),
            "ohe_insulator_wear": min(100.0, max(0.0, ohe_wear)),
        }

    def compute_mode1_criticality(self, features_dict: Dict[str, float]) -> Tuple[float, Dict[str, float], str]:
        """Compute Mode 1 Deterministic Criticality Index and linear feature attributions."""
        tgi = features_dict["tgi_deviation"]
        speed_rest = features_dict["speed_restriction_kmh"]
        days_overdue = features_dict["days_overdue"]
        gmt = features_dict["section_gmt_density"]
        usfd_code = int(features_dict["usfd_classification"])
        point_risk = features_dict["point_failure_risk"]
        ohe_wear = features_dict["ohe_insulator_wear"]
        dept_code = int(features_dict["department_code"])

        # Domain calibrated weights
        w_tgi = 0.25
        w_tsr = 0.20
        w_overdue = 1.10
        w_gmt = 0.10

        # USFD statutory defect penalty
        usfd_penalty_map = {0: 0.0, 1: 15.0, 2: 22.0, 3: 35.0, 4: 45.0}
        usfd_penalty = usfd_penalty_map.get(usfd_code, 0.0)
        usfd_str = USFD_CODE_TO_STR.get(usfd_code, "Good")

        # Component points
        pts_tgi = round(w_tgi * tgi, 2)
        pts_tsr = round(w_tsr * speed_rest, 2)
        pts_overdue = round(w_overdue * days_overdue, 2)
        pts_gmt = round(w_gmt * gmt, 2)
        pts_usfd = round(usfd_penalty, 2)
        pts_point = round(0.18 * point_risk if dept_code == 1 else 0.0, 2)
        pts_ohe = round(0.18 * ohe_wear if dept_code == 2 else 0.0, 2)

        ci_raw = pts_tgi + pts_tsr + pts_overdue + pts_gmt + pts_usfd + pts_point + pts_ohe

        # Non-linear statutory safety floors
        if usfd_code == 4:  # IMRW
            ci_raw = max(88.0, ci_raw)
        elif usfd_code == 3:  # IMR
            ci_raw = max(80.0, ci_raw)

        if days_overdue > 30.0 and gmt > 60.0:
            ci_raw += 18.0

        ci = round(min(100.0, max(0.0, ci_raw)), 2)

        # Attributions
        attributions = {
            f"USFD Ultrasonic Rail Flaw ({usfd_str})": pts_usfd,
            "Temporary Speed Restriction (TSR)": pts_tsr,
            "Days Maintenance Overdue": pts_overdue,
            "Track Geometry Index (TGI) Deviation": pts_tgi,
            "Traffic GMT Density": pts_gmt,
        }
        if dept_code == 1 and point_risk > 0:
            attributions["S&T Point Failure Risk"] = pts_point
        if dept_code == 2 and ohe_wear > 0:
            attributions["TRD OHE Wire Wear"] = pts_ohe

        # Human-readable reasoning string
        tag = "[CRITICAL]" if ci >= 80.0 else ("[MODERATE]" if ci >= 50.0 else "[ROUTINE]")
        top_drivers = [f"{k} (+{v:.1f})" for k, v in sorted(attributions.items(), key=lambda x: x[1], reverse=True) if v > 2.0]
        if top_drivers:
            reasoning = f"Job rated {ci:.1f}/100 {tag} primarily driven by " + ", ".join(top_drivers[:3]) + "."
        else:
            reasoning = f"Job rated {ci:.1f}/100 {tag} based on standard asset condition metrics."

        return ci, attributions, reasoning

    def predict_risk(
        self,
        request: Any,
        target_date: Optional[date] = None,
        scoring_mode: str = "AUTO",
    ) -> Dict[str, Any]:
        """Predict Criticality Index and generate SHAP / Mode 1 explainability breakdown."""
        features_dict = self.extract_features(request, target_date)
        req_code = request.get("request_code") if isinstance(request, dict) else getattr(request, "request_code", None)

        mode = str(scoring_mode).upper()
        use_mode_2 = (mode == "MODE_2" or mode == "AUTO") and self.model is not None and self.explainer is not None

        if not use_mode_2:
            # Execute Mode 1 (Deterministic Operational Baseline)
            ci, attributions, reasoning = self.compute_mode1_criticality(features_dict)
            return {
                "request_code": req_code,
                "criticality_index": ci,
                "model_used": "mode1_deterministic_v1",
                "scoring_mode": "MODE_1",
                "shap_explanation": {
                    "base_value": 35.0,
                    "feature_attributions": attributions,
                    "human_readable_reasoning": reasoning,
                },
                "extracted_features": features_dict,
            }

        # Execute Mode 2 (ML + SHAP TreeExplainer)
        df_feat = pd.DataFrame([features_dict])[FEATURE_COLUMNS]
        pred_ci = float(self.model.predict(df_feat)[0])
        pred_ci = round(min(100.0, max(0.0, pred_ci)), 2)

        shap_values = self.explainer(df_feat)
        vals = shap_values.values[0]
        base_val = float(shap_values.base_values[0])

        usfd_code = int(features_dict.get("usfd_classification", 0))
        usfd_str = USFD_CODE_TO_STR.get(usfd_code, "Good")

        attributions = {}
        top_positive_impacts = []

        for name, val in zip(FEATURE_COLUMNS, vals):
            if name == "usfd_classification":
                readable = f"USFD Ultrasonic Rail Flaw ({usfd_str})" if usfd_code > 0 else "USFD Ultrasonic Rail Flaw (Good)"
            else:
                readable = FEATURE_READABLE_NAMES.get(name, name)
            impact = round(float(val), 2)
            attributions[readable] = impact
            if impact > 2.0:
                top_positive_impacts.append(f"{readable} (+{impact:.1f})")

        tag = "[CRITICAL]" if pred_ci >= 80.0 else ("[MODERATE]" if pred_ci >= 50.0 else "[ROUTINE]")
        if top_positive_impacts:
            reasoning = f"Job rated {pred_ci:.1f}/100 {tag} primarily driven by " + ", ".join(top_positive_impacts[:3]) + "."
        else:
            reasoning = f"Job rated {pred_ci:.1f}/100 {tag} based on standard asset condition metrics."

        return {
            "request_code": req_code,
            "criticality_index": pred_ci,
            "model_used": self.model_version,
            "scoring_mode": "MODE_2",
            "shap_explanation": {
                "base_value": round(base_val, 2),
                "feature_attributions": attributions,
                "human_readable_reasoning": reasoning,
            },
            "extracted_features": features_dict,
        }


# Singleton instance
risk_engine = RiskScoringEngine()

