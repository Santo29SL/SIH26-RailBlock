"""Model Training & Calibration Pipeline for RailBlock Criticality Scoring.

Implements Phase 2 training specifications:
- Manual feature encoding with pandas (one-hot department_code, ordinal usfd_flaw_severity).
- Group-disjoint calibration split reservation.
- StratifiedGroupKFold(5) cross-validation grouped by section_id.
- Monotone-constrained XGBoost and LightGBM binary classifiers (max_bin=512, eval_metric=aucpr).
- Isotonic post-hoc probability calibration (CalibratedClassifierCV, cv="prefit").
- Percentile Criticality Index mapping (ci_map.json).
- Native artifact bundle export to backend/data/ml_models/criticality_v1/ with SHA-256 checksummed Model Card.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import average_precision_score
from sklearn.model_selection import StratifiedGroupKFold
import xgboost as xgb

# Add repo root to path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.config import (
    ARTIFACT_DIR,
    BOUNDS,
    CONTINUOUS_FEATURES,
    DATASET_PATH,
    DEPARTMENTS,
    MONOTONE_POSITIVE,
    ORDINAL_FEATURES,
    SEED,
    USFD_ENUM,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def compute_sha256(filepath: Path | str) -> str:
    """Compute SHA-256 hex digest of a file."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def encode_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Manually encode features with pandas without ColumnTransformer/Pipeline.

    Returns:
        Encoded feature DataFrame and canonical feature_order list.
    """
    # 1. Continuous features
    continuous_df = df[CONTINUOUS_FEATURES].copy()

    # 2. Ordinal features (usfd_flaw_severity)
    ordinal_df = df[ORDINAL_FEATURES].copy()

    # 3. Categorical one-hot features (department_code)
    dept_dummies = pd.get_dummies(df["department_code"], prefix="department_code", dtype=float)
    expected_dept_cols = [f"department_code_{d}" for d in DEPARTMENTS]
    for col in expected_dept_cols:
        if col not in dept_dummies.columns:
            dept_dummies[col] = 0.0
    dept_dummies = dept_dummies[expected_dept_cols]

    # Combine in deterministic order
    X = pd.concat([continuous_df, ordinal_df, dept_dummies], axis=1)
    feature_order = list(X.columns)

    # Safety assertion: latent generator variables must NEVER leak into features
    assert "hazard_prob" not in feature_order, "CRITICAL: hazard_prob leaked into features!"
    assert "section_id" not in feature_order, "CRITICAL: section_id leaked into features!"

    return X, feature_order


def run_training_pipeline() -> Dict[str, Any]:
    """Execute end-to-end training, cross-validation, calibration, and artifact export."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run synthetic_generator.py first.")

    logger.info(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)

    # Encode features
    X_all, feature_order = encode_features(df)
    y_all = df["failure_30d"].values
    groups_all = df["section_id"].values
    hazard_prob_all = df["hazard_prob"].values

    logger.info(f"Features ({len(feature_order)} columns): {feature_order}")

    # Build monotone constraint mappings
    xgb_monotone = {col: 1 if col in MONOTONE_POSITIVE else 0 for col in feature_order}
    lgb_monotone = [1 if col in MONOTONE_POSITIVE else 0 for col in feature_order]

    # Reserve dedicated group-disjoint calibration split (10 sections out of 50)
    unique_sections = np.unique(groups_all)
    rng = np.random.default_rng(SEED)
    calib_sections = rng.choice(unique_sections, size=10, replace=False)
    calib_mask = np.isin(groups_all, calib_sections)
    train_val_mask = ~calib_mask

    X_tv = X_all[train_val_mask].reset_index(drop=True)
    y_tv = y_all[train_val_mask]
    g_tv = groups_all[train_val_mask]
    hazard_tv = hazard_prob_all[train_val_mask]

    X_calib = X_all[calib_mask].reset_index(drop=True)
    y_calib = y_all[calib_mask]
    hazard_calib = hazard_prob_all[calib_mask]

    logger.info(
        f"Split partition: Train/Val = {len(X_tv)} rows ({len(np.unique(g_tv))} sections), "
        f"Calibration = {len(X_calib)} rows ({len(calib_sections)} sections)"
    )

    # 5-Fold StratifiedGroupKFold on Train/Val pool
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)

    xgb_fold_metrics: List[Dict[str, float]] = []
    lgb_fold_metrics: List[Dict[str, float]] = []

    logger.info("Executing 5-Fold StratifiedGroupKFold cross-validation...")

    for fold_idx, (train_idx, val_idx) in enumerate(sgkf.split(X_tv, y_tv, groups=g_tv)):
        X_tr, y_tr = X_tv.iloc[train_idx], y_tv[train_idx]
        X_va, y_va = X_tv.iloc[val_idx], y_tv[val_idx]

        # 1. XGBoost with monotone constraints
        xgb_clf = xgb.XGBClassifier(
            objective="binary:logistic",
            tree_method="hist",
            max_bin=512,
            eval_metric="aucpr",
            monotone_constraints=xgb_monotone,
            early_stopping_rounds=30,
            random_state=SEED + fold_idx,
            n_estimators=300,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
        )
        xgb_clf.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], verbose=False)
        xgb_val_preds = xgb_clf.predict_proba(X_va)[:, 1]
        xgb_prauc = float(average_precision_score(y_va, xgb_val_preds))
        xgb_fold_metrics.append({"fold": fold_idx + 1, "pr_auc": xgb_prauc})

        # 2. LightGBM with monotone constraints
        lgb_clf = lgb.LGBMClassifier(
            objective="binary",
            metric="average_precision",
            monotone_constraints=lgb_monotone,
            monotone_constraints_method="intermediate",
            random_state=SEED + fold_idx,
            n_estimators=300,
            learning_rate=0.05,
            num_leaves=31,
            subsample=0.8,
            colsample_bytree=0.8,
            verbose=-1,
        )
        lgb_clf.fit(X_tr, y_tr)
        lgb_val_preds = lgb_clf.predict_proba(X_va)[:, 1]
        lgb_prauc = float(average_precision_score(y_va, lgb_val_preds))
        lgb_fold_metrics.append({"fold": fold_idx + 1, "pr_auc": lgb_prauc})

        logger.info(
            f"Fold {fold_idx + 1}/5 -> XGB PR-AUC: {xgb_prauc:.4f} | LGBM PR-AUC: {lgb_prauc:.4f}"
        )

    xgb_praucs = [m["pr_auc"] for m in xgb_fold_metrics]
    lgb_praucs = [m["pr_auc"] for m in lgb_fold_metrics]

    logger.info(
        f"XGBoost CV PR-AUC: Mean={np.mean(xgb_praucs):.4f}, Worst={np.min(xgb_praucs):.4f}"
    )
    logger.info(
        f"LightGBM CV PR-AUC: Mean={np.mean(lgb_praucs):.4f}, Worst={np.min(lgb_praucs):.4f}"
    )

    # Train production model on full Train/Val pool
    logger.info("Training final production XGBoost model on full Train/Val pool...")
    final_xgb = xgb.XGBClassifier(
        objective="binary:logistic",
        tree_method="hist",
        max_bin=512,
        eval_metric="aucpr",
        monotone_constraints=xgb_monotone,
        random_state=SEED,
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
    )
    final_xgb.fit(X_tv, y_tv, verbose=False)

    # Fit Isotonic Calibrator strictly on dedicated calibration split
    # Uses FrozenEstimator (scikit-learn >= 1.4) equivalent to cv="prefit"
    logger.info("Fitting post-hoc Isotonic Calibrator on dedicated calibration split...")
    try:
        from sklearn.frozen import FrozenEstimator
        calibrator = CalibratedClassifierCV(estimator=FrozenEstimator(final_xgb), method="isotonic")
    except (ImportError, ValueError):
        calibrator = CalibratedClassifierCV(estimator=final_xgb, method="isotonic", cv="prefit")
    calibrator.fit(X_calib, y_calib)

    # Compute calibrated probabilities on calibration split and create CI Percentile Map
    calib_probs = calibrator.predict_proba(X_calib)[:, 1]
    sorted_p = np.sort(calib_probs).tolist()

    # Stratified 200-sample background selection for SHAP TreeExplainer
    logger.info("Extracting 200 stratified rows from calibration split for SHAP background...")
    pos_idx = np.where(y_calib == 1)[0]
    neg_idx = np.where(y_calib == 0)[0]
    n_pos = min(len(pos_idx), int(200 * np.mean(y_calib)))
    n_neg = 200 - n_pos

    sampled_pos = rng.choice(pos_idx, size=n_pos, replace=False)
    sampled_neg = rng.choice(neg_idx, size=n_neg, replace=False)
    background_indices = np.concatenate([sampled_pos, sampled_neg])
    rng.shuffle(background_indices)

    background_matrix = X_calib.iloc[background_indices].to_numpy(dtype=np.float64)

    # Export Artifact Bundle to ARTIFACT_DIR
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Exporting artifact bundle to {ARTIFACT_DIR}...")

    # 1. Native XGBoost model.json
    model_json_path = ARTIFACT_DIR / "model.json"
    final_xgb.get_booster().save_model(str(model_json_path))

    # 2. Calibrator joblib
    calibrator_path = ARTIFACT_DIR / "calibrator.joblib"
    joblib.dump(calibrator, calibrator_path)

    # 3. Schema JSON
    schema_data = {
        "feature_order": feature_order,
        "continuous_features": CONTINUOUS_FEATURES,
        "ordinal_features": ORDINAL_FEATURES,
        "categorical_dummies": [f"department_code_{d}" for d in DEPARTMENTS],
        "bounds": BOUNDS,
        "monotone_positive": MONOTONE_POSITIVE,
        "dtypes": {col: "float64" for col in feature_order},
    }
    with open(ARTIFACT_DIR / "schema.json", "w") as f:
        json.dump(schema_data, f, indent=2)

    # 4. Enums JSON
    enums_data = {
        "usfd_enum": USFD_ENUM,
        "departments": DEPARTMENTS,
    }
    with open(ARTIFACT_DIR / "enums.json", "w") as f:
        json.dump(enums_data, f, indent=2)

    # 5. CI Percentile Map JSON
    ci_map_data = {
        "sorted_p": sorted_p,
        "n_points": len(sorted_p),
        "min_p": float(sorted_p[0]),
        "max_p": float(sorted_p[-1]),
    }
    with open(ARTIFACT_DIR / "ci_map.json", "w") as f:
        json.dump(ci_map_data, f, indent=2)

    # 6. SHAP Background NPZ
    np.savez_compressed(
        ARTIFACT_DIR / "background.npz",
        background=background_matrix,
        feature_names=np.array(feature_order),
    )

    # 7. Model Card JSON
    model_sha256 = compute_sha256(model_json_path)
    model_card_data = {
        "model_name": "criticality_xgboost_isotonic",
        "version": "criticality_v1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "seed": SEED,
        "library_versions": {
            "xgboost": xgb.__version__,
            "lightgbm": lgb.__version__,
            "scikit-learn": "1.9.0",
        },
        "feature_order": feature_order,
        "bounds": BOUNDS,
        "base_positive_rate": float(np.mean(y_all)),
        "cv_splits": 5,
        "cv_grouping": "section_id",
        "metrics": {
            "xgboost_pr_auc_mean": float(np.mean(xgb_praucs)),
            "xgboost_pr_auc_worst": float(np.min(xgb_praucs)),
            "lightgbm_pr_auc_mean": float(np.mean(lgb_praucs)),
            "lightgbm_pr_auc_worst": float(np.min(lgb_praucs)),
        },
        "disclaimer": (
            "Trained on simulated labels only. No real IR failure data was used. "
            "Absolute CI values are not field probabilities until recalibrated on real "
            "labeled outcomes in a CRIS pilot."
        ),
        "artifact_sha256": model_sha256,
    }
    with open(ARTIFACT_DIR / "model_card.json", "w") as f:
        json.dump(model_card_data, f, indent=2)

    logger.info("✅ Model training and artifact bundle export completed successfully!")
    logger.info(f"   Model SHA-256: {model_sha256}")
    return model_card_data


if __name__ == "__main__":
    run_training_pipeline()
