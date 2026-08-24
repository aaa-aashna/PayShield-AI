"""
Unsupervised Anomaly Detection Engine for PayShield AI.
Uses Isolation Forest to detect abnormal behavioral patterns completely independent of supervised fraud labels.
"""

from __future__ import annotations

from typing import List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer


class IsolationForestAnomalyDetector:
    """
    Unsupervised behavioral outlier detector.
    Outputs a calibrated anomaly score in [0.0, 1.0].
    """

    def __init__(
        self,
        n_estimators: int = 100,
        contamination: float = 0.01,
        max_samples: float | int = 256,
        random_state: int = 42,
    ) -> None:
        self.model_name = "IsolationForest"
        self.contamination = contamination
        self.imputer = SimpleImputer(strategy="median")
        self.detector = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=-1,
        )
        self.feature_names_: List[str] = []
        self._score_min: float = -0.5
        self._score_max: float = 0.2

    def fit(self, X: pd.DataFrame | np.ndarray) -> "IsolationForestAnomalyDetector":
        if isinstance(X, pd.DataFrame):
            self.feature_names_ = list(X.columns)
            X_mat = X.values
        else:
            X_mat = np.asarray(X)
            self.feature_names_ = [f"feat_{i}" for i in range(X_mat.shape[1])]

        X_clean = self.imputer.fit_transform(X_mat)
        self.detector.fit(X_clean)

        # Calibrate raw decision function min/max bounds
        raw_scores = self.detector.score_samples(X_clean)
        self._score_min = float(np.percentile(raw_scores, 0.5))
        self._score_max = float(np.percentile(raw_scores, 99.5))
        return self

    def predict_anomaly_score(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """
        Compute normalized anomaly score in range [0.0, 1.0].
        Higher means more anomalous / outlier.
        """
        X_mat = X.values if isinstance(X, pd.DataFrame) else np.asarray(X)
        X_clean = self.imputer.transform(X_mat)

        # IsolationForest score_samples: more negative = more abnormal
        raw_scores = self.detector.score_samples(X_clean)

        # Invert and normalize to [0, 1]
        score_range = max(1e-4, self._score_max - self._score_min)
        normalized = (self._score_max - raw_scores) / score_range
        return np.clip(normalized, 0.0, 1.0)
