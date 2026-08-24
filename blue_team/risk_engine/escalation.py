"""
Adaptive Risk Escalation Engine for PayShield AI.
Tracks session sequences and escalates risk dynamically as suspicious evidence accumulates.
"""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from blue_team.risk_engine.fusion import DecisionAction, RiskAssessment, RiskLevel


@dataclass
class CustomerSessionEvent:
    tx_id: str
    tx_datetime: datetime
    raw_risk_score: float
    risk_level: RiskLevel
    decision: DecisionAction


class AdaptiveEscalationTracker:
    """
    Maintains a sliding contextual window of recent customer decisions.
    Escalates risk as suspicious transaction sequences compound.
    """

    def __init__(self, window_minutes: int = 30) -> None:
        self.window_minutes = window_minutes
        self.history: Dict[str, deque[CustomerSessionEvent]] = defaultdict(lambda: deque(maxlen=20))

    def evaluate_and_escalate(
        self,
        customer_id: str,
        tx_datetime: datetime,
        assessment: RiskAssessment,
    ) -> RiskAssessment:
        """
        Check customer session history and apply adaptive escalation if suspicious evidence accumulates.
        """
        cid = str(customer_id)
        cutoff = tx_datetime - timedelta(minutes=self.window_minutes)

        # Get recent events within window
        recent = [ev for ev in self.history[cid] if ev.tx_datetime >= cutoff]

        # Count suspicious occurrences (MEDIUM, HIGH, or CRITICAL)
        suspicious_past = [ev for ev in recent if ev.raw_risk_score >= 35.0]
        suspicious_count = len(suspicious_past)

        escalated_score = assessment.risk_score
        is_escalated = False
        notes = None

        if suspicious_count > 0 and assessment.risk_score >= 30.0:
            # Multiplier escalates with repeated suspicious events
            multiplier = 1.0 + (0.25 * min(3, suspicious_count))
            escalated_score = min(100.0, assessment.risk_score * multiplier)
            is_escalated = True
            notes = (
                f"Adaptive Escalation: Transaction sequence event #{suspicious_count + 1} within "
                f"{self.window_minutes}m escalated risk from {assessment.risk_score:.1f} to {escalated_score:.1f}."
            )

        # Re-determine risk level & decision with escalated score
        if escalated_score >= 80.0:
            new_level = RiskLevel.CRITICAL
            new_decision = DecisionAction.BLOCK
        elif escalated_score >= 60.0:
            new_level = RiskLevel.HIGH
            new_decision = DecisionAction.CHALLENGE
        elif escalated_score >= 30.0:
            new_level = RiskLevel.MEDIUM
            new_decision = DecisionAction.REVIEW
        else:
            new_level = RiskLevel.LOW
            new_decision = DecisionAction.APPROVE

        # Record this event into history
        event = CustomerSessionEvent(
            tx_id=assessment.transaction_id,
            tx_datetime=tx_datetime,
            raw_risk_score=assessment.risk_score,
            risk_level=assessment.risk_level,
            decision=assessment.decision,
        )
        self.history[cid].append(event)

        return RiskAssessment(
            transaction_id=assessment.transaction_id,
            risk_score=escalated_score,
            risk_level=new_level,
            decision=new_decision,
            components=assessment.components,
            reasons=assessment.reasons,
            is_escalated=is_escalated,
            escalation_notes=notes,
            model_version=assessment.model_version,
        )
