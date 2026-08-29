"""Test feature encoding and domain bounds validation."""

import json
from pydantic import ValidationError
import pytest
from ml.config import ARTIFACT_DIR, BOUNDS, CONTINUOUS_FEATURES, DEPARTMENTS, USFD_ENUM
from ml.explainer import RiskExplainer
from app.schemas.risk import RiskPredictionRequest


def test_schema_and_bounds_structure():
    """Verify artifact schema matches configuration bounds and enums."""
    schema_path = ARTIFACT_DIR / "schema.json"
    enums_path = ARTIFACT_DIR / "enums.json"

    assert schema_path.exists(), "schema.json missing"
    assert enums_path.exists(), "enums.json missing"

    with open(schema_path, "r") as f:
        schema = json.load(f)

    with open(enums_path, "r") as f:
        enums = json.load(f)

    # Check bounds
    for feat, (low, high) in BOUNDS.items():
        assert feat in schema["bounds"]
        assert schema["bounds"][feat] == [low, high]

    # Check USFD enum mapping: Good=0 to IMRW=4
    assert enums["usfd_enum"] == {"Good": 0, "OBS": 1, "OBSW": 2, "IMR": 3, "IMRW": 4}
    assert enums["departments"] == DEPARTMENTS


def test_explainer_feature_encoding():
    """Test feature dictionary encoding with various input formats."""
    explainer = RiskExplainer()

    feat_sample = {
        "tgi_deviation": 82.5,
        "speed_restriction_kmh": 80.0,
        "days_overdue": 14.0,
        "section_gmt_density": 45.2,
        "department": "TRACK",
        "usfd_classification": "IMRW",
    }

    df_row = explainer.encode_feature_dict(feat_sample)
    assert df_row["usfd_flaw_severity"].iloc[0] == 4.0
    assert df_row["department_code_TRACK"].iloc[0] == 1.0
    assert df_row["department_code_SIGNAL"].iloc[0] == 0.0
    assert df_row["department_code_TRACTION"].iloc[0] == 0.0
    assert df_row["tgi_deviation"].iloc[0] == 82.5


def test_pydantic_bounds_validation_out_of_range():
    """Verify that payloads with out-of-range features raise Pydantic ValidationError (422)."""
    # 1. Valid payload succeeds
    valid_req = RiskPredictionRequest(
        request_code="MR-TRK-104",
        department="TRACK",
        tgi_deviation=82.5,
        speed_restriction_kmh=80.0,
        days_overdue=14.0,
        section_gmt_density=45.2,
    )
    assert valid_req.tgi_deviation == 82.5

    # 2. tgi_deviation > 100
    with pytest.raises(ValidationError):
        RiskPredictionRequest(tgi_deviation=150.0)

    # 3. speed_restriction_kmh > 120
    with pytest.raises(ValidationError):
        RiskPredictionRequest(speed_restriction_kmh=180.0)

    # 4. section_gmt_density < 5
    with pytest.raises(ValidationError):
        RiskPredictionRequest(section_gmt_density=2.0)

    # 5. section_gmt_density > 150
    with pytest.raises(ValidationError):
        RiskPredictionRequest(section_gmt_density=250.0)

    # 6. days_overdue > 60
    with pytest.raises(ValidationError):
        RiskPredictionRequest(days_overdue=90.0)

    # 7. point_failure_risk > 100
    with pytest.raises(ValidationError):
        RiskPredictionRequest(point_failure_risk=120.0)

    # 8. usfd_flaw_severity > 4
    with pytest.raises(ValidationError):
        RiskPredictionRequest(usfd_flaw_severity=5.0)

    # 9. Out-of-bounds inside metadata_json raises ValidationError
    with pytest.raises(ValidationError):
        RiskPredictionRequest(metadata={"tgi_deviation": 150.0})

    with pytest.raises(ValidationError):
        RiskPredictionRequest(metadata={"speed_restriction_kmh": 200.0})

    with pytest.raises(ValidationError):
        RiskPredictionRequest(metadata={"section_gmt_density": 1.0})

