"""
Temporal and sequential feature engineering.
Encodes cyclical time properties and detects sequence anomaly patterns (bursts, escalations, odd hours).
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Dict

import pandas as pd


def compute_temporal_features(
    tx_datetime: datetime,
    tx_amount: float,
) -> Dict[str, float]:
    """
    Compute cyclical and context features for a single transaction.
    """
    hour = tx_datetime.hour
    dow = tx_datetime.weekday()  # 0=Monday, 6=Sunday
    dom = tx_datetime.day
    month = tx_datetime.month

    # Cyclical hour features
    hour_rad = 2.0 * math.pi * hour / 24.0
    hour_sin = math.sin(hour_rad)
    hour_cos = math.cos(hour_rad)

    # Cyclical day of week features
    dow_rad = 2.0 * math.pi * dow / 7.0
    dow_sin = math.sin(dow_rad)
    dow_cos = math.cos(dow_rad)

    # Categorical flags
    is_weekend = 1.0 if dow >= 5 else 0.0
    is_night = 1.0 if hour < 6 else 0.0
    is_business_hours = 1.0 if 9 <= hour <= 17 and dow < 5 else 0.0

    # Amount magnitude features (log scale)
    log_amount = math.log1p(max(0.0, float(tx_amount)))

    return {
        "TX_HOUR": float(hour),
        "TX_DOW": float(dow),
        "TX_DOM": float(dom),
        "TX_MONTH": float(month),
        "TX_HOUR_SIN": float(hour_sin),
        "TX_HOUR_COS": float(hour_cos),
        "TX_DOW_SIN": float(dow_sin),
        "TX_DOW_COS": float(dow_cos),
        "TX_IS_WEEKEND": is_weekend,
        "TX_IS_NIGHT": is_night,
        "TX_IS_BUSINESS_HOURS": is_business_hours,
        "TX_LOG_AMOUNT": log_amount,
    }
