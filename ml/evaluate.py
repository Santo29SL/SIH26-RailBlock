"""Evaluate the exported RailBlock model on a deterministic holdout set."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

sys.path.insert(0, str(Path(__file__).parent))
from data.synthetic_generator import FEATURE_COLUMNS, TARGET_COLUMN, generate_dataset  # noqa: E402


def evaluate() -> dict:
    root = Path(__file__).resolve().parents[1]
    model = joblib.load(root / "backend" / "data" / "ml_models" / "criticality_xgboost_v1.joblib")
    holdout = generate_dataset(2_500, seed=2026)
    X, y = holdout[FEATURE_COLUMNS], holdout[TARGET_COLUMN]
    prediction = model.predict(X)
    importance = permutation_importance(model, X, y, n_repeats=3, random_state=42, n_jobs=-1)
    report = {
        "r2": float(r2_score(y, prediction)),
        "rmse": float(mean_squared_error(y, prediction) ** 0.5),
        "mae": float(mean_absolute_error(y, prediction)),
        "feature_importance": dict(sorted(zip(FEATURE_COLUMNS, map(float, importance.importances_mean)), key=lambda x: x[1], reverse=True)),
    }
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    evaluate()
