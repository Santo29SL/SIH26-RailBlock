"""SHAP TreeExplainer & Natural Language Reasoning Generator.

Provides human-explainable feature attributions and section controller reasoning strings
for maintenance requests scored by the AI Risk Engine.
"""

import os
import logging
import joblib
import pandas as pd
import shap
from typing import Any, Dict, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

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

FEATURE_READABLE_NAMES = {
    "tgi_deviation": "Track Geometry Index (TGI) Deviation",
    "speed_restriction_kmh": "Temporary Speed Restriction (TSR)",
    "days_overdue": "Days Maintenance Overdue",
    "section_gmt_density": "Traffic GMT Density",
    "department_code": "Department Type",
    "usfd_flaw_severity": "USFD Ultrasonic Rail Flaw",
    "point_failure_risk": "S&T Point Failure Risk",
    "ohe_insulator_wear": "TRD OHE Wire Wear",
}

class RiskExplainer:
    """SHAP Explainer and controller reasoning builder."""

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__), "..", "backend", "data", "ml_models", "criticality_xgboost_v2.joblib"
            )
        self.model = None
        self.explainer = None
        self._load_model(model_path)

    def _load_model(self, path: str):
        try:
            if os.path.exists(path):
                self.model = joblib.load(path)
                self.explainer = shap.TreeExplainer(self.model)
                logger.info(f"✅ RiskExplainer initialized with model from {path}")
            else:
                logger.warning(f"Model path {path} not found for RiskExplainer.")
        except Exception as e:
            logger.warning(f"Failed to load model for RiskExplainer: {e}")

    def explain(self, features_dict: Dict[str, float], predicted_ci: float) -> Dict[str, Any]:
        """Compute SHAP feature attributions and generate human-readable reasoning."""
        if self.model is None or self.explainer is None:
            return {
                "base_value": 50.0,
                "feature_attributions": {},
                "human_readable_reasoning": f"Job rated {predicted_ci:.1f}/100 based on standard asset metrics.",
            }

        df_feat = pd.DataFrame([features_dict])[FEATURE_COLUMNS]
        shap_values = self.explainer(df_feat)
        vals = shap_values.values[0]
        base_val = float(shap_values.base_values[0])

        attributions = {}
        top_positive_impacts = []

        for name, val in zip(FEATURE_COLUMNS, vals):
            readable = FEATURE_READABLE_NAMES.get(name, name)
            impact = round(float(val), 2)
            attributions[readable] = impact
            if impact > 2.0:
                top_positive_impacts.append(f"{readable} (+{impact:.1f})")

        # Severity tag
        if predicted_ci >= 80.0:
            tag = "[CRITICAL]"
        elif predicted_ci >= 50.0:
            tag = "[MODERATE]"
        else:
            tag = "[ROUTINE]"

        if top_positive_impacts:
            reasoning = f"Job rated {predicted_ci:.1f}/100 {tag} primarily driven by " + ", ".join(top_positive_impacts[:3]) + "."
        else:
            reasoning = f"Job rated {predicted_ci:.1f}/100 {tag} based on standard asset condition metrics."

        return {
            "base_value": round(base_val, 2),
            "feature_attributions": attributions,
            "human_readable_reasoning": reasoning,
        }

if __name__ == "__main__":
    sample_feat = {
        "tgi_deviation": 82.5,
        "speed_restriction_kmh": 80.0,
        "days_overdue": 14.0,
        "section_gmt_density": 45.2,
        "department_code": 0,
        "usfd_flaw_severity": 3,
        "point_failure_risk": 0.0,
        "ohe_insulator_wear": 0.0,
    }
    explainer = RiskExplainer()
    res = explainer.explain(sample_feat, 88.4)
    print("Sample Explanation Output:")
    print(res)
