"""
Unit tests for data validation, chronological splitting, and dataset builder.
"""

from datetime import datetime, timedelta
import pandas as pd
import pytest

from blue_team.preprocessing.dataset_builder import chronological_split


def test_chronological_split_ratios_and_order():
    base_time = datetime(2026, 1, 1, 0, 0, 0)
    data = []
    for i in range(100):
        data.append(
            {
                "TRANSACTION_ID": i,
                "TX_DATETIME": base_time + timedelta(minutes=i * 10),
                "CUSTOMER_ID": f"C_{i % 10}",
                "TERMINAL_ID": f"T_{i % 5}",
                "TX_AMOUNT": float(i * 10.0 + 5.0),
                "TX_FRAUD": 1 if i % 20 == 0 else 0,
            }
        )
    df = pd.DataFrame(data)

    train, val, test = chronological_split(df, train_fraction=0.70, validation_fraction=0.15)

    assert len(train) == 70
    assert len(val) == 15
    assert len(test) == 15

    # Check strict chronological order
    assert train["TX_DATETIME"].max() <= val["TX_DATETIME"].min()
    assert val["TX_DATETIME"].max() <= test["TX_DATETIME"].min()


def test_chronological_split_invalid_fractions():
    df = pd.DataFrame({"TX_DATETIME": [datetime.now()] * 10})
    with pytest.raises(ValueError):
        chronological_split(df, train_fraction=0.8, validation_fraction=0.3)
