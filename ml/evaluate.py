"""Model Evaluation & Visual Diagnostic Report Generator.

Loads the exported model artifact (criticality_xgboost_v2.joblib) and ir_defects_dataset.csv,
computes R², RMSE, and MAE test metrics, and exports feature importance & SHAP summary plots
to ml/reports/.
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import shap

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "ir_defects_dataset.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "ml_models", "criticality_xgboost_v2.joblib")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")

FEATURE_COLUMNS = [
    "tgi_deviation",
    "speed_restriction_kmh",
    "days_overdue",
    "section_gmt_density",
    "department_code",
    "usfd_flaw_severity",
    "point_failure_risk",
    "ohe_insulator_wear",
]
TARGET_COLUMN = "criticality_index"

def evaluate_model():
    """Evaluate trained model artifact and save visual SHAP diagnostic reports."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file missing at {MODEL_PATH}. Run ml/train.py first.")

    logger.info(f"Loading production model checkpoint from {MODEL_PATH}...")
    model = joblib.load(MODEL_PATH)

    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    preds = model.predict(X_test)
    r2 = r2_score(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)

    logger.info("================ MODEL EVALUATION METRICS ================")
    logger.info(f" R² Score : {r2:.4f}  (Target: >= 0.95)")
    logger.info(f" RMSE     : {rmse:.4f}  (Target: <= 3.5)")
    logger.info(f" MAE      : {mae:.4f}  (Target: <= 2.5)")
    logger.info("==========================================================")

    os.makedirs(REPORTS_DIR, exist_ok=True)

    # 1. Feature Importance Plot
    plt.figure(figsize=(8, 5))
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        importances = np.ones(len(FEATURE_COLUMNS)) / len(FEATURE_COLUMNS)

    feat_df = pd.DataFrame({"Feature": FEATURE_COLUMNS, "Importance": importances}).sort_values(by="Importance", ascending=False)
    sns.barplot(data=feat_df, x="Importance", y="Feature", palette="viridis")
    plt.title("XGBoost/ML Feature Importance — Criticality Index Scoring")
    plt.xlabel("Relative Importance Score")
    plt.tight_layout()
    feat_plot_path = os.path.join(REPORTS_DIR, "feature_importance.png")
    plt.savefig(feat_plot_path, dpi=300)
    plt.close()
    logger.info(f"✅ Saved Feature Importance plot to {feat_plot_path}")

    # 2. SHAP Beeswarm Summary Plot
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer(X_test)

        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_test, show=False)
        plt.title("SHAP Feature Attribution Beeswarm — RailBlock Risk Engine", fontsize=12)
        plt.tight_layout()
        shap_plot_path = os.path.join(REPORTS_DIR, "shap_beeswarm_summary.png")
        plt.savefig(shap_plot_path, dpi=300)
        plt.close()
        logger.info(f"✅ Saved SHAP Beeswarm plot to {shap_plot_path}")
    except Exception as e:
        logger.warning(f"Could not generate SHAP plot: {e}")

if __name__ == "__main__":
    evaluate_model()
