"""Test deterministic rule-based fallback when artifact bundle is missing."""

from pathlib import Path
import tempfile
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.ml_risk_engine import RiskScoringEngine, rule_based_ci


def test_rule_based_ci_direct():
    """Verify v1 rule-based formula calculation and breakdown."""
    # CI = 0.30·tgi_deviation + 0.25·speed_restriction_kmh/1.2 + 0.20·min(days_overdue,60)/60·100 + 0.15·section_gmt_density/1.5 + severity_penalty
    sample = {
        "tgi_deviation": 82.5,
        "speed_restriction_kmh": 80.0,
        "days_overdue": 14.0,
        "section_gmt_density": 45.2,
        "usfd_flaw_severity": 3,  # IMR -> 25 penalty
    }
    ci, breakdown = rule_based_ci(sample)
    assert 0.0 <= ci <= 100.0
    assert breakdown["usfd_severity_penalty"] == 25.0
    assert breakdown["tgi_deviation"] == round(0.30 * 82.5, 2)
    assert breakdown["speed_restriction_kmh"] == round(0.25 * (80.0 / 1.2), 2)
    assert breakdown["days_overdue"] == round(0.20 * (14.0 / 60.0) * 100.0, 2)
    assert breakdown["section_gmt_density"] == round(0.15 * (45.2 / 1.5), 2)


def test_risk_scoring_engine_fallback_on_missing_bundle():
    """Verify RiskScoringEngine gracefully falls back to rule_based_v1 when artifacts directory is empty or missing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = RiskScoringEngine(artifact_dir=Path(tmpdir))
        assert not engine.is_ready(), "Engine should not be marked ready when artifacts are missing"
        assert engine.model_version == "criticality_v1"

        res = engine.predict_risk({
            "request_code": "MR-FALLBACK-01",
            "tgi_deviation": 50.0,
            "speed_restriction_kmh": 30.0,
            "days_overdue": 10.0,
            "section_gmt_density": 50.0,
            "usfd_flaw_severity": 1,  # OBS -> 5 penalty
        })

        assert res["model_used"] == "rule_based_v1"
        assert res["scoring_mode"] == "MODE_1"
        assert "criticality_index" in res
        assert "failure_probability" in res
        assert 0.0 <= res["criticality_index"] <= 100.0
        assert 0.0 <= res["failure_probability"] <= 1.0
        assert res["shap_explanation"]["space"] == "probability"
        assert "human_readable_reasoning" in res["shap_explanation"]
        assert "rule_based_v1" in res["shap_explanation"]["human_readable_reasoning"]


@pytest.mark.asyncio
async def test_fallback_api_endpoint():
    """Verify POST /api/v1/risk/predict returns HTTP 200 with model_used='rule_based_v1' in fallback mode."""
    with tempfile.TemporaryDirectory() as tmpdir:
        fallback_engine = RiskScoringEngine(artifact_dir=Path(tmpdir))
        import app.api.risk_scoring as rs_module
        original_engine = rs_module.risk_engine
        rs_module.risk_engine = fallback_engine

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.post(
                    "/api/v1/risk/predict",
                    json={
                        "request_code": "MR-FALLBACK-02",
                        "department": "TRACK",
                        "tgi_deviation": 60.0,
                        "speed_restriction_kmh": 40.0,
                        "days_overdue": 20.0,
                        "section_gmt_density": 70.0,
                        "usfd_classification": "OBSW",
                    },
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["model_used"] == "rule_based_v1"
                assert "criticality_index" in data
                assert "failure_probability" in data
                assert data["shap_explanation"]["space"] == "probability"

                # Check model-info in fallback mode
                info_resp = await ac.get("/api/v1/risk/model-info")
                assert info_resp.status_code == 200
                info_data = info_resp.json()
                assert info_data["status"] == "degraded"
                assert info_data["version"] == "rule_based_v1"
        finally:
            rs_module.risk_engine = original_engine
