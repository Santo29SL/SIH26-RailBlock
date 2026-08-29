"""Stage 2: AI Risk & Criticality Scoring Engine.

Uses XGBoost / Gradient Boosted Regression Trees and SHAP (SHapley Additive exPlanations)
to compute dynamic Criticality Index (CI ∈ [0, 100]) and human-explainable feature attributions
for maintenance requests across Track (TMS), Signal (SMMS), and Traction (TDMS) assets.
"""

from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import pandas as pd
import shap
import xgboost as xgb

logger = logging.getLogger(__name__)

# Feature column definitions
FEATURE_COLUMNS = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "department_code",  # 0: TRACK, 1: SIGNAL, 2: TRACTION
    "usfd_flaw_severity",  # 0 to 3
    "point_failure_risk",  # 0 to 100
    "ohe_insulator_wear",  # 0 to 100
]

MODEL_PATH = Path(__file__).resolve().parents[2] / "data" / "ml_models" / "criticality_xgboost_v1.joblib"


class RiskScoringEngine:
    """XGBoost + SHAP Risk and Criticality Scoring Engine."""

    def __init__(self):
        self.model: Optional[xgb.XGBRegressor] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self._initialize_or_load_model()

    def _initialize_or_load_model(self) -> None:
        """Load the offline-trained model and set up SHAP; never train at startup."""
        try:
            if not MODEL_PATH.is_file():
                raise FileNotFoundError(f"Model artifact not found: {MODEL_PATH}; run python ml/train.py")
            logger.info("Loading pretrained Risk Model from %s", MODEL_PATH)
            self.model = joblib.load(MODEL_PATH)
            self.explainer = shap.TreeExplainer(self.model)
            logger.info("XGBoost + SHAP Risk Engine initialized successfully.")
        except Exception as e:
            logger.warning(f"Failed to initialize ML model ({e}); will use deterministic fallback.")
            self.model = None
            self.explainer = None

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

        # Extract or compute features
        tgi = float(meta.get("tgi_deviation", meta.get("tgi", 50.0)))
        speed_rest = float(meta.get("speed_restriction_kmh", meta.get("speed_restriction_delta", 30.0)))

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

        gmt = float(meta.get("section_gmt_density", meta.get("section_gmt", 50.0)))
        usfd = float(meta.get("usfd_flaw_severity", meta.get("usfd_flaw", 0.0)))
        point_risk = float(meta.get("point_failure_risk", meta.get("point_risk", 20.0)))
        ohe_wear = float(meta.get("ohe_insulator_wear", meta.get("ohe_wear", 20.0)))

        return {
            "tgi_deviation": min(100.0, max(0.0, tgi)),
            "speed_restriction_kmh": min(120.0, max(0.0, speed_rest)),
            "days_overdue": min(60.0, max(0.0, days_overdue)),
            "section_gmt_density": min(150.0, max(0.0, gmt)),
            "department_code": float(dept_code),
            "usfd_flaw_severity": min(3.0, max(0.0, usfd)),
            "point_failure_risk": min(100.0, max(0.0, point_risk)),
            "ohe_insulator_wear": min(100.0, max(0.0, ohe_wear)),
        }

    def predict_risk(
        self, request: Any, target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Predict Criticality Index and generate SHAP explainability breakdown."""
        features_dict = self.extract_features(request, target_date)

        if self.model is None or self.explainer is None:
            # Fallback if ML packages fail
            return {
                "criticality_index": 50.0,
                "model_used": "deterministic_fallback",
                "shap_explanation": {
                    "base_value": 50.0,
                    "human_readable_reasoning": "ML Engine unavailable; using fallback score.",
                    "feature_attributions": {},
                },
            }

        df_feat = pd.DataFrame([features_dict])[FEATURE_COLUMNS]
        pred_ci = float(self.model.predict(df_feat)[0])
        pred_ci = round(min(100.0, max(0.0, pred_ci)), 2)

        # SHAP calculation
        shap_values = self.explainer(df_feat)
        vals = shap_values.values[0]
        base_val = float(shap_values.base_values[0])

        feature_names_readable = {
            "tgi_deviation": "Track Geometry Index (TGI) Deviation",
            "speed_restriction_kmh": "Temporary Speed Restriction (TSR)",
            "days_overdue": "Days Maintenance Overdue",
            "section_gmt_density": "Traffic GMT Density",
            "department_code": "Department Type",
            "usfd_flaw_severity": "USFD Ultrasonic Rail Flaw",
            "point_failure_risk": "S&T Point Failure Risk",
            "ohe_insulator_wear": "TRD OHE Wire Wear",
        }

        attributions = {}
        top_positive_impacts = []

        for name, val in zip(FEATURE_COLUMNS, vals):
            readable = feature_names_readable.get(name, name)
            impact = round(float(val), 2)
            attributions[readable] = impact
            if impact > 2.0:
                top_positive_impacts.append(f"{readable} (+{impact:.1f})")

        if top_positive_impacts:
            reasoning = f"Job rated {pred_ci}/100 primarily driven by " + ", ".join(top_positive_impacts[:3]) + "."
        else:
            reasoning = f"Job rated {pred_ci}/100 based on standard asset condition metrics."

        return {
            "criticality_index": pred_ci,
            "model_used": "xgboost_shap_v1",
            "shap_explanation": {
                "base_value": round(base_val, 2),
                "feature_attributions": attributions,
                "human_readable_reasoning": reasoning,
            },
        }


# Singleton instance
risk_engine = RiskScoringEngine()
