"""
Unit tests for supervised models, anomaly detectors, and evaluation metrics.
"""

import numpy as np
import pandas as pd
import pytest

from blue_team.evaluation.metrics import evaluate_fraud_model, find_optimal_threshold
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.supervised import HistGradientBoostingFraudModel, LogisticRegressionFraudModel


def test_supervised_models_fit_and_predict_bounds():
    np.random.seed(42)
    X = pd.DataFrame(np.random.randn(200, 10), columns=[f"f_{i}" for i in range(10)])
    y = np.random.choice([0, 1], size=200, p=[0.9, 0.1])

    for model in [LogisticRegressionFraudModel(), HistGradientBoostingFraudModel()]:
        model.fit(X, y)
        probs = model.predict_proba(X)
        assert len(probs) == 200
        assert np.all((probs >= 0.0) & (probs <= 1.0))
        preds = model.predict(X, threshold=0.5)
        assert set(preds).issubset({0, 1})


def test_isolation_forest_anomaly_score_bounds():
    np.random.seed(42)
    X = pd.DataFrame(np.random.randn(200, 8), columns=[f"f_{i}" for i in range(8)])
    detector = IsolationForestAnomalyDetector(n_estimators=50)
    detector.fit(X)
    scores = detector.predict_anomaly_score(X)
    assert len(scores) == 200
    assert np.all((scores >= 0.0) & (scores <= 1.0))


def test_evaluation_metrics_and_threshold_tuning():
    y_true = np.array([0] * 90 + [1] * 10)
    y_prob = np.array([0.1] * 85 + [0.7] * 5 + [0.8] * 10)

    metrics = evaluate_fraud_model(y_true, y_prob, threshold=0.5)
    assert metrics["pr_auc"] > 0.5
    assert metrics["roc_auc"] > 0.5
    assert "top_k" in metrics

    opt_thresh, best_metrics, sweep_table = find_optimal_threshold(y_true, y_prob, steps=20)
    assert 0.0 < opt_thresh < 1.0
    assert best_metrics["f1"] >= metrics["f1"]
