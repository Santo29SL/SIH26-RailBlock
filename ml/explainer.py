"""SHAP attribution and controller-facing explanations for criticality models."""

from __future__ import annotations

from typing import Mapping

import pandas as pd
import shap

from data.synthetic_generator import FEATURE_COLUMNS

READABLE_NAMES = {
    "tgi_deviation": "Track Geometry Index (TGI) deviation",
    "speed_restriction_kmh": "temporary speed restriction",
    "days_overdue": "maintenance overdue period",
    "section_gmt_density": "traffic GMT density",
    "department_code": "department-specific risk",
    "usfd_flaw_severity": "USFD ultrasonic rail flaw",
    "point_failure_risk": "S&T point failure risk",
    "ohe_insulator_wear": "TRD OHE wire wear",
}


def explain_prediction(model: object, features: Mapping[str, float]) -> dict:
    frame = pd.DataFrame([{name: features[name] for name in FEATURE_COLUMNS}])
    prediction = max(0.0, min(100.0, float(model.predict(frame)[0])))
    explanation = shap.TreeExplainer(model)(frame)
    impacts = {READABLE_NAMES[name]: round(float(value), 2) for name, value in zip(FEATURE_COLUMNS, explanation.values[0])}
    ranked = sorted(impacts.items(), key=lambda item: item[1], reverse=True)
    drivers = [f"{name} ({impact:+.1f} pts)" for name, impact in ranked if impact > 1.0][:3]
    band = "CRITICAL" if prediction >= 80 else "HIGH" if prediction >= 65 else "MODERATE" if prediction >= 40 else "LOW"
    detail = ", ".join(drivers) if drivers else "normal asset-condition indicators"
    return {
        "criticality_index": round(prediction, 2),
        "base_value": round(float(explanation.base_values[0]), 2),
        "feature_attributions": impacts,
        "human_readable_reasoning": f"Job rated {prediction:.1f}/100 [{band}]: primarily driven by {detail}.",
    }
