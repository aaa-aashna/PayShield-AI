"""
Hybrid Risk Fusion Engine for PayShield AI.
Combines Supervised Probability, Unsupervised Anomaly Score, Customer Deviation,
Terminal Risk, Velocity Dynamics, and Graph Relationship Risk into a unified,
calibrated 0-100 Risk Score and Decision.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DecisionAction(str, Enum):
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    CHALLENGE = "CHALLENGE"
    BLOCK = "BLOCK"


@dataclass
class RiskComponentScores:
    fraud_probability: float = 0.0
    anomaly_score: float = 0.0
    customer_deviation: float = 0.0
    terminal_risk: float = 0.0
    velocity_score: float = 0.0
    graph_risk: float = 0.0
    behavior_shift: float = 0.0

    def to_dict(self) -> Dict[str, float]:
        return asdict(self)


@dataclass
class RiskAssessment:
    transaction_id: str
    risk_score: float
    risk_level: RiskLevel
    decision: DecisionAction
    components: RiskComponentScores
    reasons: List[str] = field(default_factory=list)
    is_escalated: bool = False
    escalation_notes: Optional[str] = None
    model_version: str = "v1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "transaction_id": self.transaction_id,
            "risk_score": round(self.risk_score, 2),
            "risk_level": self.risk_level.value,
            "decision": self.decision.value,
            "components": self.components.to_dict(),
            "reasons": self.reasons,
            "is_escalated": self.is_escalated,
            "escalation_notes": self.escalation_notes,
            "model_version": self.model_version,
        }


class RiskFusionEngine:
    """
    Deterministic risk fusion and decisioning layer.
    Weights are calibrated and documented:
    - Supervised Probability (35%): Direct historical fraud pattern match
    - Anomaly Score (20%): Unsupervised multidimensional outlier severity
    - Customer Deviation (15%): Z-score departure from customer baseline
    - Terminal Risk (10%): Terminal volume burst and historical fraud priors
    - Velocity Score (10%): Short-window transaction frequency burst
    - Graph Risk (10%): Rarity of entity relationship and neighborhood risk
    """

    DEFAULT_WEIGHTS = {
        "fraud_probability": 0.35,
        "anomaly_score": 0.20,
        "customer_deviation": 0.15,
        "terminal_risk": 0.10,
        "velocity_score": 0.10,
        "graph_risk": 0.10,
    }

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        low_threshold: float = 30.0,
        medium_threshold: float = 60.0,
        high_threshold: float = 80.0,
    ) -> None:
        self.weights = weights or self.DEFAULT_WEIGHTS
        self.low_threshold = low_threshold
        self.medium_threshold = medium_threshold
        self.high_threshold = high_threshold

    def evaluate(
        self,
        transaction_id: str,
        fraud_probability: float,
        anomaly_score: float,
        customer_deviation: float,
        terminal_risk: float,
        velocity_score: float,
        graph_risk: float,
        behavior_shift: float = 0.0,
        reasons: Optional[List[str]] = None,
        model_version: str = "v1.0.0",
    ) -> RiskAssessment:
        """
        Fuse individual component signals into composite 0-100 risk score and mapped decision.
        """
        # Clamp components to [0, 1]
        p_fraud = min(1.0, max(0.0, float(fraud_probability)))
        s_anom = min(1.0, max(0.0, float(anomaly_score)))
        d_cust = min(1.0, max(0.0, float(customer_deviation)))
        r_term = min(1.0, max(0.0, float(terminal_risk)))
        v_vel = min(1.0, max(0.0, float(velocity_score)))
        g_graph = min(1.0, max(0.0, float(graph_risk)))
        b_shift = min(1.0, max(0.0, float(behavior_shift)))

        components = RiskComponentScores(
            fraud_probability=p_fraud,
            anomaly_score=s_anom,
            customer_deviation=d_cust,
            terminal_risk=r_term,
            velocity_score=v_vel,
            graph_risk=g_graph,
            behavior_shift=b_shift,
        )

        # Calculate weighted sum
        raw_fusion = (
            self.weights["fraud_probability"] * p_fraud
            + self.weights["anomaly_score"] * s_anom
            + self.weights["customer_deviation"] * d_cust
            + self.weights["terminal_risk"] * r_term
            + self.weights["velocity_score"] * v_vel
            + self.weights["graph_risk"] * g_graph
        )

        # Scale to 0-100
        risk_score = min(100.0, max(0.0, raw_fusion * 100.0))

        # Categorize Risk Level & Decision
        if risk_score < self.low_threshold:
            risk_level = RiskLevel.LOW
            decision = DecisionAction.APPROVE
        elif risk_score < self.medium_threshold:
            risk_level = RiskLevel.MEDIUM
            decision = DecisionAction.REVIEW
        elif risk_score < self.high_threshold:
            risk_level = RiskLevel.HIGH
            decision = DecisionAction.CHALLENGE
        else:
            risk_level = RiskLevel.CRITICAL
            decision = DecisionAction.BLOCK

        return RiskAssessment(
            transaction_id=str(transaction_id),
            risk_score=risk_score,
            risk_level=risk_level,
            decision=decision,
            components=components,
            reasons=reasons or [],
            model_version=model_version,
        )
