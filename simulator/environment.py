"""
Closed-loop Red Team vs Blue Team Simulation Environment.
Connects Red Team attack generators directly into the Blue Team multi-tier ML defense stack.
Measures detection latency, step-by-step risk escalation, and mitigation efficacy.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from blue_team.explainability.explainer import TransactionExplainer
from blue_team.features.pipeline import FeaturePipeline
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.supervised import BaseFraudModel
from blue_team.risk_engine.escalation import AdaptiveEscalationTracker
from blue_team.risk_engine.fusion import DecisionAction, RiskAssessment, RiskFusionEngine, RiskLevel
from red_team.generators.attack_generator import AttackScenarioGenerator, SyntheticTransaction


@dataclass
class SimulationStepLog:
    step_number: int
    transaction_id: str
    tx_datetime: str
    customer_id: str
    terminal_id: str
    tx_amount: float
    attack_type: str
    fraud_probability: float
    anomaly_score: float
    customer_deviation: float
    terminal_risk: float
    velocity_score: float
    graph_risk: float
    risk_score: float
    risk_level: str
    decision: str
    is_escalated: bool
    escalation_notes: Optional[str]
    reasons: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SimulationResult:
    attack_type: str
    intensity: float
    total_transactions: int
    detected: bool
    blocked: bool
    detection_step: Optional[int]
    max_risk_score: float
    average_risk_score: float
    alerts_count: int
    step_logs: List[SimulationStepLog] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "attack_type": self.attack_type,
            "intensity": round(self.intensity, 2),
            "total_transactions": self.total_transactions,
            "detected": self.detected,
            "blocked": self.blocked,
            "detection_step": self.detection_step,
            "max_risk_score": round(self.max_risk_score, 2),
            "average_risk_score": round(self.average_risk_score, 2),
            "alerts_count": self.alerts_count,
            "step_logs": [s.to_dict() for s in self.step_logs],
        }


class SimulationEnvironment:
    """
    Orchestrates execution of adversarial payment attacks against the Blue Team defenses.
    """

    def __init__(
        self,
        feature_pipeline: FeaturePipeline,
        supervised_model: BaseFraudModel,
        anomaly_model: IsolationForestAnomalyDetector,
        fusion_engine: Optional[RiskFusionEngine] = None,
        escalation_tracker: Optional[AdaptiveEscalationTracker] = None,
        explainer: Optional[TransactionExplainer] = None,
        model_version: str = "v1.0.0",
    ) -> None:
        self.pipeline = feature_pipeline
        self.supervised_model = supervised_model
        self.anomaly_model = anomaly_model
        self.fusion_engine = fusion_engine or RiskFusionEngine()
        self.escalation_tracker = escalation_tracker or AdaptiveEscalationTracker()
        self.explainer = explainer or TransactionExplainer()
        self.generator = AttackScenarioGenerator()
        self.model_version = model_version

    def run_transactions(
        self,
        transactions: List[SyntheticTransaction],
        update_state: bool = True,
    ) -> SimulationResult:
        """
        Execute a stream of synthetic transactions through the complete ML defense pipeline.
        """
        if not transactions:
            raise ValueError("No transactions provided for simulation.")

        step_logs: List[SimulationStepLog] = []
        detection_step = None
        max_risk = 0.0
        risk_scores = []
        alerts_count = 0
        blocked_flag = False

        for idx, tx in enumerate(transactions):
            step_num = idx + 1
            dt = tx.tx_datetime
            amt = float(tx.tx_amount)
            cid = str(tx.customer_id)
            tid = str(tx.terminal_id)

            # 1. Feature Extraction (leakage safe)
            features = self.pipeline.extract_features(cid, tid, dt, amt)
            feature_df = pd.DataFrame([features])

            # 2. Supervised ML Fraud Probability
            probs = self.supervised_model.predict_proba(feature_df)
            fraud_prob = float(probs[0])

            # 3. Unsupervised Anomaly Score
            anom_scores = self.anomaly_model.predict_anomaly_score(feature_df)
            anom_score = float(anom_scores[0])

            # 4. Component Signals
            cust_dev = float(features.get("CUST_BEHAVIOR_DEVIATION", 0.0))
            term_risk = float(features.get("TERM_RISK_SCORE", 0.0))
            vel_score = min(1.0, float(features.get("CUST_TX_COUNT_1H", 0.0)) / 4.0)
            graph_risk = float(features.get("GRAPH_RISK_SCORE", 0.0))

            # 5. Explainability
            comp_dict = {
                "fraud_probability": fraud_prob,
                "anomaly_score": anom_score,
                "customer_deviation": cust_dev,
                "terminal_risk": term_risk,
                "velocity_score": vel_score,
                "graph_risk": graph_risk,
            }
            reasons = self.explainer.generate_reasons(features, comp_dict, cid, tid, amt)

            # 6. Risk Fusion
            raw_assessment = self.fusion_engine.evaluate(
                transaction_id=tx.transaction_id,
                fraud_probability=fraud_prob,
                anomaly_score=anom_score,
                customer_deviation=cust_dev,
                terminal_risk=term_risk,
                velocity_score=vel_score,
                graph_risk=graph_risk,
                reasons=reasons,
                model_version=self.model_version,
            )

            # 7. Adaptive Sequence Escalation
            final_assessment = self.escalation_tracker.evaluate_and_escalate(
                customer_id=cid,
                tx_datetime=dt,
                assessment=raw_assessment,
            )

            # 8. Update pipeline state for next transaction
            if update_state:
                is_fraud_label = 1 if final_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL] else 0
                self.pipeline.update_state(cid, tid, dt, amt, is_fraud=is_fraud_label)

            # Track statistics
            current_risk = final_assessment.risk_score
            risk_scores.append(current_risk)
            if current_risk > max_risk:
                max_risk = current_risk

            if final_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                alerts_count += 1
                if detection_step is None:
                    detection_step = step_num

            if final_assessment.decision == DecisionAction.BLOCK:
                blocked_flag = True

            log = SimulationStepLog(
                step_number=step_num,
                transaction_id=tx.transaction_id,
                tx_datetime=dt.isoformat(),
                customer_id=cid,
                terminal_id=tid,
                tx_amount=amt,
                attack_type=tx.attack_type,
                fraud_probability=round(fraud_prob, 4),
                anomaly_score=round(anom_score, 4),
                customer_deviation=round(cust_dev, 4),
                terminal_risk=round(term_risk, 4),
                velocity_score=round(vel_score, 4),
                graph_risk=round(graph_risk, 4),
                risk_score=round(current_risk, 2),
                risk_level=final_assessment.risk_level.value,
                decision=final_assessment.decision.value,
                is_escalated=final_assessment.is_escalated,
                escalation_notes=final_assessment.escalation_notes,
                reasons=final_assessment.reasons,
            )
            step_logs.append(log)

        avg_risk = float(np.mean(risk_scores)) if risk_scores else 0.0
        is_detected = (detection_step is not None) or (max_risk >= 60.0)

        return SimulationResult(
            attack_type=transactions[0].attack_type,
            intensity=1.0,
            total_transactions=len(transactions),
            detected=is_detected,
            blocked=blocked_flag,
            detection_step=detection_step,
            max_risk_score=max_risk,
            average_risk_score=avg_risk,
            alerts_count=alerts_count,
            step_logs=step_logs,
        )

    def run_scenario(
        self,
        attack_type: str,
        customer_id: str = "C_1042",
        terminal_id: str = "T_5081",
        intensity: float = 0.8,
        num_transactions: int = 5,
    ) -> SimulationResult:
        """
        Generate attack scenario on demand and execute simulation.
        """
        txs = self.generator.generate_attack_by_name(
            attack_type=attack_type,
            customer_id=customer_id,
            terminal_id=terminal_id,
            intensity=intensity,
            num_transactions=num_transactions,
        )
        res = self.run_transactions(txs)
        res.intensity = intensity
        return res
