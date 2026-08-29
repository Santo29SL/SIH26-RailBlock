"""Test SHAP probability-space additivity."""

import numpy as np
import pytest
import xgboost as xgb
from ml.config import BOUNDS, DEPARTMENTS, SEED
from ml.explainer import RiskExplainer


def test_shap_probability_additivity():
    explainer = RiskExplainer()
    assert explainer.is_ready(), "RiskExplainer must be initialized"

    rng = np.random.default_rng(SEED)
    n_tests = 50

    for i in range(n_tests):
        raw_feat = {
            "tgi_deviation": float(rng.uniform(BOUNDS["tgi_deviation"][0], BOUNDS["tgi_deviation"][1])),
            "speed_restriction_kmh": float(rng.uniform(BOUNDS["speed_restriction_kmh"][0], BOUNDS["speed_restriction_kmh"][1])),
            "days_overdue": float(rng.uniform(BOUNDS["days_overdue"][0], BOUNDS["days_overdue"][1])),
            "section_gmt_density": float(rng.uniform(BOUNDS["section_gmt_density"][0], BOUNDS["section_gmt_density"][1])),
            "department_code": rng.choice(DEPARTMENTS),
            "usfd_flaw_severity": int(rng.choice([0, 1, 2, 3, 4])),
            "point_failure_risk": float(rng.uniform(BOUNDS["point_failure_risk"][0], BOUNDS["point_failure_risk"][1])),
            "ohe_insulator_wear": float(rng.uniform(BOUNDS["ohe_insulator_wear"][0], BOUNDS["ohe_insulator_wear"][1])),
        }

        df_row = explainer.encode_feature_dict(raw_feat)
        X_mat = df_row.to_numpy(dtype=np.float64)

        dmat = xgb.DMatrix(X_mat, feature_names=explainer.feature_order)
        raw_prob = float(explainer.booster.predict(dmat)[0])

        shap_res = explainer.explainer(X_mat)
        phi_sum = float(np.sum(shap_res.values[0]))
        base_val = float(explainer.explainer.expected_value)

        # Assert additivity: base + sum(phi) ≈ raw_prob within 1e-3
        err = abs((base_val + phi_sum) - raw_prob)
        assert err < 1e-3, f"Sample {i+1}: Additivity error {err:.2e} exceeded 1e-3"
