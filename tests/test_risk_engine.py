"""
Unit tests for risk fusion, adaptive escalation, and explainability.
"""

from datetime import datetime, timedelta
import pytest

from blue_team.explainability.explainer import TransactionExplainer
from blue_team.risk_engine.escalation import AdaptiveEscalationTracker
from blue_team.risk_engine.fusion import DecisionAction, RiskFusionEngine, RiskLevel


def test_risk_fusion_engine_ranges_and_decisions():
    fusion = RiskFusionEngine()

    # Clean / Low risk transaction
    low_res = fusion.evaluate(
        transaction_id="TX_01",
        fraud_probability=0.02,
        anomaly_score=0.05,
        customer_deviation=0.05,
        terminal_risk=0.05,
        velocity_score=0.0,
        graph_risk=0.05,
    )
    assert low_res.risk_level == RiskLevel.LOW
    assert low_res.decision == DecisionAction.APPROVE
    assert low_res.risk_score < 30.0

    # Severe / Critical fraud transaction
    crit_res = fusion.evaluate(
        transaction_id="TX_02",
        fraud_probability=0.95,
        anomaly_score=0.90,
        customer_deviation=0.85,
        terminal_risk=0.80,
        velocity_score=0.90,
        graph_risk=0.75,
    )
    assert crit_res.risk_level == RiskLevel.CRITICAL
    assert crit_res.decision == DecisionAction.BLOCK
    assert crit_res.risk_score >= 80.0


def test_adaptive_escalation_tracker_sequence():
    fusion = RiskFusionEngine()
    tracker = AdaptiveEscalationTracker(window_minutes=30)
    cid = "C_ESCALATE_01"
    now = datetime(2026, 1, 1, 14, 0, 0)

    # First suspicious transaction
    t1_raw = fusion.evaluate("TX_A1", 0.40, 0.40, 0.40, 0.40, 0.40, 0.40)
    t1_final = tracker.evaluate_and_escalate(cid, now, t1_raw)
    assert not t1_final.is_escalated

    # Second suspicious transaction within 5 minutes -> Should escalate
    t2_raw = fusion.evaluate("TX_A2", 0.45, 0.45, 0.45, 0.45, 0.45, 0.45)
    t2_final = tracker.evaluate_and_escalate(cid, now + timedelta(minutes=5), t2_raw)
    assert t2_final.is_escalated
    assert t2_final.risk_score > t2_raw.risk_score


def test_transaction_explainer_reasons_generation():
    explainer = TransactionExplainer()
    features = {
        "CUST_AMOUNT_RATIO": 4.5,
        "CUST_AMOUNT_MEAN": 200.0,
        "CUST_AMOUNT_ZSCORE": 3.5,
        "CUST_TX_COUNT_5M": 4.0,
        "CUST_IS_NEW_TERMINAL": 1.0,
    }
    components = {"fraud_probability": 0.85, "anomaly_score": 0.80}

    reasons = explainer.generate_reasons(
        features=features,
        components=components,
        customer_id="C_101",
        terminal_id="T_202",
        tx_amount=900.0,
    )
    assert len(reasons) >= 3
    assert any("BEHAVIORAL DEVIATION" in r for r in reasons)
    assert any("HIGH VELOCITY" in r for r in reasons)
    assert any("NEW RELATIONSHIP" in r for r in reasons)
