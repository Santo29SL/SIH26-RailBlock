"""Stage 2 AI Risk & Criticality Scoring Schemas.

Covers:
- Statutory USFD classifications (Good, OBS, OBSW, IMR, IMRW)
- Scoring Mode Selection (AUTO, MODE_1_DETERMINISTIC, MODE_2_ML_SHAP)
- Raw TRC Track Geometry inputs
- Risk Prediction Request and Response schemas
- Model Info metadata response
"""

from __future__ import annotations

import enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


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
    MODE_2_ML_SHAP = "MODE_2"                   # Gradient Boosted Trees (XGBoost/LightGBM/CatBoost) + SHAP


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
    model_config = ConfigDict(populate_by_name=True)

    request_code: Optional[str] = Field(None, description="Maintenance Request Code (e.g. MR-TRK-104)")
    department: str = Field("TRACK", description="Department (TRACK, SIGNAL, TRACTION)")
    activity_type: str = Field("RAIL_RENEWAL", description="Type of maintenance activity")
    priority: Optional[str] = Field("MEDIUM", description="Priority string (LOW, MEDIUM, HIGH, CRITICAL)")
    deadline: Optional[str] = Field(None, description="Target statutory deadline YYYY-MM-DD")
    scoring_mode: ScoringModeEnum = Field(default=ScoringModeEnum.AUTO, description="Scoring mode override")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        alias="metadata_json",
        description="Defect parameters: tgi_deviation, speed_restriction_kmh, usfd_classification, days_overdue, etc.",
    )


class SHAPExplanationSchema(BaseModel):
    """SHAP / Mode 1 Explainability feature attributions."""
    base_value: float = Field(..., description="Base model prediction baseline or Mode 1 intercept")
    feature_attributions: Dict[str, float] = Field(default_factory=dict, description="Feature attribution impact points")
    human_readable_reasoning: str = Field(..., description="Human readable explanation tailored for Section Controllers")


class RiskPredictionResponse(BaseModel):
    """Response containing Criticality Index, active model identifier, and SHAP explanation."""
    model_config = ConfigDict(protected_namespaces=())

    request_code: Optional[str] = Field(None, description="Maintenance request identifier")
    criticality_index: float = Field(..., ge=0.0, le=100.0, description="Criticality Index score (0 to 100)")
    model_used: str = Field(..., description="Active model or formula identifier (e.g. xgboost_shap_v2, mode1_deterministic_v1)")
    scoring_mode: str = Field(..., description="Active scoring mode: MODE_1 or MODE_2")
    shap_explanation: SHAPExplanationSchema = Field(..., description="Explainability attribution breakdown")
    extracted_features: Dict[str, float] = Field(..., description="Extracted numerical feature vector")


class ModelInfoResponse(BaseModel):
    """Stage 2 AI Engine metadata and operational status."""
    model_config = ConfigDict(protected_namespaces=())

    stage: str = "Stage 2: AI Risk & Criticality Scoring Engine"
    status: str = Field(..., description="ready | degraded")
    active_scoring_mode: str = Field(..., description="MODE_1_DETERMINISTIC | MODE_2_ML_SHAP")
    algorithm: str = Field(..., description="Algorithm and explainer name")
    features: list[str] = Field(..., description="Feature columns used by model")
    supported_usfd_classes: list[str] = Field(..., description="Supported USFD flaw classifications")
    version: str = Field(..., description="Model version tag")
