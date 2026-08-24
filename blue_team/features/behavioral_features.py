"""Leakage-safe behavioral feature engineering."""

from __future__ import annotations

import pandas as pd


REQUIRED_COLUMNS = {
    "TX_DATETIME",
    "CUSTOMER_ID",
    "TERMINAL_ID",
    "TX_AMOUNT",
}


def create_behavioral_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create behavioral features using only transactions that occurred
    before the current transaction.

    The returned DataFrame preserves the original row index and order.
    """

    missing = REQUIRED_COLUMNS - set(df.columns)

    if missing:
        raise ValueError(
            f"Missing required columns: {sorted(missing)}"
        )

    data = df.copy()

    data["TX_DATETIME"] = pd.to_datetime(
        data["TX_DATETIME"],
        errors="raise",
    )

    data["TX_AMOUNT"] = pd.to_numeric(
        data["TX_AMOUNT"],
        errors="raise",
    )

    # Preserve the original row position.
    data["_original_index"] = data.index

    # Sort chronologically so all historical calculations only see
    # transactions that occurred earlier.
    data = data.sort_values(
        "TX_DATETIME",
        kind="stable",
    )

    # Time since the customer's previous transaction.
    data["CUSTOMER_PREV_TIME"] = (
        data.groupby("CUSTOMER_ID")["TX_DATETIME"]
        .shift(1)
    )

    data["CUSTOMER_TIME_SINCE_PREVIOUS"] = (
        data["TX_DATETIME"]
        - data["CUSTOMER_PREV_TIME"]
    ).dt.total_seconds()

    # Previous transaction amount for the customer.
    data["CUSTOMER_PREV_AMOUNT"] = (
        data.groupby("CUSTOMER_ID")["TX_AMOUNT"]
        .shift(1)
    )

    # Number of previous transactions for the customer.
    data["CUSTOMER_TX_COUNT_BEFORE"] = (
        data.groupby("CUSTOMER_ID")
        .cumcount()
    )

    # Number of previous transactions at the terminal.
    data["TERMINAL_TX_COUNT_BEFORE"] = (
        data.groupby("TERMINAL_ID")
        .cumcount()
    )

    # Customer's historical mean transaction amount.
    # shift(1) ensures the current transaction is excluded.
    previous_amounts = (
        data.groupby("CUSTOMER_ID")["TX_AMOUNT"]
        .transform(lambda s: s.shift(1))
    )

    data["CUSTOMER_AMOUNT_MEAN_BEFORE"] = (
        previous_amounts
        .groupby(data["CUSTOMER_ID"])
        .transform(lambda s: s.expanding().mean())
    )

    # Difference between current amount and historical mean.
    data["CUSTOMER_AMOUNT_DEVIATION"] = (
        data["TX_AMOUNT"]
        - data["CUSTOMER_AMOUNT_MEAN_BEFORE"]
    )

    # Ratio between current amount and historical mean.
    data["CUSTOMER_AMOUNT_RATIO"] = (
        data["TX_AMOUNT"]
        / data["CUSTOMER_AMOUNT_MEAN_BEFORE"].replace(0, pd.NA)
    )

    result = data[
        [
            "_original_index",
            "CUSTOMER_TIME_SINCE_PREVIOUS",
            "CUSTOMER_PREV_AMOUNT",
            "CUSTOMER_TX_COUNT_BEFORE",
            "TERMINAL_TX_COUNT_BEFORE",
            "CUSTOMER_AMOUNT_MEAN_BEFORE",
            "CUSTOMER_AMOUNT_DEVIATION",
            "CUSTOMER_AMOUNT_RATIO",
        ]
    ].copy()

    # Restore the exact original row order.
    result = result.set_index("_original_index")

    return result.reindex(df.index)