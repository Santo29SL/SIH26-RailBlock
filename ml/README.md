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

`train.py` generates 10,000 reproducible domain-shaped samples, compares
XGBoost and LightGBM with five-fold cross-validation, saves metrics under
`ml/models/`, and exports the winning tree model to
`backend/data/ml_models/criticality_xgboost_v1.joblib`.
