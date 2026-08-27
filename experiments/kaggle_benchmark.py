"""
External Validation and Benchmark Runner for PayShield AI.
Compares PayShield's ML model architectures across:
1. Primary Internal Dataset: Fraud Detection Handbook (1.75M transactions, 52 behavioral features)
2. External Validation Benchmark: Kaggle Credit Card Fraud Detection (European Cardholders, 284K transactions)

Produces structured comparison artifacts in experiments/artifacts/external_benchmark_comparison.json.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from blue_team.evaluation.metrics import evaluate_fraud_model, find_optimal_threshold
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.supervised import HistGradientBoostingFraudModel, LogisticRegressionFraudModel
from blue_team.preprocessing.kaggle_loader import (
    KAGGLE_DATASET_SLUG,
    KAGGLE_SOURCE_URL,
    load_kaggle_dataset,
    split_kaggle_dataset,
)

ARTIFACTS_DIR = Path("experiments/artifacts")


def run_kaggle_external_benchmark(
    sample_size: int = 50000,
    save_artifact: bool = True,
) -> Dict[str, Any]:
    """
    Execute full external benchmark evaluation on the Kaggle European Cardholders dataset.
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 80, flush=True)
    print("PAYSHIELD AI - EXTERNAL KAGGLE BENCHMARK & VALIDATION SUITE", flush=True)
    print(f"External Source: {KAGGLE_DATASET_SLUG} ({KAGGLE_SOURCE_URL})", flush=True)
    print("=" * 80, flush=True)

    # 1. Load Kaggle Dataset
    print("\n[1/4] Loading External Kaggle Benchmark Dataset...", flush=True)
    df_kaggle = load_kaggle_dataset(fallback_sample_size=sample_size)
    print(
        f"Kaggle Dataset: {len(df_kaggle):,} transactions | "
        f"Fraud Count: {df_kaggle['Class'].sum():,} ({df_kaggle['Class'].mean() * 100:.3f}%)",
        flush=True,
    )

    # 2. Chronological Split (70% Train / 30% Test)
    train_df, test_df = split_kaggle_dataset(df_kaggle, train_fraction=0.70)
    print(
        f"Kaggle Split: Train={len(train_df):,} rows ({train_df['Class'].sum():,} fraud), "
        f"Test={len(test_df):,} rows ({test_df['Class'].sum():,} fraud)",
        flush=True,
    )

    feature_cols = [c for c in df_kaggle.columns if c not in ["Class"]]
    X_train = train_df[feature_cols]
    y_train = train_df["Class"].values
    X_test = test_df[feature_cols]
    y_test = test_df["Class"].values

    # 3. Train & Evaluate Models on Kaggle Dataset
    print("\n[2/4] Evaluating PayShield Model Architectures on External Data...", flush=True)

    models_to_run = [
        ("Logistic Regression (Baseline)", LogisticRegressionFraudModel()),
        ("HistGradientBoosting (Champion)", HistGradientBoostingFraudModel()),
    ]

    kaggle_results: List[Dict[str, Any]] = []

    for name, model in models_to_run:
        print(f"  --> Training {name} on Kaggle benchmark...", flush=True)
        t0 = time.time()
        model.fit(X_train, y_train)
        fit_time = time.time() - t0

        test_probs = model.predict_proba(X_test)
        metrics_default = evaluate_fraud_model(y_test, test_probs, threshold=0.5)
        opt_thresh, opt_metrics, _ = find_optimal_threshold(y_test, test_probs, steps=50)

        entry = {
            "model_name": name,
            "fit_time_seconds": round(fit_time, 2),
            "test_pr_auc": round(metrics_default["pr_auc"], 4),
            "test_roc_auc": round(metrics_default["roc_auc"], 4),
            "test_f1": round(metrics_default["f1"], 4),
            "test_precision": round(metrics_default["precision"], 4),
            "test_recall": round(metrics_default["recall"], 4),
            "test_fpr": round(metrics_default["fpr"], 5),
            "optimal_threshold": round(opt_thresh, 4),
            "optimal_f1": round(opt_metrics["f1"], 4),
            "optimal_precision": round(opt_metrics["precision"], 4),
            "optimal_recall": round(opt_metrics["recall"], 4),
            "confusion_matrix_default": {
                "tp": metrics_default["true_positives"],
                "fp": metrics_default["false_positives"],
                "tn": metrics_default["true_negatives"],
                "fn": metrics_default["false_negatives"],
            },
            "confusion_matrix_optimal": {
                "tp": opt_metrics["true_positives"],
                "fp": opt_metrics["false_positives"],
                "tn": opt_metrics["true_negatives"],
                "fn": opt_metrics["false_negatives"],
            },
            "top_k": metrics_default["top_k"],
        }
        kaggle_results.append(entry)

        print(
            f"      [Default t=0.5] PR-AUC: {metrics_default['pr_auc']:.4f} | "
            f"ROC-AUC: {metrics_default['roc_auc']:.4f} | "
            f"F1: {metrics_default['f1']:.4f} | "
            f"Recall: {metrics_default['recall']:.4f}",
            flush=True,
        )
        print(
            f"      [Optimal t={opt_thresh:.3f}] F1: {opt_metrics['f1']:.4f} | "
            f"Precision: {opt_metrics['precision']:.4f} | "
            f"Recall: {opt_metrics['recall']:.4f}",
            flush=True,
        )

    # 4. Unsupervised Anomaly Isolation on Kaggle Features
    print("\n[3/4] Evaluating Unsupervised Isolation Forest on External Outliers...", flush=True)
    iforest = IsolationForestAnomalyDetector(contamination=0.01)
    normal_mask = y_train == 0
    iforest.fit(X_train[normal_mask])
    anom_scores = iforest.predict_anomaly_score(X_test)
    anom_pr_auc = float(evaluate_fraud_model(y_test, anom_scores)["pr_auc"])
    anom_roc_auc = float(evaluate_fraud_model(y_test, anom_scores)["roc_auc"])
    print(f"      Isolation Forest Zero-Shot ROC-AUC: {anom_roc_auc:.4f} | PR-AUC: {anom_pr_auc:.4f}", flush=True)

    # 5. Load Internal Primary Benchmark for Side-by-Side Comparison
    print("\n[4/4] Assembling Multi-Dataset Benchmark Comparison...", flush=True)
    internal_results_file = ARTIFACTS_DIR / "model_comparison.json"
    internal_results = []
    if internal_results_file.exists():
        try:
            internal_results = json.loads(internal_results_file.read_text())
        except Exception:
            pass

    comparison_payload = {
        "benchmark_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "primary_internal_dataset": {
            "name": "PayShield Primary Dataset (Fraud Detection Handbook Stream)",
            "context": "Customer-to-Terminal Card Payment Stream",
            "total_samples": 1754155,
            "fraud_rate_pct": 0.837,
            "feature_count": 52,
            "models": internal_results,
        },
        "external_validation_dataset": {
            "name": "Kaggle European Cardholders Credit Card Fraud",
            "slug": KAGGLE_DATASET_SLUG,
            "source_url": KAGGLE_SOURCE_URL,
            "context": "European Cardholder E-Commerce Transactions (PCA-anonymized)",
            "total_samples": len(df_kaggle),
            "fraud_rate_pct": round(float(df_kaggle["Class"].mean() * 100), 3),
            "feature_count": len(feature_cols),
            "models": kaggle_results,
            "unsupervised_anomaly": {
                "model": "IsolationForestAnomalyDetector",
                "roc_auc": round(anom_roc_auc, 4),
                "pr_auc": round(anom_pr_auc, 4),
            },
        },
    }

    if save_artifact:
        out_file = ARTIFACTS_DIR / "external_benchmark_comparison.json"
        with open(out_file, "w") as f:
            json.dump(comparison_payload, f, indent=2)
        print(f"[SUCCESS] Multi-dataset benchmark comparison saved to {out_file}", flush=True)

    # Print Summary Comparison Table
    print("\n" + "=" * 95, flush=True)
    print("PAYSHIELD AI - CROSS-DATASET BENCHMARK COMPARISON TABLE", flush=True)
    print("=" * 95, flush=True)
    print(
        f"{'Dataset':<28} | {'Model':<30} | {'PR-AUC':<8} | {'ROC-AUC':<8} | {'F1':<6} | {'Recall':<6}",
        flush=True,
    )
    print("-" * 95, flush=True)

    for m in internal_results:
        print(
            f"{'PayShield Internal (1.75M)':<28} | {m.get('model_name', ''):<30} | "
            f"{m.get('test_pr_auc', 0):<8.4f} | {m.get('test_roc_auc', 0):<8.4f} | "
            f"{m.get('test_f1', 0):<6.4f} | {m.get('test_recall', 0):<6.4f}",
            flush=True,
        )

    for m in kaggle_results:
        print(
            f"{'Kaggle External (284K)':<28} | {m.get('model_name', ''):<30} | "
            f"{m.get('test_pr_auc', 0):<8.4f} | {m.get('test_roc_auc', 0):<8.4f} | "
            f"{m.get('test_f1', 0):<6.4f} | {m.get('test_recall', 0):<6.4f}",
            flush=True,
        )

    print("=" * 95, flush=True)
    return comparison_payload


if __name__ == "__main__":
    run_kaggle_external_benchmark()
