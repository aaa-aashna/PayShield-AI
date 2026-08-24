"""
Evaluation metrics suite for fraud detection and imbalanced learning.
Computes PR-AUC, ROC-AUC, Precision, Recall, F1, Precision@K, and threshold optimization curves.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)


def evaluate_fraud_model(
    y_true: np.ndarray | List[int],
    y_prob: np.ndarray | List[float],
    threshold: float = 0.5,
) -> Dict[str, Any]:
    """
    Compute comprehensive fraud evaluation metrics.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)
    y_pred = (y_prob >= threshold).astype(int)

    # 1. Curve AUCs
    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except Exception:
        pr_auc = 0.0

    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.0

    # 2. Point metrics at operating threshold
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    # 3. Confusion Matrix Breakdown
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

    total_negatives = tn + fp
    fpr = float(fp / total_negatives) if total_negatives > 0 else 0.0

    # 4. Precision@K and Recall@K for operational triage (Top 100, Top 500, Top 1000)
    order = np.argsort(y_prob)[::-1]
    sorted_true = y_true[order]
    total_positives = int(np.sum(y_true))

    top_k_metrics = {}
    for k in [100, 500, 1000]:
        if len(sorted_true) >= k:
            top_k_true = sorted_true[:k]
            p_at_k = float(np.sum(top_k_true) / k)
            r_at_k = float(np.sum(top_k_true) / total_positives) if total_positives > 0 else 0.0
            top_k_metrics[f"precision@{k}"] = p_at_k
            top_k_metrics[f"recall@{k}"] = r_at_k

    return {
        "pr_auc": pr_auc,
        "roc_auc": roc_auc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "fpr": fpr,
        "threshold": threshold,
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "total_samples": len(y_true),
        "total_fraud": total_positives,
        "top_k": top_k_metrics,
    }


def find_optimal_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    steps: int = 100,
) -> Tuple[float, Dict[str, Any], List[Dict[str, float]]]:
    """
    Sweep decision thresholds to find the threshold maximizing F1 score.
    Returns (optimal_threshold, best_metrics, threshold_sweep_table).
    """
    y_true = np.asarray(y_true, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)

    thresholds = np.linspace(0.02, 0.98, steps)
    best_f1 = -1.0
    best_threshold = 0.5
    sweep_table: List[Dict[str, float]] = []

    for t in thresholds:
        t_val = float(t)
        metrics = evaluate_fraud_model(y_true, y_prob, threshold=t_val)
        sweep_table.append(
            {
                "threshold": round(t_val, 4),
                "precision": round(metrics["precision"], 4),
                "recall": round(metrics["recall"], 4),
                "f1": round(metrics["f1"], 4),
                "fpr": round(metrics["fpr"], 5),
                "fp": metrics["false_positives"],
                "tp": metrics["true_positives"],
            }
        )
        if metrics["f1"] > best_f1:
            best_f1 = metrics["f1"]
            best_threshold = t_val

    best_metrics = evaluate_fraud_model(y_true, y_prob, threshold=best_threshold)
    return best_threshold, best_metrics, sweep_table
