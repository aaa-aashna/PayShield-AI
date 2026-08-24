"""
High-Performance Customer Behavioral Profiling and Feature Extraction.
Leakage-safe baselines with optimized timestamp arithmetic and sliding queues.
"""

from __future__ import annotations

import math
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd


@dataclass
class CustomerState:
    customer_id: str
    tx_count: int = 0
    total_spend: float = 0.0
    amounts: List[float] = field(default_factory=list)
    recent_txs: deque = field(default_factory=deque)  # (timestamp_sec, amount, terminal_id)
    terminals_seen: set = field(default_factory=set)
    hours_seen: List[int] = field(default_factory=lambda: [0] * 24)
    last_tx_sec: Optional[float] = None

    @property
    def mean_amount(self) -> float:
        return (self.total_spend / self.tx_count) if self.tx_count > 0 else 0.0

    @property
    def std_amount(self) -> float:
        n = len(self.amounts)
        if n < 2:
            return 15.0
        # Fast rolling standard deviation
        recent = self.amounts[-50:]
        return float(np.std(recent)) + 1e-4

    @property
    def median_amount(self) -> float:
        if not self.amounts:
            return 0.0
        recent = self.amounts[-30:]
        return float(np.median(recent))


class CustomerProfileManager:
    """
    Maintains online customer behavioral profiles with ultra-fast feature computation.
    """

    def __init__(self) -> None:
        self.profiles: Dict[str, CustomerState] = {}

    def get_or_create(self, customer_id: str) -> CustomerState:
        cust_id = str(customer_id)
        if cust_id not in self.profiles:
            self.profiles[cust_id] = CustomerState(customer_id=cust_id)
        return self.profiles[cust_id]

    def compute_features(
        self,
        customer_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
        terminal_id: str,
    ) -> Dict[str, float]:
        """
        Compute features BEFORE updating customer state (leakage-safe).
        """
        state = self.get_or_create(customer_id)
        amount = float(tx_amount)

        if isinstance(tx_datetime, (pd.Timestamp, datetime)):
            tx_sec = tx_datetime.timestamp()
            tx_hour = tx_datetime.hour
        else:
            tx_sec = float(tx_datetime)
            tx_hour = 12

        # 1. Historical baselines
        cust_tx_count = float(state.tx_count)
        cust_mean = state.mean_amount
        cust_std = state.std_amount
        cust_median = state.median_amount

        # 2. Time delta
        if state.last_tx_sec is not None:
            time_delta_sec = max(0.0, tx_sec - state.last_tx_sec)
        else:
            time_delta_sec = 604800.0  # 7 days

        # 3. Amount departures
        if cust_tx_count > 0 and cust_mean > 0:
            cust_amount_ratio = amount / cust_mean
            cust_amount_diff = amount - cust_mean
            cust_amount_zscore = (amount - cust_mean) / cust_std
        else:
            cust_amount_ratio = 1.0
            cust_amount_diff = 0.0
            cust_amount_zscore = 0.0

        # 4. Multi-window velocity counts & spend
        c_5m = tx_sec - 300
        c_30m = tx_sec - 1800
        c_1h = tx_sec - 3600
        c_24h = tx_sec - 86400
        c_7d = tx_sec - 604800

        count_5m = 0
        count_30m = 0
        count_1h = 0
        count_24h = 0
        count_7d = 0
        spend_1h = 0.0
        spend_24h = 0.0

        # Prune expired transactions older than 7 days
        while state.recent_txs and state.recent_txs[0][0] < c_7d:
            state.recent_txs.popleft()

        for past_sec, past_amt, _ in state.recent_txs:
            if past_sec >= c_5m:
                count_5m += 1
            if past_sec >= c_30m:
                count_30m += 1
            if past_sec >= c_1h:
                count_1h += 1
                spend_1h += past_amt
            if past_sec >= c_24h:
                count_24h += 1
                spend_24h += past_amt
            if past_sec >= c_7d:
                count_7d += 1

        # 5. Terminal Rarity
        unique_terminals = len(state.terminals_seen)
        is_new_term = 1.0 if terminal_id not in state.terminals_seen else 0.0

        # 6. Unusual hour
        if state.tx_count >= 5:
            hour_freq = state.hours_seen[tx_hour] / state.tx_count
            unusual_hour = 1.0 - min(1.0, hour_freq * 4.0)
        else:
            unusual_hour = 0.0

        # 7. Composite Behavioral Deviation Score
        z_norm = min(1.0, max(0.0, (cust_amount_zscore - 1.0) / 4.0)) if cust_amount_zscore > 1.0 else 0.0
        vel_norm = min(1.0, count_1h / 4.0)
        deviation_composite = float(0.45 * z_norm + 0.35 * vel_norm + 0.20 * is_new_term)

        return {
            "CUST_TX_COUNT_TOTAL": cust_tx_count,
            "CUST_TIME_SINCE_PREV": time_delta_sec,
            "CUST_AMOUNT_MEAN": cust_mean,
            "CUST_AMOUNT_STD": cust_std,
            "CUST_AMOUNT_MEDIAN": cust_median,
            "CUST_AMOUNT_RATIO": cust_amount_ratio,
            "CUST_AMOUNT_DIFF": cust_amount_diff,
            "CUST_AMOUNT_ZSCORE": cust_amount_zscore,
            "CUST_TX_COUNT_5M": float(count_5m),
            "CUST_TX_COUNT_30M": float(count_30m),
            "CUST_TX_COUNT_1H": float(count_1h),
            "CUST_TX_COUNT_24H": float(count_24h),
            "CUST_TX_COUNT_7D": float(count_7d),
            "CUST_SPEND_1H": float(spend_1h),
            "CUST_SPEND_24H": float(spend_24h),
            "CUST_UNIQUE_TERMINALS": float(unique_terminals),
            "CUST_IS_NEW_TERMINAL": is_new_term,
            "CUST_UNUSUAL_HOUR_SCORE": float(unusual_hour),
            "CUST_BEHAVIOR_DEVIATION": deviation_composite,
        }

    def update(
        self,
        customer_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
        terminal_id: str,
    ) -> None:
        """
        Update state AFTER computing features.
        """
        state = self.get_or_create(customer_id)
        amount = float(tx_amount)
        if isinstance(tx_datetime, (pd.Timestamp, datetime)):
            tx_sec = tx_datetime.timestamp()
            tx_hour = tx_datetime.hour
        else:
            tx_sec = float(tx_datetime)
            tx_hour = 12

        state.tx_count += 1
        state.total_spend += amount
        state.amounts.append(amount)
        if len(state.amounts) > 100:
            state.amounts = state.amounts[-100:]

        state.recent_txs.append((tx_sec, amount, str(terminal_id)))
        state.terminals_seen.add(str(terminal_id))
        state.hours_seen[tx_hour] += 1
        state.last_tx_sec = tx_sec
