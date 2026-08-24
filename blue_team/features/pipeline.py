"""
Unified Leakage-Safe Feature Pipeline for PayShield AI.
Integrates Customer Behavioral Profiling, Terminal Intelligence, Temporal Dynamics, and Graph Relationships.
Ultra-fast vector/tuple extraction for large batches and real-time inference.
"""

from __future__ import annotations

import os
import pickle
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from blue_team.features.customer_behavior import CustomerProfileManager
from blue_team.features.graph_features import compute_graph_features
from blue_team.features.temporal_features import compute_temporal_features
from blue_team.features.terminal_intelligence import TerminalProfileManager
from blue_team.graph.graph_engine import TransactionGraphEngine


class FeaturePipeline:
    """
    Master feature engineering pipeline combining all sub-engines.
    """

    def __init__(self) -> None:
        self.customer_manager = CustomerProfileManager()
        self.terminal_manager = TerminalProfileManager()
        self.graph_engine = TransactionGraphEngine()
        self._feature_names: Optional[List[str]] = None

    @property
    def feature_names(self) -> List[str]:
        if self._feature_names is None:
            sample_feats = self.extract_features(
                customer_id="C_SAMPLE",
                terminal_id="T_SAMPLE",
                tx_datetime=datetime(2026, 1, 1, 12, 0, 0),
                tx_amount=100.0,
            )
            self._feature_names = sorted(list(sample_feats.keys()))
        return self._feature_names

    def extract_features(
        self,
        customer_id: str,
        terminal_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
    ) -> Dict[str, float]:
        """
        Extract complete feature dictionary for an incoming transaction BEFORE state update.
        """
        cid = str(customer_id)
        tid = str(terminal_id)
        amt = float(tx_amount)

        # 1. Customer behavioral features
        cust_feats = self.customer_manager.compute_features(
            customer_id=cid,
            tx_datetime=tx_datetime,
            tx_amount=amt,
            terminal_id=tid,
        )

        # 2. Terminal intelligence features
        term_feats = self.terminal_manager.compute_features(
            terminal_id=tid,
            tx_datetime=tx_datetime,
            tx_amount=amt,
            customer_id=cid,
        )

        # 3. Temporal & cyclical features
        dt_val = tx_datetime if isinstance(tx_datetime, datetime) else pd.to_datetime(tx_datetime)
        temp_feats = compute_temporal_features(
            tx_datetime=dt_val,
            tx_amount=amt,
        )

        # 4. Graph relationship features
        graph_feats = compute_graph_features(
            graph_engine=self.graph_engine,
            customer_id=cid,
            terminal_id=tid,
            tx_datetime=dt_val,
            tx_amount=amt,
        )

        # Combine all features
        all_feats: Dict[str, float] = {
            **cust_feats,
            **term_feats,
            **temp_feats,
            **graph_feats,
            "TX_RAW_AMOUNT": amt,
        }
        return all_feats

    def update_state(
        self,
        customer_id: str,
        terminal_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
        is_fraud: int = 0,
    ) -> None:
        """
        Update state across all profiling engines.
        """
        cid = str(customer_id)
        tid = str(terminal_id)
        amt = float(tx_amount)

        self.customer_manager.update(cid, tx_datetime, amt, tid)
        self.terminal_manager.update(tid, tx_datetime, amt, cid, is_fraud=is_fraud)
        self.graph_engine.update(cid, tid, tx_datetime, amt, is_fraud=is_fraud)

    def transform_single(
        self,
        customer_id: str,
        terminal_id: str,
        tx_datetime: datetime | pd.Timestamp,
        tx_amount: float,
        update: bool = True,
        is_fraud: int = 0,
    ) -> Dict[str, float]:
        features = self.extract_features(customer_id, terminal_id, tx_datetime, tx_amount)
        if update:
            self.update_state(customer_id, terminal_id, tx_datetime, tx_amount, is_fraud=is_fraud)
        return features

    def transform_dataframe(
        self,
        df: pd.DataFrame,
        update_state: bool = True,
    ) -> pd.DataFrame:
        """
        Fast tuple extraction over a chronologically ordered DataFrame.
        """
        cols = {name: idx for idx, name in enumerate(df.columns)}
        cid_idx = cols["CUSTOMER_ID"]
        tid_idx = cols["TERMINAL_ID"]
        dt_idx = cols["TX_DATETIME"]
        amt_idx = cols["TX_AMOUNT"]
        fraud_idx = cols.get("TX_FRAUD", None)

        features_list = []

        for row in df.itertuples(index=False, name=None):
            cid = str(row[cid_idx])
            tid = str(row[tid_idx])
            dt = row[dt_idx]
            amt = float(row[amt_idx])
            is_fraud = int(row[fraud_idx]) if fraud_idx is not None else 0

            # 1. Extract features (leakage-safe, seeing only prior state)
            feats = self.extract_features(cid, tid, dt, amt)
            features_list.append(feats)

            # 2. Update state if requested
            if update_state:
                self.update_state(cid, tid, dt, amt, is_fraud=is_fraud)

        feature_df = pd.DataFrame(features_list, index=df.index)
        if self._feature_names is None:
            self._feature_names = sorted(list(feature_df.columns))
        return feature_df

    def save(self, file_path: str | Path) -> None:
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "wb") as f:
            pickle.dump(self, f, protocol=pickle.HIGHEST_PROTOCOL)

    @classmethod
    def load(cls, file_path: str | Path) -> "FeaturePipeline":
        with open(file_path, "rb") as f:
            return pickle.load(f)
