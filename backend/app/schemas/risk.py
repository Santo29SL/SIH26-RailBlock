"""Stage 2 AI Risk & Criticality Scoring Schemas.

Covers:
- Statutory USFD classifications (Good, OBS, OBSW, IMR, IMRW)
- Scoring Mode Selection (AUTO, MODE_1, MODE_2)
- Domain bounds validation for maintenance parameters
- Raw TRC Track Geometry inputs
- Risk Prediction Request and Response schemas
- Model Info metadata response
"""

from __future__ import annotations

import enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class USFDClassificationEnum(str, enum.Enum):
    """Statutory Indian Railways USFD flaw classifications per IRPWM."""
    GOOD = "Good"
    OBS = "OBS"
    OBSW = "OBSW"
    IMR = "IMR"
    IMRW = "IMRW"


class ScoringModeEnum(str, enum.Enum):
    """Two-Mode Scoring Engine architecture."""
    AUTO = "AUTO"                                # Uses Mode 2 ML if model exists; falls back to Mode 1
    MODE_1_DETERMINISTIC = "MODE_1"             # Expert-calibrated linear domain formula
    MODE_2_ML_SHAP = "MODE_2"                   # Gradient Boosted Trees (XGBoost) + SHAP


# Canonical domain bounds
FEATURE_BOUNDS: Dict[str, tuple[float, float]] = {
    "tgi_deviation": (0.0, 100.0),
    "speed_restriction_kmh": (0.0, 120.0),
    "days_overdue": (0.0, 60.0),
    "section_gmt_density": (5.0, 150.0),
    "point_failure_risk": (0.0, 100.0),
    "ohe_insulator_wear": (0.0, 100.0),
    "usfd_flaw_severity": (0.0, 4.0),
}


class TrackGeometryInput(BaseModel):
    """Track Recording Car (TRC) geometry parameters."""
    model_config = ConfigDict(extra="ignore")

    tgi_deviation: Optional[float] = Field(None, ge=0.0, le=100.0, description="Direct TGI deviation (100 - TGI)")
    unevenness_index: Optional[float] = Field(None, ge=0.0, le=100.0, description="Longitudinal Level Index (UI)")
    twist_index: Optional[float] = Field(None, ge=0.0, le=100.0, description="Twist Index (TI)")
    gauge_index: Optional[float] = Field(None, ge=0.0, le=100.0, description="Gauge Index (GI)")
    alignment_index: Optional[float] = Field(None, ge=0.0, le=100.0, description="Alignment Index (AI)")
    curvature_deg: Optional[float] = Field(None, ge=0.0, le=10.0, description="Degree of Curve (D)")


class RiskPredictionRequest(BaseModel):
    """Payload for maintenance request risk prediction."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    request_code: Optional[str] = Field(None, description="Maintenance Request Code (e.g. MR-TRK-104)")
    department: str = Field("TRACK", description="Department (TRACK, SIGNAL, TRACTION)")
    activity_type: Optional[str] = Field("RAIL_RENEWAL", description="Type of maintenance activity")
    priority: Optional[str] = Field("MEDIUM", description="Priority string (LOW, MEDIUM, HIGH, CRITICAL)")
    deadline: Optional[str] = Field(None, description="Target statutory deadline YYYY-MM-DD")
    scoring_mode: Optional[str] = Field("AUTO", description="Scoring mode override (AUTO, MODE_1, MODE_2)")

    # Direct defect parameters with statutory bounds
    tgi_deviation: Optional[float] = Field(None, ge=0.0, le=100.0, description="Track Geometry Index Deviation (0-100)")
    speed_restriction_kmh: Optional[float] = Field(None, ge=0.0, le=120.0, description="Speed Restriction Delta (0-120 km/h)")
    days_overdue: Optional[float] = Field(None, ge=0.0, le=60.0, description="Days maintenance overdue (0-60)")
    section_gmt_density: Optional[float] = Field(None, ge=5.0, le=150.0, description="Section GMT Density (5-150 GMT)")
    point_failure_risk: Optional[float] = Field(None, ge=0.0, le=100.0, description="S&T Point Failure Risk (0-100)")
    ohe_insulator_wear: Optional[float] = Field(None, ge=0.0, le=100.0, description="TRD OHE Insulator Wear (0-100)")
    usfd_flaw_severity: Optional[float] = Field(None, ge=0.0, le=4.0, description="USFD flaw severity ordinal (0-4)")
    usfd_classification: Optional[str] = Field(None, description="Statutory USFD class: Good, OBS, OBSW, IMR, IMRW")

    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        alias="metadata_json",
        description="Defect parameters dictionary",
    )

    @model_validator(mode="after")
    def validate_metadata_bounds(self) -> RiskPredictionRequest:
        """Ensure all defect parameters in metadata_json respect domain bounds."""
        meta = self.metadata or {}
        for key, (low, high) in FEATURE_BOUNDS.items():
            val = meta.get(key)
            if val is not None:
                try:
                    fval = float(val)
                    if fval < low or fval > high:
                        raise ValueError(
                            f"Field '{key}' in metadata value {fval} is outside allowed domain bounds [{low}, {high}]"
                        )
                except (ValueError, TypeError) as e:
                    if isinstance(e, ValueError) and "outside allowed domain bounds" in str(e):
                        raise
                    pass
        return self


class SHAPExplanationSchema(BaseModel):
    """SHAP Explainability feature attributions."""
    model_config = ConfigDict(extra="allow")

    space: str = Field("probability", description="Attribution space (probability)")
    base_value: float = Field(..., description="Base model prediction baseline in probability space")
    feature_attributions: Dict[str, float] = Field(default_factory=dict, description="Feature attribution impact values")
    human_readable_reasoning: str = Field(..., description="Human readable explanation tailored for Section Controllers")


class RiskPredictionResponse(BaseModel):
    """Response containing Criticality Index, failure probability, active model identifier, and SHAP explanation."""
    model_config = ConfigDict(extra="allow", protected_namespaces=())

    request_code: Optional[str] = Field(None, description="Maintenance request identifier")
    failure_probability: float = Field(..., ge=0.0, le=1.0, description="Predicted 30-day failure probability (0.0 to 1.0)")
    criticality_index: float = Field(..., ge=0.0, le=100.0, description="Criticality Index score (0 to 100)")
    model_used: str = Field(..., description="Active model or formula identifier (e.g. xgb_isotonic_ci_v1, rule_based_v1)")
    shap_explanation: SHAPExplanationSchema = Field(..., description="Explainability attribution breakdown")
    scoring_mode: Optional[str] = Field(None, description="Active scoring mode: MODE_1 or MODE_2")
    extracted_features: Optional[Dict[str, Any]] = Field(None, description="Extracted numerical feature vector")


class ModelInfoResponse(BaseModel):
    """Stage 2 AI Engine metadata and operational status."""
    model_config = ConfigDict(extra="allow", protected_namespaces=())

    model_name: Optional[str] = Field("xgb_isotonic_ci_v1", description="Model name")
    version: Optional[str] = Field("criticality_v1", description="Model version tag")
    status: Optional[str] = Field("ready", description="ready | degraded")
    created_at: Optional[str] = None
    seed: Optional[int] = None
    library_versions: Optional[Dict[str, str]] = None
    feature_order: Optional[List[str]] = None
    bounds: Optional[Dict[str, List[float]]] = None
    base_positive_rate: Optional[float] = None
    cv_splits: Optional[int] = None
    cv_grouping: Optional[str] = None
    metrics: Optional[Dict[str, float]] = None
    disclaimer: Optional[str] = None
    artifact_sha256: Optional[str] = None
