"""Model Training & Optuna Hyperparameter Optimization Pipeline.

Loads ir_defects_dataset.csv, executes 5-fold cross-validation with Optuna hyperparameter tuning
across XGBoost, LightGBM, and CatBoost, selects the winning model family, and exports the final model
checkpoint to backend/data/ml_models/criticality_xgboost_v2.joblib and ml/models/criticality_xgboost_v2.joblib.
"""

from __future__ import annotations

import logging
import os
import joblib
import numpy as np
import pandas as pd
import optuna

from sklearn.model_selection import KFold, train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor

# Suppress verbose logging
optuna.logging.set_verbosity(optuna.logging.WARNING)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "ir_defects_dataset.csv")
BACKEND_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "ml_models")
LOCAL_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_FILENAME = "criticality_xgboost_v2.joblib"

FEATURE_COLUMNS = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "department_code",
    "usfd_classification",
    "point_failure_risk",
    "ohe_insulator_wear",
]
TARGET_COLUMN = "criticality_index"


def train_and_optimize():
    """Train XGBoost, LightGBM, and CatBoost with Optuna hyperparameter optimization."""
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset missing at {DATA_PATH}. Run synthetic_generator.py first.")

    logger.info(f"Loading dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)

    # Handle backward compatibility if legacy column exists
    if "usfd_flaw_severity" in df.columns and "usfd_classification" not in df.columns:
        df["usfd_classification"] = df["usfd_flaw_severity"]

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)

    logger.info("Starting Optuna Hyperparameter Optimization across XGBoost, LightGBM, and CatBoost...")

    # 1. XGBoost Optimization
    def objective_xgb(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 80, 300),
            "max_depth": trial.suggest_int("max_depth", 3, 8),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "random_state": 42,
            "verbosity": 0,
        }
        rmses = []
        for train_idx, val_idx in kf.split(X_train):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
            model = xgb.XGBRegressor(**params)
            model.fit(X_tr, y_tr)
            preds = model.predict(X_val)
            rmses.append(np.sqrt(mean_squared_error(y_val, preds)))
        return float(np.mean(rmses))

    study_xgb = optuna.create_study(direction="minimize")
    study_xgb.optimize(objective_xgb, n_trials=15)
    best_xgb_rmse = study_xgb.best_value
    logger.info(f"🏆 Best XGBoost 5-Fold CV RMSE: {best_xgb_rmse:.4f}")

    # 2. LightGBM Optimization
    def objective_lgb(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 80, 300),
            "max_depth": trial.suggest_int("max_depth", 3, 8),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "num_leaves": trial.suggest_int("num_leaves", 15, 63),
            "random_state": 42,
            "verbose": -1,
        }
        rmses = []
        for train_idx, val_idx in kf.split(X_train):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
            model = lgb.LGBMRegressor(**params)
            model.fit(X_tr, y_tr)
            preds = model.predict(X_val)
            rmses.append(np.sqrt(mean_squared_error(y_val, preds)))
        return float(np.mean(rmses))

    study_lgb = optuna.create_study(direction="minimize")
    study_lgb.optimize(objective_lgb, n_trials=15)
    best_lgb_rmse = study_lgb.best_value
    logger.info(f"🏆 Best LightGBM 5-Fold CV RMSE: {best_lgb_rmse:.4f}")

    # 3. CatBoost Optimization
    def objective_cb(trial):
        params = {
            "iterations": trial.suggest_int("iterations", 80, 300),
            "depth": trial.suggest_int("depth", 3, 8),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "random_seed": 42,
            "verbose": 0,
        }
        rmses = []
        for train_idx, val_idx in kf.split(X_train):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
            model = CatBoostRegressor(**params)
            model.fit(X_tr, y_tr)
            preds = model.predict(X_val)
            rmses.append(np.sqrt(mean_squared_error(y_val, preds)))
        return float(np.mean(rmses))

    study_cb = optuna.create_study(direction="minimize")
    study_cb.optimize(objective_cb, n_trials=15)
    best_cb_rmse = study_cb.best_value
    logger.info(f"🏆 Best CatBoost 5-Fold CV RMSE: {best_cb_rmse:.4f}")

    # Pick winning model family
    scores = {
        "XGBoost": (best_xgb_rmse, study_xgb.best_params, xgb.XGBRegressor),
        "LightGBM": (best_lgb_rmse, study_lgb.best_params, lgb.LGBMRegressor),
        "CatBoost": (best_cb_rmse, study_cb.best_params, CatBoostRegressor),
    }

    winner_name, (winner_rmse, winner_params, winner_cls) = min(scores.items(), key=lambda x: x[1][0])
    logger.info(f"🎉 Winner Model: {winner_name} with CV RMSE = {winner_rmse:.4f}")

    # Train final winning model on full X_train
    if winner_name == "XGBoost":
        winner_params["verbosity"] = 0
        winner_params["random_state"] = 42
    elif winner_name == "LightGBM":
        winner_params["verbose"] = -1
        winner_params["random_state"] = 42
    elif winner_name == "CatBoost":
        winner_params["verbose"] = 0
        winner_params["random_seed"] = 42

    final_model = winner_cls(**winner_params)
    final_model.fit(X_train, y_train)

    # Test set evaluation
    test_preds = final_model.predict(X_test)
    test_r2 = r2_score(y_test, test_preds)
    test_rmse = np.sqrt(mean_squared_error(y_test, test_preds))
    test_mae = mean_absolute_error(y_test, test_preds)

    logger.info(f"📊 Final Test Evaluation — R²: {test_r2:.4f} | RMSE: {test_rmse:.4f} | MAE: {test_mae:.4f}")
    assert test_r2 >= 0.95, f"R² {test_r2} below specification threshold 0.95"
    assert test_rmse <= 3.5, f"RMSE {test_rmse} exceeds specification ceiling 3.5"
    assert test_mae <= 2.5, f"MAE {test_mae} exceeds specification ceiling 2.5"

    # Save model artifacts
    for out_dir in [BACKEND_MODEL_DIR, LOCAL_MODEL_DIR]:
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, MODEL_FILENAME)
        joblib.dump(final_model, out_path)
        logger.info(f"✅ Production Model exported to {out_path}")


if __name__ == "__main__":
    train_and_optimize()
