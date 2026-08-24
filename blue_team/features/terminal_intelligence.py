"""
High-Performance Terminal Intelligence Profiling and Feature Extraction.
Leakage-safe baselines with optimized timestamp arithmetic and sliding queues.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Set

import numpy as np
import pandas as pd


@dataclass
class TerminalState:
    terminal_id: str
    tx_count: int = 0
    total_volume: float = 0.0
    amounts: List[float] = field(default_factory=list)
    recent_txs: deque = field(default_factory=deque)  # (timestamp_sec, amount, customer_id)
    customers_seen: Set[str] = field(default_factory=set)
    fraud_count: int = 0

    @property
    def mean_amount(self) -> float:
        return (self.total_volume / self.tx_count) if self.tx_count > 0 else 0.0

    @property
    def std_amount(self) -> float:
        if len(self.amounts) < 2:
            return 20.0
        return float(np.std(self.amounts[-50:])) + 1e-4


class TerminalProfileManager:
    """
    Maintains online terminal intelligence profiles with ultra-fast feature computation.
    """

    def __init__(self) -> None:
        self.profiles: Dict[str, TerminalState] = {}

    def get_or_create(self, terminal_id: str) -> TerminalState:
        term_id = str(terminal_id)
        if term_id not in self.profiles:
            self.profiles[term_id] = TerminalState(terminal_id=term_id)
        return self.profiles[term_id]

    def compute_features(
        self,
        terminal_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
        customer_id: str,
    ) -> Dict[str, float]:
        """
        Compute terminal features BEFORE updating terminal state (leakage-safe).
        """
        state = self.get_or_create(terminal_id)
        amount = float(tx_amount)

        if isinstance(tx_datetime, (pd.Timestamp, datetime)):
            tx_sec = tx_datetime.timestamp()
        else:
            tx_sec = float(tx_datetime)

        # 1. Historical Volume and Stats
        term_tx_count = float(state.tx_count)
        term_mean = state.mean_amount
        term_std = state.std_amount

        # 2. Deviations
        if term_tx_count > 0 and term_mean > 0:
            term_amount_ratio = amount / term_mean
            term_amount_zscore = (amount - term_mean) / term_std
        else:
            term_amount_ratio = 1.0
            term_amount_zscore = 0.0

        # 3. Customer Diversity & Rarity
        unique_customers = len(state.customers_seen)
        customer_diversity = unique_customers / (term_tx_count + 1.0) if term_tx_count > 0 else 1.0
        is_new_customer_for_terminal = 1.0 if customer_id not in state.customers_seen else 0.0

        # 4. Recent Terminal Activity Burst (1h, 24h)
        c_1h = tx_sec - 3600
        c_24h = tx_sec - 86400

        # Prune transactions older than 24h
        while state.recent_txs and state.recent_txs[0][0] < c_24h:
            state.recent_txs.popleft()

        count_1h = 0
        count_24h = 0
        volume_1h = 0.0

        for past_sec, past_amt, _ in state.recent_txs:
            if past_sec >= c_1h:
                count_1h += 1
                volume_1h += past_amt
            if past_sec >= c_24h:
                count_24h += 1

        # 5. Empirical Bayes Smoothed Fraud Rate
        smoothed_fraud_rate = (state.fraud_count + 0.84) / (term_tx_count + 100.0)

        # 6. Terminal Composite Risk Score (0 to 1)
        burst_risk = min(1.0, count_1h / 10.0)
        fraud_risk_scaled = min(1.0, smoothed_fraud_rate * 25.0)
        term_composite_risk = float(
            0.50 * fraud_risk_scaled + 0.30 * burst_risk + 0.20 * min(1.0, abs(term_amount_zscore) / 4.0)
        )

        return {
            "TERM_TX_COUNT_TOTAL": term_tx_count,
            "TERM_AMOUNT_MEAN": term_mean,
            "TERM_AMOUNT_STD": term_std,
            "TERM_AMOUNT_RATIO": term_amount_ratio,
            "TERM_AMOUNT_ZSCORE": term_amount_zscore,
            "TERM_UNIQUE_CUSTOMERS": float(unique_customers),
            "TERM_CUSTOMER_DIVERSITY": float(customer_diversity),
            "TERM_IS_NEW_CUSTOMER": is_new_customer_for_terminal,
            "TERM_TX_COUNT_1H": float(count_1h),
            "TERM_TX_COUNT_24H": float(count_24h),
            "TERM_VOLUME_1H": float(volume_1h),
            "TERM_FRAUD_RATE_SMOOTHED": float(smoothed_fraud_rate),
            "TERM_RISK_SCORE": term_composite_risk,
        }

    def update(
        self,
        terminal_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
        customer_id: str,
        is_fraud: int = 0,
    ) -> None:
        """
        Update terminal state AFTER computing features.
        """
        state = self.get_or_create(terminal_id)
        amount = float(tx_amount)
        if isinstance(tx_datetime, (pd.Timestamp, datetime)):
            tx_sec = tx_datetime.timestamp()
        else:
            tx_sec = float(tx_datetime)

        state.tx_count += 1
        state.total_volume += amount
        state.amounts.append(amount)
        if len(state.amounts) > 100:
            state.amounts = state.amounts[-100:]

        state.recent_txs.append((tx_sec, amount, str(customer_id)))
        state.customers_seen.add(str(customer_id))
        if is_fraud > 0:
            state.fraud_count += 1
