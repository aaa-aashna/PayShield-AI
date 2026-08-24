"""
Model Monitoring and Distribution Drift Detection for PayShield AI.
Calculates Population Stability Index (PSI) and Kolmogorov-Smirnov statistics
for continuous feature distributions, fraud prediction scores, and anomaly distributions.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp


@dataclass
class DriftMetricResult:
    metric_name: str
    psi_value: float
    ks_statistic: float
    ks_p_value: float
    status: str  # STABLE, WARNING, CRITICAL
    baseline_mean: float
    target_mean: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def calculate_psi(
    expected: np.ndarray | pd.Series,
    actual: np.ndarray | pd.Series,
    num_buckets: int = 10,
    epsilon: float = 1e-4,
) -> float:
    """
    Compute Population Stability Index (PSI) between baseline and monitored distributions.
    """
    exp_arr = np.asarray(expected, dtype=float)
    act_arr = np.asarray(actual, dtype=float)

    # Remove NaNs
    exp_clean = exp_arr[~np.isnan(exp_arr)]
    act_clean = act_arr[~np.isnan(act_arr)]

    if len(exp_clean) == 0 or len(act_clean) == 0:
        return 0.0

    # Determine quantile bins from baseline (expected)
    quantiles = np.linspace(0, 100, num_buckets + 1)
    bins = np.percentile(exp_clean, quantiles)
    bins[0] = -np.inf
    bins[-1] = np.inf
    bins = np.unique(bins)

    if len(bins) < 2:
        return 0.0

    # Bin counts
    exp_counts, _ = np.histogram(exp_clean, bins=bins)
    act_counts, _ = np.histogram(act_clean, bins=bins)

    # Percentages
    exp_pct = (exp_counts / len(exp_clean)) + epsilon
    act_pct = (act_counts / len(act_clean)) + epsilon

    # Normalize after epsilon
    exp_pct /= np.sum(exp_pct)
    act_pct /= np.sum(act_pct)

    # PSI sum
    psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return float(psi_val)


class DriftDetector:
    """
    Monitors data and model drifts across feature baselines and streaming inference windows.
    """

    def __init__(
        self,
        stable_threshold: float = 0.10,
        warning_threshold: float = 0.25,
    ) -> None:
        self.stable_threshold = stable_threshold
        self.warning_threshold = warning_threshold

    def evaluate_drift(
        self,
        baseline_series: np.ndarray | pd.Series,
        target_series: np.ndarray | pd.Series,
        name: str = "metric",
    ) -> DriftMetricResult:
        """
        Evaluate drift for a single numerical feature or score.
        """
        b_clean = np.asarray(baseline_series, dtype=float)
        t_clean = np.asarray(target_series, dtype=float)
        b_clean = b_clean[~np.isnan(b_clean)]
        t_clean = t_clean[~np.isnan(t_clean)]

        if len(b_clean) == 0 or len(t_clean) == 0:
            return DriftMetricResult(
                metric_name=name,
                psi_value=0.0,
                ks_statistic=0.0,
                ks_p_value=1.0,
                status="STABLE",
                baseline_mean=0.0,
                target_mean=0.0,
            )

        psi = calculate_psi(b_clean, t_clean)

        try:
            ks_res = ks_2samp(b_clean, t_clean)
            ks_stat = float(ks_res.statistic)
            ks_p = float(ks_res.pvalue)
        except Exception:
            ks_stat = 0.0
            ks_p = 1.0

        if psi < self.stable_threshold:
            status = "STABLE"
        elif psi < self.warning_threshold:
            status = "WARNING"
        else:
            status = "CRITICAL"

        return DriftMetricResult(
            metric_name=name,
            psi_value=round(psi, 4),
            ks_statistic=round(ks_stat, 4),
            ks_p_value=round(ks_p, 4),
            status=status,
            baseline_mean=round(float(np.mean(b_clean)), 3),
            target_mean=round(float(np.mean(t_clean)), 3),
        )

    def evaluate_multi_feature_drift(
        self,
        baseline_df: pd.DataFrame,
        target_df: pd.DataFrame,
    ) -> Dict[str, Any]:
        """
        Evaluate feature, prediction, and anomaly drift across dataframes.
        """
        results = []
        status_counts = {"STABLE": 0, "WARNING": 0, "CRITICAL": 0}

        common_cols = [c for c in baseline_df.columns if c in target_df.columns]

        for col in common_cols:
            if pd.api.types.is_numeric_dtype(baseline_df[col]):
                res = self.evaluate_drift(baseline_df[col], target_df[col], name=col)
                results.append(res.to_dict())
                status_counts[res.status] += 1

        overall_status = "STABLE"
        if status_counts["CRITICAL"] > 0:
            overall_status = "CRITICAL"
        elif status_counts["WARNING"] > 0:
            overall_status = "WARNING"

        return {
            "overall_status": overall_status,
            "summary": status_counts,
            "features": results,
        }
