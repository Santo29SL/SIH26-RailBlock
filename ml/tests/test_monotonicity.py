"""Test monotonicity of trained model across bounded sweeps."""

import numpy as np
import pytest
from ml.config import BOUNDS, MONOTONE_POSITIVE
from ml.explainer import RiskExplainer


def test_monotone_positive_constraints():
    """Verify that increasing any monotone positive feature never decreases calibrated probability."""
    explainer = RiskExplainer()
    assert explainer.is_ready(), "RiskExplainer must be initialized"

    # Base nominal scenario
    nominal_feat = {
        "tgi_deviation": 50.0,
        "speed_restriction_kmh": 40.0,
        "days_overdue": 10.0,
        "section_gmt_density": 50.0,
        "department_code": "TRACK",
        "usfd_flaw_severity": 1,
        "point_failure_risk": 20.0,
        "ohe_insulator_wear": 20.0,
    }

    for feat in MONOTONE_POSITIVE:
        low, high = BOUNDS[feat]
        if feat == "usfd_flaw_severity":
            sweep_vals = [0, 1, 2, 3, 4]
        else:
            sweep_vals = np.linspace(low, high, 20).tolist()

        prev_prob = -1.0
        for val in sweep_vals:
            cur_feat = nominal_feat.copy()
            cur_feat[feat] = val
            df_row = explainer.encode_feature_dict(cur_feat)
            prob = float(explainer.calibrator.predict_proba(df_row)[:, 1][0])

            if prev_prob >= 0.0:
                # Due to monotone constraints and isotonic calibration, prob must be non-decreasing
                assert prob >= prev_prob - 1e-6, (
                    f"Monotonicity violation on feature '{feat}'! Value {val}: prob {prob:.4f} < prev {prev_prob:.4f}"
                )
            prev_prob = prob
