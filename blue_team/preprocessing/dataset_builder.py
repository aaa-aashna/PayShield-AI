"""Build and cache chronological datasets for fraud detection experiments."""

from __future__ import annotations

import os
import warnings
from pathlib import Path
from typing import Tuple

import pandas as pd

REQUIRED_COLUMNS = {
    "TRANSACTION_ID",
    "TX_DATETIME",
    "CUSTOMER_ID",
    "TERMINAL_ID",
    "TX_AMOUNT",
    "TX_FRAUD",
}

DEFAULT_RAW_DIR = Path("data/raw/fraud_handbook_raw/data")
DEFAULT_PROCESSED_DIR = Path("data/processed")


def load_transaction_files(data_dir: str | Path = DEFAULT_RAW_DIR) -> pd.DataFrame:
    """
    Load all transaction pickle files in chronological order,
    standardizing column data types.
    """
    data_dir = Path(data_dir)
    files = sorted(data_dir.glob("*.pkl"))

    if not files:
        raise FileNotFoundError(f"No .pkl transaction files found in {data_dir}")

    frames = []
    # Ignore pandas/numpy pickle deprecation warnings from legacy pickles
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for file_path in files:
            frame = pd.read_pickle(file_path)
            missing = REQUIRED_COLUMNS - set(frame.columns)
            if missing:
                raise ValueError(
                    f"{file_path.name} is missing columns: {sorted(missing)}"
                )
            frames.append(frame)

    data = pd.concat(frames, ignore_index=True)

    # Standardize types
    data["TRANSACTION_ID"] = data["TRANSACTION_ID"].astype("int64")
    data["TX_DATETIME"] = pd.to_datetime(data["TX_DATETIME"], errors="raise")
    data["CUSTOMER_ID"] = data["CUSTOMER_ID"].astype(str)
    data["TERMINAL_ID"] = data["TERMINAL_ID"].astype(str)
    data["TX_AMOUNT"] = pd.to_numeric(data["TX_AMOUNT"], errors="raise").astype("float64")
    data["TX_FRAUD"] = pd.to_numeric(data["TX_FRAUD"], errors="raise").astype("int8")
    
    if "TX_FRAUD_SCENARIO" in data.columns:
        data["TX_FRAUD_SCENARIO"] = pd.to_numeric(
            data["TX_FRAUD_SCENARIO"], errors="coerce"
        ).fillna(0).astype("int8")

    # Chronological sort
    data = data.sort_values("TX_DATETIME", kind="stable").reset_index(drop=True)
    return data


def chronological_split(
    df: pd.DataFrame,
    train_fraction: float = 0.70,
    validation_fraction: float = 0.15,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split transactions chronologically into train, validation, and test sets.
    The remaining fraction is assigned to test.
    """
    if not 0 < train_fraction < 1:
        raise ValueError("train_fraction must be between 0 and 1.")
    if not 0 < validation_fraction < 1:
        raise ValueError("validation_fraction must be between 0 and 1.")
    if train_fraction + validation_fraction >= 1:
        raise ValueError("train_fraction + validation_fraction must be < 1.")

    data = df.sort_values("TX_DATETIME", kind="stable").reset_index(drop=True)
    n_rows = len(data)
    train_end = int(n_rows * train_fraction)
    validation_end = int(n_rows * (train_fraction + validation_fraction))

    train = data.iloc[:train_end].copy().reset_index(drop=True)
    validation = data.iloc[train_end:validation_end].copy().reset_index(drop=True)
    test = data.iloc[validation_end:].copy().reset_index(drop=True)

    return train, validation, test


def get_dataset_splits(
    data_dir: str | Path = DEFAULT_RAW_DIR,
    processed_dir: str | Path = DEFAULT_PROCESSED_DIR,
    force_rebuild: bool = False,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Load or build parquet-cached train, validation, and test datasets.
    """
    processed_path = Path(processed_dir)
    train_file = processed_path / "train.parquet"
    val_file = processed_path / "validation.parquet"
    test_file = processed_path / "test.parquet"

    if (
        not force_rebuild
        and train_file.exists()
        and val_file.exists()
        and test_file.exists()
    ):
        train = pd.read_parquet(train_file)
        validation = pd.read_parquet(val_file)
        test = pd.read_parquet(test_file)
        return train, validation, test

    # Otherwise build from raw files and cache
    raw_df = load_transaction_files(data_dir)
    train, validation, test = chronological_split(raw_df)

    processed_path.mkdir(parents=True, exist_ok=True)
    train.to_parquet(train_file, index=False)
    validation.to_parquet(val_file, index=False)
    test.to_parquet(test_file, index=False)

    return train, validation, test