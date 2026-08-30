# RailBlock AI/ML workspace

This workspace trains the Stage 2 Criticality Index model for Track, Signal and
Traction maintenance. The exported artifact is loaded by the FastAPI backend;
the backend never trains a model during startup.

```powershell
python -m pip install -r ml/requirements-ml.txt
python ml/train.py
python ml/evaluate.py
cd backend
pytest tests/test_ml_risk_engine.py -v
```

`train.py` generates reproducible domain-shaped samples, trains and calibrates
the XGBoost failure-risk model, and exports the versioned native artifact
bundle to `backend/data/ml_models/criticality_v1/`. The bundle includes the
native XGBoost model, calibrator, schema, enums, SHAP background distribution,
calibration mapping, and model card with integrity metadata.
