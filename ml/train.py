"""Train, compare and export the RailBlock criticality model."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import KFold, cross_validate, train_test_split
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).parent))
from data.synthetic_generator import FEATURE_COLUMNS, TARGET_COLUMN, generate_dataset  # noqa: E402


def candidate_models(seed: int) -> dict[str, object]:
    models: dict[str, object] = {
        "xgboost": XGBRegressor(
            n_estimators=450, max_depth=5, learning_rate=0.055, subsample=0.9,
            colsample_bytree=0.9, objective="reg:squarederror", n_jobs=-1, random_state=seed,
        )
    }
    try:
        from lightgbm import LGBMRegressor

        models["lightgbm"] = LGBMRegressor(
            n_estimators=450, num_leaves=31, learning_rate=0.05,
            subsample=0.9, colsample_bytree=0.9, verbosity=-1, random_state=seed,
        )
    except ImportError:
        print("LightGBM not installed; continuing with XGBoost.")
    return models


def train(samples: int = 10_000, seed: int = 42) -> dict:
    data = generate_dataset(samples, seed)
    X, y = data[FEATURE_COLUMNS], data[TARGET_COLUMN]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=seed)
    cv = KFold(n_splits=5, shuffle=True, random_state=seed)
    scoring = {"r2": "r2", "rmse": "neg_root_mean_squared_error", "mae": "neg_mean_absolute_error"}

    results: dict[str, dict[str, float]] = {}
    models = candidate_models(seed)
    for name, model in models.items():
        scores = cross_validate(model, X_train, y_train, cv=cv, scoring=scoring, n_jobs=1)
        results[name] = {
            "cv_r2": float(np.mean(scores["test_r2"])),
            "cv_rmse": float(-np.mean(scores["test_rmse"])),
            "cv_mae": float(-np.mean(scores["test_mae"])),
        }

    winner_name = max(results, key=lambda name: results[name]["cv_r2"])
    winner = models[winner_name]
    winner.fit(X_train, y_train)
    predictions = winner.predict(X_test)
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    results[winner_name].update(
        test_r2=float(r2_score(y_test, predictions)),
        test_rmse=float(mean_squared_error(y_test, predictions) ** 0.5),
        test_mae=float(mean_absolute_error(y_test, predictions)),
    )

    model_dir = ROOT / "backend" / "data" / "ml_models"
    local_dir = Path(__file__).parent / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    local_dir.mkdir(parents=True, exist_ok=True)
    artifact = model_dir / "criticality_xgboost_v1.joblib"
    # Serving uses SHAP TreeExplainer; both candidates are supported tree models.
    joblib.dump(winner, artifact)
    joblib.dump(winner, local_dir / "criticality_model.joblib")
    report = {"winner": winner_name, "samples": samples, "features": FEATURE_COLUMNS, "results": results}
    (local_dir / "training_metrics.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    data.to_csv(Path(__file__).parent / "data" / "criticality_dataset.csv", index=False)
    print(json.dumps(report, indent=2))
    print(f"Exported: {artifact}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    train(args.samples, args.seed)
