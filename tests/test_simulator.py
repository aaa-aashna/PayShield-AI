"""
Unit tests for Red Team attack generators and simulation environment.
"""

from datetime import datetime
import numpy as np
import pandas as pd
import pytest

from blue_team.explainability.explainer import TransactionExplainer
from blue_team.features.pipeline import FeaturePipeline
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.supervised import HistGradientBoostingFraudModel
from blue_team.risk_engine.escalation import AdaptiveEscalationTracker
from blue_team.risk_engine.fusion import RiskFusionEngine
from red_team.generators.attack_generator import AttackScenarioGenerator
from simulator.environment import SimulationEnvironment


def test_attack_scenario_generator_all_types():
    gen = AttackScenarioGenerator()
    attacks = [
        "Transaction Burst",
        "Amount Escalation",
        "Terminal Hopping",
        "Behavioral Shift",
        "Coordinated Attack",
        "Slow and Low",
    ]

    for atk in attacks:
        txs = gen.generate_attack_by_name(atk, num_transactions=4)
        assert len(txs) >= 1
        assert all(t.tx_amount > 0 for t in txs)
        assert all(t.customer_id is not None for t in txs)


def test_simulation_environment_end_to_end():
    pipe = FeaturePipeline()
    sup = HistGradientBoostingFraudModel()
    anom = IsolationForestAnomalyDetector()

    # Fit models on small dummy data so imputer and estimator are fitted
    feat_names = pipe.feature_names
    dummy_X = pd.DataFrame(np.random.randn(50, len(feat_names)), columns=feat_names)
    dummy_y = np.random.choice([0, 1], size=50, p=[0.9, 0.1])
    sup.fit(dummy_X, dummy_y)
    anom.fit(dummy_X)

    fusion = RiskFusionEngine()
    tracker = AdaptiveEscalationTracker()
    explainer = TransactionExplainer()

    sim = SimulationEnvironment(pipe, sup, anom, fusion, tracker, explainer)
    result = sim.run_scenario("Transaction Burst", intensity=0.8, num_transactions=4)

    assert result.total_transactions == 4
    assert len(result.step_logs) == 4
    assert result.max_risk_score > 0
