"""
Model Registry and Metadata Management for PayShield AI.
Handles model versioning, persistence, artifact bundling, and reproducible loading.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib

from blue_team.features.pipeline import FeaturePipeline
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.supervised import BaseFraudModel

DEFAULT_MODEL_DIR = Path("blue_team/models/saved_models")
DEFAULT_ARTIFACTS_DIR = Path("experiments/artifacts")


@dataclass
class ModelBundleMetadata:
    model_version: str = "v1.0.0"
    feature_version: str = "v1.0.0"
    dataset_version: str = "fraud_handbook_1.75M"
    model_name: str = "HistGradientBoostingFraudModel"
    training_period: Tuple[str, str] = ("", "")
    test_period: Tuple[str, str] = ("", "")
    optimal_threshold: float = 0.50
    metrics: Dict[str, Any] = field(default_factory=dict)
    feature_names: List[str] = field(default_factory=list)
    training_timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ModelBundleMetadata":
        return cls(**data)


class ModelRegistry:
    """
    Saves and loads versioned PayShield model bundles.
    """

    def __init__(self, base_dir: str | Path = DEFAULT_MODEL_DIR) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_bundle(
        self,
        supervised_model: BaseFraudModel,
        anomaly_model: IsolationForestAnomalyDetector,
        feature_pipeline: FeaturePipeline,
        metadata: ModelBundleMetadata,
        version: Optional[str] = None,
    ) -> Path:
        """
        Save complete trained bundle to disk.
        """
        ver = version or metadata.model_version
        target_dir = self.base_dir / ver
        target_dir.mkdir(parents=True, exist_ok=True)

        joblib.dump(supervised_model, target_dir / "supervised_model.joblib")
        joblib.dump(anomaly_model, target_dir / "anomaly_model.joblib")
        joblib.dump(feature_pipeline, target_dir / "feature_pipeline.joblib")

        with open(target_dir / "metadata.json", "w") as f:
            json.dump(metadata.to_dict(), f, indent=2)

        # Also link/save as "latest"
        latest_dir = self.base_dir / "latest"
        latest_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(supervised_model, latest_dir / "supervised_model.joblib")
        joblib.dump(anomaly_model, latest_dir / "anomaly_model.joblib")
        joblib.dump(feature_pipeline, latest_dir / "feature_pipeline.joblib")
        with open(latest_dir / "metadata.json", "w") as f:
            json.dump(metadata.to_dict(), f, indent=2)

        return target_dir

    def load_bundle(
        self,
        version: str = "latest",
    ) -> Tuple[BaseFraudModel, IsolationForestAnomalyDetector, FeaturePipeline, ModelBundleMetadata]:
        """
        Load complete trained bundle from disk.
        """
        target_dir = self.base_dir / version
        if not target_dir.exists():
            raise FileNotFoundError(f"Model bundle '{version}' not found at {target_dir}")

        supervised_model = joblib.load(target_dir / "supervised_model.joblib")
        anomaly_model = joblib.load(target_dir / "anomaly_model.joblib")
        feature_pipeline = joblib.load(target_dir / "feature_pipeline.joblib")

        with open(target_dir / "metadata.json", "r") as f:
            meta_dict = json.load(f)
        metadata = ModelBundleMetadata.from_dict(meta_dict)

        return supervised_model, anomaly_model, feature_pipeline, metadata
