"""Tests for Stage 2: AI Risk & Criticality Scoring Engine (XGBoost + SHAP)."""

from __future__ import annotations

from datetime import date

import pytest
from httpx import AsyncClient

from app.services.ml_risk_engine import RiskScoringEngine, risk_engine


def test_risk_engine_initialization():
    """Verify RiskScoringEngine initializes XGBoost model and SHAP explainer."""
    engine = RiskScoringEngine()
    assert engine.model is not None
    assert engine.explainer is not None


def test_extract_features_dict():
    """Verify feature extraction from input dictionary."""
    req = {
        "department": "TRACK",
        "deadline": "2026-08-20",
        "metadata_json": {
            "tgi_deviation": 85.0,
            "speed_restriction_kmh": 45.0,
            "usfd_flaw_severity": 2.0,
            "section_gmt_density": 75.0,
        },
    }
    target_date = date(2026, 8, 25)
    feats = risk_engine.extract_features(req, target_date=target_date)

    assert feats["tgi_deviation"] == 85.0
    assert feats["speed_restriction_kmh"] == 45.0
    assert feats["days_overdue"] == 5.0  # 25 - 20 = 5 days
    assert feats["usfd_flaw_severity"] == 2.0
    assert feats["department_code"] == 0.0  # TRACK


def test_predict_risk_bounds_and_shap():
    """Verify prediction returns valid Criticality Index (0-100) and SHAP attributions."""
    req = {
        "department": "SIGNAL",
        "metadata_json": {
            "tgi_deviation": 90.0,
            "speed_restriction_kmh": 60.0,
            "usfd_flaw_severity": 3.0,
            "days_overdue": 10,
            "point_failure_risk": 80.0,
        },
    }

    result = risk_engine.predict_risk(req)

    assert "criticality_index" in result
    ci = result["criticality_index"]
    assert 0.0 <= ci <= 100.0
    assert result["model_used"] == "xgboost_shap_v1"

    shap_exp = result["shap_explanation"]
    assert "base_value" in shap_exp
    assert "feature_attributions" in shap_exp
    assert "human_readable_reasoning" in shap_exp
    assert len(shap_exp["feature_attributions"]) > 0
    assert isinstance(shap_exp["human_readable_reasoning"], str)
    assert len(shap_exp["human_readable_reasoning"]) > 10


@pytest.mark.asyncio
async def test_risk_scoring_api_predict(client: AsyncClient):
    """Test POST /api/v1/risk/predict endpoint."""
    payload = {
        "department": "TRACK",
        "activity_type": "RAIL_RENEWAL",
        "priority": "HIGH",
        "metadata_json": {
            "tgi_deviation": 78.5,
            "speed_restriction_kmh": 30.0,
            "usfd_flaw_severity": 2.0,
            "days_overdue": 4,
        },
    }

    response = await client.post("/api/v1/risk/predict", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "criticality_index" in data
    assert 0.0 <= data["criticality_index"] <= 100.0
    assert data["model_used"] == "xgboost_shap_v1"
    assert "shap_explanation" in data
    assert "human_readable_reasoning" in data["shap_explanation"]
    assert "extracted_features" in data


@pytest.mark.asyncio
async def test_risk_scoring_api_model_info(client: AsyncClient):
    """Test GET /api/v1/risk/model-info endpoint."""
    response = await client.get("/api/v1/risk/model-info")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ready"
    assert data["algorithm"] == "XGBoost Regressor + SHAP TreeExplainer"
    assert "features" in data
    assert len(data["features"]) == 8
