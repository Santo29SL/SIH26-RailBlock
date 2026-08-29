"""Tests for Stage 2: AI Risk & Criticality Scoring Engine (Two-Mode Architecture & SHAP)."""

from __future__ import annotations

from datetime import date
import pytest
from httpx import AsyncClient

from app.services.ml_risk_engine import RiskScoringEngine, risk_engine


def test_risk_engine_initialization():
    """Verify RiskScoringEngine initializes correctly with active model or Mode 1 fallback."""
    engine = RiskScoringEngine()
    assert engine.model_version == "criticality_v1"
    assert engine.model_name == "xgb_isotonic_ci_v1"
    assert engine.is_ready() is True


def test_extract_features_usfd_string_mapping():
    """Verify statutory USFD string classifications are mapped to numeric codes."""
    # Test IMRW (Immediate Removal Weld) -> code 4
    req_imrw = {
        "department": "TRACK",
        "deadline": "2026-08-20",
        "metadata": {
            "tgi_deviation": 85.0,
            "speed_restriction_kmh": 45.0,
            "usfd_classification": "IMRW",
            "section_gmt_density": 75.0,
        },
    }
    feats_imrw = risk_engine.extract_features(req_imrw, target_date=date(2026, 8, 25))
    assert feats_imrw["usfd_flaw_severity"] == 4.0
    assert feats_imrw["days_overdue"] == 5.0

    # Test OBS (Observed Rail) -> code 1
    req_obs = {
        "department": "TRACK",
        "metadata": {"usfd_classification": "OBS"},
    }
    feats_obs = risk_engine.extract_features(req_obs)
    assert feats_obs["usfd_flaw_severity"] == 1.0


def test_extract_features_trc_geometry_derivation():
    """Verify TGI deviation is derived when raw TRC sub-indices are provided."""
    req_trc = {
        "department": "TRACK",
        "metadata": {
            "unevenness_index": 70.0,
            "twist_index": 75.0,
            "gauge_index": 80.0,
            "alignment_index": 65.0,
            "curvature_deg": 3.0,
        },
    }
    feats = risk_engine.extract_features(req_trc)
    assert "tgi_deviation" in feats
    assert 0.0 <= feats["tgi_deviation"] <= 100.0


def test_two_mode_scoring_consistency():
    """Verify Mode 1 and Mode 2 predictions return valid Criticality Index and attributions."""
    req = {
        "request_code": "MR-TRK-104",
        "department": "TRACK",
        "metadata": {
            "tgi_deviation": 82.5,
            "speed_restriction_kmh": 80.0,
            "usfd_classification": "IMRW",
            "days_overdue": 14.0,
            "section_gmt_density": 45.2,
        },
    }

    # 1. Mode 1 Explicit Prediction (Deterministic Fallback)
    res_m1 = risk_engine.predict_risk(req, scoring_mode="MODE_1")
    assert res_m1["scoring_mode"] == "MODE_1"
    assert res_m1["model_used"] == "rule_based_v1"
    assert 0.0 <= res_m1["criticality_index"] <= 100.0
    assert 0.0 <= res_m1["failure_probability"] <= 1.0
    assert res_m1["shap_explanation"]["space"] == "probability"
    assert "USFD rail flaw (IMRW)" in res_m1["shap_explanation"]["feature_attributions"]
    assert "rule_based_v1" in res_m1["shap_explanation"]["human_readable_reasoning"]

    # 2. Mode 2 Prediction (XGBoost + SHAP)
    res_m2 = risk_engine.predict_risk(req, scoring_mode="MODE_2")
    assert res_m2["scoring_mode"] == "MODE_2"
    assert res_m2["model_used"] == "xgb_isotonic_ci_v1"
    assert 0.0 <= res_m2["criticality_index"] <= 100.0
    assert 0.0 <= res_m2["failure_probability"] <= 1.0
    assert res_m2["shap_explanation"]["space"] == "probability"
    assert len(res_m2["shap_explanation"]["human_readable_reasoning"]) > 10


@pytest.mark.asyncio
async def test_risk_scoring_api_predict_contract(client: AsyncClient):
    """Test POST /api/v1/risk/predict endpoint matching specification Section 5 contract."""
    payload = {
        "request_code": "MR-TRK-104",
        "department": "TRACK",
        "activity_type": "RAIL_RENEWAL_USFD",
        "metadata_json": {
            "tgi_deviation": 82.5,
            "speed_restriction_kmh": 80.0,
            "days_overdue": 14,
            "section_gmt_density": 45.2,
            "usfd_classification": "IMRW",
            "point_failure_risk": 0.0,
            "ohe_insulator_wear": 0.0,
        },
    }

    response = await client.post("/api/v1/risk/predict", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["request_code"] == "MR-TRK-104"
    assert "failure_probability" in data
    assert "criticality_index" in data
    assert data["model_used"] == "xgb_isotonic_ci_v1"
    assert 0.0 <= data["failure_probability"] <= 1.0
    assert 0.0 <= data["criticality_index"] <= 100.0
    assert "shap_explanation" in data
    assert data["shap_explanation"]["space"] == "probability"
    assert "feature_attributions" in data["shap_explanation"]
    assert "human_readable_reasoning" in data["shap_explanation"]


@pytest.mark.asyncio
async def test_risk_scoring_api_model_info(client: AsyncClient):
    """Test GET /api/v1/risk/model-info endpoint."""
    response = await client.get("/api/v1/risk/model-info")
    assert response.status_code == 200

    data = response.json()
    assert data["version"] == "criticality_v1"
    assert "feature_order" in data
    assert len(data["feature_order"]) == 10
    assert "metrics" in data
    assert "artifact_sha256" in data
    assert "disclaimer" in data

