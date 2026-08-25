"""Stage 2: AI Risk & Criticality Scoring Engine.

Uses XGBoost / Gradient Boosted Regression Trees and SHAP (SHapley Additive exPlanations)
to compute dynamic Criticality Index (CI ∈ [0, 100]) and human-explainable feature attributions
for maintenance requests across Track (TMS), Signal (SMMS), and Traction (TDMS) assets.
"""

from __future__ import annotations

import logging
import os
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap
import xgboost as xgb

from app.core.config import settings

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

MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ml_models")
MODEL_PATH = os.path.join(MODEL_CACHE_DIR, "criticality_xgboost_v1.joblib")


class RiskScoringEngine:
    """XGBoost + SHAP Risk and Criticality Scoring Engine."""

    def __init__(self):
        self.model: Optional[xgb.XGBRegressor] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self._initialize_or_load_model()

    def _generate_synthetic_training_data(self, n_samples: int = 2000) -> Tuple[pd.DataFrame, np.ndarray]:
        """Generate domain-grounded synthetic training data for Indian Railways maintenance defects."""
        np.random.seed(42)

        tgi = np.random.uniform(0, 100, n_samples)
        speed_rest = np.random.uniform(0, 100, n_samples)
        days_overdue = np.random.uniform(0, 45, n_samples)
        gmt = np.random.uniform(5, 120, n_samples)
        dept = np.random.choice([0, 1, 2], n_samples)  # TRACK, SIGNAL, TRACTION
        usfd = np.random.choice([0, 1, 2, 3], n_samples, p=[0.5, 0.25, 0.15, 0.10])
        point_risk = np.random.uniform(0, 100, n_samples)
        ohe_wear = np.random.uniform(0, 100, n_samples)

        # Ground truth Criticality Index equation + domain non-linear interaction noise
        ci = (
            0.30 * tgi
            + 0.20 * speed_rest
            + 0.65 * (days_overdue * 2.0)
            + 0.15 * gmt
            + 12.0 * usfd
            + 0.15 * (point_risk * (dept == 1))
            + 0.15 * (ohe_wear * (dept == 2))
            + np.random.normal(0, 2.5, n_samples)
        )
        ci = np.clip(ci, 0.0, 100.0)

        df = pd.DataFrame(
            {
                "tgi_deviation": tgi,
                "speed_restriction_kmh": speed_rest,
                "days_overdue": days_overdue,
                "section_gmt_density": gmt,
                "department_code": dept,
                "usfd_flaw_severity": usfd,
                "point_failure_risk": point_risk,
                "ohe_insulator_wear": ohe_wear,
            }
        )
        return df, ci

    def _initialize_or_load_model(self) -> None:
        """Train or load pretrained XGBoost model and setup SHAP explainer."""
        try:
            if os.path.exists(MODEL_PATH):
                logger.info(f"Loading pretrained XGBoost Risk Model from {MODEL_PATH}")
                self.model = joblib.load(MODEL_PATH)
            else:
                logger.info("Building and training initial XGBoost Risk Model...")
                X, y = self._generate_synthetic_training_data()
                self.model = xgb.XGBRegressor(
                    n_estimators=100,
                    max_depth=4,
                    learning_rate=0.08,
                    random_state=42,
                )
                self.model.fit(X, y)
                os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
                joblib.dump(self.model, MODEL_PATH)

            self.explainer = shap.TreeExplainer(self.model)
            logger.info("✅ XGBoost + SHAP Risk Engine initialized successfully.")
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
            "speed_restriction_kmh": min(100.0, max(0.0, speed_rest)),
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
