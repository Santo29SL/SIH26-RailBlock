"""Test prevention of target and group leakage into features."""

import json
import pandas as pd
import pytest
from ml.config import ARTIFACT_DIR, DATASET_PATH
from ml.train import encode_features


def test_feature_leakage_guards():
    """Assert that generator latent variables are strictly absent from feature sets."""
    df = pd.read_csv(DATASET_PATH)
    X, feature_order = encode_features(df)

    assert "hazard_prob" not in feature_order, "hazard_prob must never be in feature_order"
    assert "section_id" not in feature_order, "section_id must never be in feature_order"
    assert "failure_30d" not in feature_order, "failure_30d must never be in feature_order"

    schema_file = ARTIFACT_DIR / "schema.json"
    assert schema_file.exists(), "schema.json must exist in artifact directory"

    with open(schema_file, "r") as f:
        schema = json.load(f)

    exported_features = schema.get("feature_order", [])
    assert "hazard_prob" not in exported_features
    assert "section_id" not in exported_features
    assert "failure_30d" not in exported_features
