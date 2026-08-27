"""
Unit tests for the Kaggle external benchmark dataset loader and evaluation suite.
"""

import pytest
import numpy as np
import pandas as pd

from blue_team.preprocessing.kaggle_loader import (
    EXPECTED_COLUMNS,
    KAGGLE_DATASET_SLUG,
    KAGGLE_SOURCE_URL,
    generate_synthetic_kaggle_benchmark_sample,
    load_kaggle_dataset,
    split_kaggle_dataset,
)
from experiments.kaggle_benchmark import run_kaggle_external_benchmark


def test_synthetic_kaggle_sample_schema_and_types():
    df = generate_synthetic_kaggle_benchmark_sample(num_samples=1000, fraud_rate=0.01)
    assert len(df) == 1000
    assert list(df.columns) == EXPECTED_COLUMNS
    assert df["Class"].isin([0, 1]).all()
    assert df["Class"].sum() >= 2
    assert (df["Amount"] >= 0).all()
    # Check monotonic Time
    assert df["Time"].is_monotonic_increasing


def test_split_kaggle_dataset_ratios():
    df = generate_synthetic_kaggle_benchmark_sample(num_samples=1000)
    train, test = split_kaggle_dataset(df, train_fraction=0.70)
    assert len(train) == 700
    assert len(test) == 300
    assert train["Time"].max() <= test["Time"].min()


def test_load_kaggle_dataset_fallback():
    df = load_kaggle_dataset(fallback_sample_size=500)
    assert len(df) == 500
    assert "Class" in df.columns
    assert "V1" in df.columns
    assert "Amount" in df.columns


def test_run_kaggle_external_benchmark_execution():
    result = run_kaggle_external_benchmark(sample_size=3000, save_artifact=False)
    assert "primary_internal_dataset" in result
    assert "external_validation_dataset" in result
    ext = result["external_validation_dataset"]
    assert ext["slug"] == KAGGLE_DATASET_SLUG
    assert len(ext["models"]) == 2
    for m in ext["models"]:
        assert 0.0 <= m["test_pr_auc"] <= 1.0
        assert 0.0 <= m["test_roc_auc"] <= 1.0
        assert 0.0 <= m["test_f1"] <= 1.0
        assert "confusion_matrix_default" in m
