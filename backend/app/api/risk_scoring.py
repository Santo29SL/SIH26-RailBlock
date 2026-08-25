"""Stage 2: AI Risk & Criticality Scoring API Endpoints.

Provides REST APIs for XGBoost + SHAP risk scoring predictions and feature attributions.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.services.ml_risk_engine import FEATURE_COLUMNS, risk_engine

router = APIRouter(prefix="/risk", tags=["Stage 2 — AI Risk & Criticality Scoring"])


class RiskPredictionRequest(BaseModel):
    """Payload for maintenance request risk prediction."""

    department: str = Field("TRACK", description="Department (TRACK, SIGNAL, TRACTION)")
    activity_type: str = Field("RAIL_RENEWAL", description="Type of maintenance activity")
    priority: Optional[str] = Field("MEDIUM", description="Priority string")
    deadline: Optional[str] = Field(None, description="Target deadline YYYY-MM-DD")
    metadata_json: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Defect telemetry parameters (tgi_deviation, speed_restriction_kmh, usfd_flaw_severity, etc.)",
    )


class SHAPExplanationSchema(BaseModel):
    """SHAP Explainability feature attributions."""

    base_value: float = Field(..., description="Base model prediction baseline")
    feature_attributions: Dict[str, float] = Field(..., description="Feature attribution weights")
    human_readable_reasoning: str = Field(..., description="Human readable explanation for controllers")


class RiskPredictionResponse(BaseModel):
    """Response containing ML predicted criticality index and SHAP explanation."""

    model_config = ConfigDict(protected_namespaces=())

    criticality_index: float = Field(..., description="Predicted Criticality Index score (0 to 100)")
    model_used: str = Field(..., description="Model identifier used for scoring")
    shap_explanation: SHAPExplanationSchema = Field(..., description="SHAP feature attribution breakdown")
    extracted_features: Dict[str, float] = Field(..., description="Extracted feature vector fed into model")


@router.post(
    "/predict",
    response_model=RiskPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Risk & Criticality Score with SHAP Explanation",
    description=(
        "Evaluates a maintenance request using XGBoost Gradient Boosted Trees and SHAP XAI. "
        "Returns dynamic Criticality Index (0-100) and human-readable feature impact reasoning."
    ),
)
async def predict_request_risk(req: RiskPredictionRequest) -> RiskPredictionResponse:
    """Predict risk score using Stage 2 ML engine."""
    try:
        req_dict = req.model_dump()
        extracted = risk_engine.extract_features(req_dict)
        prediction = risk_engine.predict_risk(req_dict)

        return RiskPredictionResponse(
            criticality_index=prediction["criticality_index"],
            model_used=prediction["model_used"],
            shap_explanation=SHAPExplanationSchema(**prediction["shap_explanation"]),
            extracted_features=extracted,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate risk score: {str(exc)}",
        ) from exc


@router.get(
    "/model-info",
    status_code=status.HTTP_200_OK,
    summary="Get Stage 2 Risk Model & SHAP Metadata",
)
async def get_model_info():
    """Return model status and feature definitions."""
    return {
        "stage": "Stage 2: AI Risk & Criticality Scoring Engine",
        "status": "ready" if risk_engine.model is not None else "degraded",
        "algorithm": "XGBoost Regressor + SHAP TreeExplainer",
        "features": FEATURE_COLUMNS,
        "version": "1.0.0",
    }
