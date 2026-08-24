"""
Unit tests for customer behavioral, terminal, temporal, and pipeline features.
"""

from datetime import datetime, timedelta
import pandas as pd
import pytest

from blue_team.features.customer_behavior import CustomerProfileManager
from blue_team.features.pipeline import FeaturePipeline
from blue_team.features.temporal_features import compute_temporal_features
from blue_team.features.terminal_intelligence import TerminalProfileManager


def test_customer_behavioral_leakage_safety():
    manager = CustomerProfileManager()
    cid = "C_TEST_01"
    tid = "T_TEST_01"
    t1 = datetime(2026, 1, 1, 10, 0, 0)
    t2 = datetime(2026, 1, 1, 10, 15, 0)

    # First transaction (cold start)
    feats1 = manager.compute_features(cid, t1, 100.0, tid)
    assert feats1["CUST_TX_COUNT_TOTAL"] == 0.0
    manager.update(cid, t1, 100.0, tid)

    # Second transaction should see previous transaction baseline
    feats2 = manager.compute_features(cid, t2, 500.0, tid)
    assert feats2["CUST_TX_COUNT_TOTAL"] == 1.0
    assert feats2["CUST_AMOUNT_MEAN"] == 100.0
    assert feats2["CUST_AMOUNT_RATIO"] == 5.0
    assert feats2["CUST_TIME_SINCE_PREV"] == 900.0  # 15 minutes


def test_terminal_intelligence_profiles():
    term_mgr = TerminalProfileManager()
    tid = "T_TEST_99"
    cid1 = "C_1"
    cid2 = "C_2"
    t1 = datetime(2026, 1, 1, 12, 0, 0)

    feats1 = term_mgr.compute_features(tid, t1, 50.0, cid1)
    assert feats1["TERM_TX_COUNT_TOTAL"] == 0.0
    term_mgr.update(tid, t1, 50.0, cid1, is_fraud=0)

    feats2 = term_mgr.compute_features(tid, t1 + timedelta(minutes=5), 80.0, cid2)
    assert feats2["TERM_TX_COUNT_TOTAL"] == 1.0
    assert feats2["TERM_IS_NEW_CUSTOMER"] == 1.0


def test_temporal_features_cyclical_bounds():
    dt = datetime(2026, 1, 1, 3, 30, 0)  # 3:30 AM
    feats = compute_temporal_features(dt, 250.0)
    assert feats["TX_IS_NIGHT"] == 1.0
    assert -1.0 <= feats["TX_HOUR_SIN"] <= 1.0
    assert -1.0 <= feats["TX_HOUR_COS"] <= 1.0


def test_feature_pipeline_dataframe_transformation():
    pipeline = FeaturePipeline()
    base_time = datetime(2026, 1, 1, 0, 0, 0)
    df = pd.DataFrame(
        [
            {
                "TRANSACTION_ID": 1,
                "TX_DATETIME": base_time,
                "CUSTOMER_ID": "C_10",
                "TERMINAL_ID": "T_20",
                "TX_AMOUNT": 100.0,
                "TX_FRAUD": 0,
            },
            {
                "TRANSACTION_ID": 2,
                "TX_DATETIME": base_time + timedelta(minutes=10),
                "CUSTOMER_ID": "C_10",
                "TERMINAL_ID": "T_20",
                "TX_AMOUNT": 200.0,
                "TX_FRAUD": 0,
            },
        ]
    )

    feat_df = pipeline.transform_dataframe(df, update_state=True)
    assert len(feat_df) == 2
    assert "CUST_AMOUNT_MEAN" in feat_df.columns
    assert "TERM_RISK_SCORE" in feat_df.columns
    assert "GRAPH_RISK_SCORE" in feat_df.columns
