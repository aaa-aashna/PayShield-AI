"""Feature engineering for payment transactions."""

from __future__ import annotations

import pandas as pd


TARGET_COLUMN = "TX_FRAUD"

REQUIRED_COLUMNS = {
    "TX_DATETIME",
    "CUSTOMER_ID",
    "TERMINAL_ID",
    "TX_AMOUNT",
    "TX_FRAUD",
}


def validate_schema(df: pd.DataFrame) -> None:
    """Validate that the required transaction columns exist."""
    missing = REQUIRED_COLUMNS - set(df.columns)

    if missing:
        raise ValueError(
            f"Missing required columns: {sorted(missing)}"
        )


def create_basic_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create transaction-level features.

    Only information available at transaction time is used.
    No target or fraud-scenario information is included.
    """
    validate_schema(df)

    features = pd.DataFrame(index=df.index)

    timestamp = pd.to_datetime(
        df["TX_DATETIME"],
        errors="coerce",
    )

    if timestamp.isna().any():
        raise ValueError(
            "TX_DATETIME contains invalid timestamp values."
        )

    # Transaction amount
    features["TX_AMOUNT"] = pd.to_numeric(
        df["TX_AMOUNT"],
        errors="coerce",
    )

    # Time-based features
    features["TX_HOUR"] = timestamp.dt.hour
    features["TX_DAY_OF_WEEK"] = timestamp.dt.dayofweek
    features["TX_DAY_OF_MONTH"] = timestamp.dt.day
    features["TX_MONTH"] = timestamp.dt.month

    # Existing elapsed-time features
    features["TX_TIME_SECONDS"] = pd.to_numeric(
        df["TX_TIME_SECONDS"],
        errors="coerce",
    )

    features["TX_TIME_DAYS"] = pd.to_numeric(
        df["TX_TIME_DAYS"],
        errors="coerce",
    )

    # Entity identifiers are preserved as strings.
    # They will NOT be treated as continuous numerical values.
    features["CUSTOMER_ID"] = df["CUSTOMER_ID"].astype(str)
    features["TERMINAL_ID"] = df["TERMINAL_ID"].astype(str)

    return features


def prepare_target(df: pd.DataFrame) -> pd.Series:
    """Extract the fraud target."""
    validate_schema(df)

    return pd.to_numeric(
        df[TARGET_COLUMN],
        errors="raise",
    ).astype("int8")