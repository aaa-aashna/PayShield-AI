"""
Comprehensive PayShield AI Experiment and Benchmarking Suite.
Executes real ML training, model comparisons, threshold optimization,
unsupervised anomaly calibration, attack robustness sweeps, and drift monitoring.
Saves reproducible JSON artifacts and trained model bundles.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from blue_team.evaluation.metrics import evaluate_fraud_model, find_optimal_threshold
from blue_team.features.pipeline import FeaturePipeline
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.model_registry import ModelBundleMetadata, ModelRegistry
from blue_team.models.supervised import HistGradientBoostingFraudModel, LogisticRegressionFraudModel
from blue_team.monitoring.drift_detector import DriftDetector
from blue_team.preprocessing.dataset_builder import get_dataset_splits
from simulator.environment import SimulationEnvironment

ARTIFACTS_DIR = Path("experiments/artifacts")


def run_full_experiments(sample_train_size: int = 100000, sample_val_size: int = 25000) -> Dict[str, Any]:
    """
    Run complete ML benchmarking, attack robustness, and drift experiment pipeline.
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    print("=" * 70, flush=True)
    print("PAYSHIELD AI - BENCHMARK & EXPERIMENTS PIPELINE", flush=True)
    print("=" * 70, flush=True)

    # 1. Load Data Splits
    print("\n[1/6] Loading Chronological Datasets...", flush=True)
    train_df, val_df, test_df = get_dataset_splits()
    print(f"Total Rows: Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,}", flush=True)

    train_period = (
        str(train_df["TX_DATETIME"].min()),
        str(train_df["TX_DATETIME"].max()),
    )
    test_period = (
        str(test_df["TX_DATETIME"].min()),
        str(test_df["TX_DATETIME"].max()),
    )

    if sample_train_size and len(train_df) > sample_train_size:
        train_sub = train_df.tail(sample_train_size).reset_index(drop=True)
    else:
        train_sub = train_df

    if sample_val_size and len(val_df) > sample_val_size:
        val_sub = val_df.tail(sample_val_size).reset_index(drop=True)
    else:
        val_sub = val_df

    test_sub = test_df.tail(sample_val_size).reset_index(drop=True)

    print(f"Experiment Subset: Train={len(train_sub):,}, Val={len(val_sub):,}, Test={len(test_sub):,}", flush=True)

    # 2. Extract Leakage-Safe Features
    print("\n[2/6] Building Feature Pipelines & Extracting Features...", flush=True)
    pipeline = FeaturePipeline()

    t0 = time.time()
    X_train = pipeline.transform_dataframe(train_sub, update_state=True)
    y_train = train_sub["TX_FRAUD"].values
    t_feat_train = time.time() - t0

    X_val = pipeline.transform_dataframe(val_sub, update_state=True)
    y_val = val_sub["TX_FRAUD"].values

    X_test = pipeline.transform_dataframe(test_sub, update_state=True)
    y_test = test_sub["TX_FRAUD"].values

    feature_names = list(X_train.columns)
    print(f"Features extracted: {len(feature_names)} features in {t_feat_train:.2f}s", flush=True)

    # 3. Model Training & Comparison
    print("\n[3/6] Training & Comparing Models...", flush=True)
    models_to_evaluate = [
        ("Logistic Regression (Baseline)", LogisticRegressionFraudModel()),
        ("HistGradientBoosting (Champion)", HistGradientBoostingFraudModel()),
    ]

    model_comparison_results = []
    trained_models = {}

    for name, model in models_to_evaluate:
        print(f"  --> Training {name}...", flush=True)
        t_start = time.time()
        model.fit(X_train, y_train)
        fit_duration = time.time() - t_start

        # Evaluate on Validation set
        val_probs = model.predict_proba(X_val)
        val_metrics = evaluate_fraud_model(y_val, val_probs, threshold=0.5)

        # Evaluate on Test set
        test_probs = model.predict_proba(X_test)
        test_metrics = evaluate_fraud_model(y_test, test_probs, threshold=0.5)

        res_entry = {
            "model_name": name,
            "fit_time_seconds": round(fit_duration, 2),
            "val_pr_auc": round(val_metrics["pr_auc"], 4),
            "val_roc_auc": round(val_metrics["roc_auc"], 4),
            "val_f1": round(val_metrics["f1"], 4),
            "val_precision": round(val_metrics["precision"], 4),
            "val_recall": round(val_metrics["recall"], 4),
            "test_pr_auc": round(test_metrics["pr_auc"], 4),
            "test_roc_auc": round(test_metrics["roc_auc"], 4),
            "test_f1": round(test_metrics["f1"], 4),
            "test_precision": round(test_metrics["precision"], 4),
            "test_recall": round(test_metrics["recall"], 4),
            "test_fpr": round(test_metrics["fpr"], 5),
            "test_metrics": test_metrics,
        }
        model_comparison_results.append(res_entry)
        trained_models[name] = model

        print(
            f"      Test PR-AUC: {test_metrics['pr_auc']:.4f} | "
            f"ROC-AUC: {test_metrics['roc_auc']:.4f} | "
            f"F1: {test_metrics['f1']:.4f} | "
            f"Recall: {test_metrics['recall']:.4f}",
            flush=True,
        )

    # 4. Train Unsupervised Anomaly Detector & Threshold Optimization
    print("\n[4/6] Training Isolation Forest Anomaly Detector & Tuning Thresholds...", flush=True)
    anomaly_detector = IsolationForestAnomalyDetector()
    normal_mask = y_train == 0
    anomaly_detector.fit(X_train[normal_mask])

    champion_model = trained_models["HistGradientBoosting (Champion)"]
    val_champion_probs = champion_model.predict_proba(X_val)
    optimal_threshold, best_val_metrics, sweep_table = find_optimal_threshold(y_val, val_champion_probs)
    print(
        f"Optimal Champion Threshold on Validation: {optimal_threshold:.3f} (Validation F1: {best_val_metrics['f1']:.4f})",
        flush=True,
    )

    test_champion_probs = champion_model.predict_proba(X_test)
    test_optimal_metrics = evaluate_fraud_model(y_test, test_champion_probs, threshold=optimal_threshold)

    # 5. Attack Robustness Evaluation (Red vs Blue)
    print("\n[5/6] Running Adversarial Attack Robustness Experiment...", flush=True)
    sim_env = SimulationEnvironment(
        feature_pipeline=pipeline,
        supervised_model=champion_model,
        anomaly_model=anomaly_detector,
        model_version="v1.0.0-champion",
    )

    attack_types = [
        "Transaction Burst",
        "Amount Escalation",
        "Terminal Hopping",
        "Behavioral Shift",
        "Coordinated Attack",
        "Slow and Low",
    ]
    intensities = [0.2, 0.4, 0.6, 0.8, 1.0]
    robustness_data = []

    for atk in attack_types:
        for intensity in intensities:
            res = sim_env.run_scenario(
                attack_type=atk,
                intensity=intensity,
                num_transactions=5,
            )
            robustness_data.append(
                {
                    "attack_type": atk,
                    "intensity": intensity,
                    "detected": res.detected,
                    "blocked": res.blocked,
                    "max_risk_score": res.max_risk_score,
                    "average_risk_score": res.average_risk_score,
                    "detection_step": res.detection_step,
                    "alerts_count": res.alerts_count,
                }
            )

    # 6. Drift Monitoring Analysis
    print("\n[6/6] Calculating Feature & Prediction Distribution Drift (PSI)...", flush=True)
    drift_detector = DriftDetector()
    drift_report = drift_detector.evaluate_multi_feature_drift(X_train, X_test)

    pred_drift = drift_detector.evaluate_drift(
        champion_model.predict_proba(X_train[:10000]),
        champion_model.predict_proba(X_test[:10000]),
        name="fraud_prediction_probability",
    )
    drift_report["prediction_drift"] = pred_drift.to_dict()

    # 7. Save Artifacts and Register Model Bundle
    print("\nSaving structured artifacts to experiments/artifacts/...", flush=True)
    with open(ARTIFACTS_DIR / "model_comparison.json", "w") as f:
        json.dump(model_comparison_results, f, indent=2)

    with open(ARTIFACTS_DIR / "threshold_analysis.json", "w") as f:
        json.dump(
            {
                "optimal_threshold": round(optimal_threshold, 4),
                "best_val_metrics": best_val_metrics,
                "test_optimal_metrics": test_optimal_metrics,
                "sweep_table": sweep_table,
            },
            f,
            indent=2,
        )

    with open(ARTIFACTS_DIR / "attack_robustness.json", "w") as f:
        json.dump(robustness_data, f, indent=2)

    with open(ARTIFACTS_DIR / "drift_analysis.json", "w") as f:
        json.dump(drift_report, f, indent=2)

    metadata = ModelBundleMetadata(
        model_version="v1.0.0",
        feature_version="v1.0.0",
        dataset_version="fraud_handbook_1.75M",
        model_name="HistGradientBoostingFraudModel",
        training_period=train_period,
        test_period=test_period,
        optimal_threshold=round(optimal_threshold, 4),
        metrics=test_optimal_metrics,
        feature_names=feature_names,
    )
    registry = ModelRegistry()
    bundle_path = registry.save_bundle(
        supervised_model=champion_model,
        anomaly_model=anomaly_detector,
        feature_pipeline=pipeline,
        metadata=metadata,
    )
    print(f"Model bundle registered and saved to {bundle_path}", flush=True)
    print("\n[SUCCESS] Experiments completed successfully!", flush=True)
    return {
        "comparison": model_comparison_results,
        "optimal_threshold": optimal_threshold,
        "test_metrics": test_optimal_metrics,
        "drift_status": drift_report["overall_status"],
    }


if __name__ == "__main__":
    run_full_experiments()
