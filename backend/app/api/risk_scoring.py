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
    USFDClassificationEnum,
)
from app.services.ml_risk_engine import FEATURE_COLUMNS, risk_engine

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
        prediction = risk_engine.predict_risk(req_dict, scoring_mode=req.scoring_mode.value)

        return RiskPredictionResponse(
            request_code=prediction.get("request_code"),
            criticality_index=prediction["criticality_index"],
            model_used=prediction["model_used"],
            scoring_mode=prediction["scoring_mode"],
            shap_explanation=SHAPExplanationSchema(**prediction["shap_explanation"]),
            extracted_features=prediction["extracted_features"],
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
    """Return model status, active mode, and feature definitions."""
    has_model = risk_engine.model is not None
    return ModelInfoResponse(
        stage="Stage 2: AI Risk & Criticality Scoring Engine",
        status="ready" if has_model else "degraded",
        active_scoring_mode="MODE_2_ML_SHAP" if has_model else "MODE_1_DETERMINISTIC",
        algorithm=risk_engine.algorithm_name,
        features=FEATURE_COLUMNS,
        supported_usfd_classes=[e.value for e in USFDClassificationEnum],
        version=risk_engine.model_version,
    )

