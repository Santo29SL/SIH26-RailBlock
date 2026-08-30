"""Stage 2: AI Risk & Criticality Scoring API Endpoints.

Provides REST APIs for Two-Mode Risk Scoring (Mode 1 Deterministic & Mode 2 XGBoost + SHAP).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas.risk import (
    ModelInfoResponse,
    RiskPredictionRequest,
    RiskPredictionResponse,
    SHAPExplanationSchema,
)
from app.services.ml_risk_engine import risk_engine

router = APIRouter(prefix="/risk", tags=["Stage 2 — AI Risk & Criticality Scoring"])


@router.post(
    "/predict",
    response_model=RiskPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Risk & Criticality Score with SHAP Explanation",
    description=(
        "Evaluates a maintenance request using the Two-Mode AI Risk Engine (Mode 1 Deterministic or "
        "Mode 2 Gradient Boosted Trees + SHAP XAI). Returns dynamic Criticality Index (0-100) and feature attributions."
    ),
)
async def predict_request_risk(req: RiskPredictionRequest) -> RiskPredictionResponse:
    """Predict risk score using Stage 2 ML engine."""
    try:
        req_dict = req.model_dump(by_alias=True)
        mode = req.scoring_mode if isinstance(req.scoring_mode, str) else req.scoring_mode.value if req.scoring_mode else "AUTO"
        prediction = risk_engine.predict_risk(req_dict, scoring_mode=mode)

        return RiskPredictionResponse(
            request_code=prediction.get("request_code"),
            failure_probability=prediction["failure_probability"],
            criticality_index=prediction["criticality_index"],
            model_used=prediction["model_used"],
            scoring_mode=prediction.get("scoring_mode"),
            shap_explanation=SHAPExplanationSchema(**prediction["shap_explanation"]),
            extracted_features=prediction.get("extracted_features"),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate risk score: {str(exc)}",
        ) from exc


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Stage 2 Risk Model & SHAP Metadata",
)
async def get_model_info() -> ModelInfoResponse:
    """Return model status, active mode, and model card metadata."""
    card = risk_engine.get_model_card()
    return ModelInfoResponse(**card)


