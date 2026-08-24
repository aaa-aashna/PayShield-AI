"""
Explainability and Feature Attribution Engine for PayShield AI.
Translates multidimensional ML signals, behavioral departures, graph relations,
and anomaly scores into clear, human-readable forensic explanations.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple


class TransactionExplainer:
    """
    Decomposes risk signals into human-readable forensic causal factors.
    """

    def generate_reasons(
        self,
        features: Dict[str, float],
        components: Dict[str, float],
        customer_id: str,
        terminal_id: str,
        tx_amount: float,
    ) -> List[str]:
        """
        Produce human-readable bullet points explaining why a transaction received its risk score.
        """
        reasons: List[str] = []

        # 1. Behavioral Deviation & Amount Outliers
        amount_ratio = features.get("CUST_AMOUNT_RATIO", 1.0)
        mean_amt = features.get("CUST_AMOUNT_MEAN", 0.0)
        zscore = features.get("CUST_AMOUNT_ZSCORE", 0.0)

        if amount_ratio >= 3.0 and mean_amt > 0:
            reasons.append(
                f"BEHAVIORAL DEVIATION: Transaction amount (${tx_amount:,.2f}) is {amount_ratio:.1f}x the customer's historical average of ${mean_amt:,.2f} (Z-Score: +{zscore:.1f}σ)."
            )
        elif amount_ratio >= 2.0 and mean_amt > 0:
            reasons.append(
                f"ELEVATED AMOUNT: Amount (${tx_amount:,.2f}) is {amount_ratio:.1f}x customer's normal baseline."
            )

        # 2. Velocity Spikes
        count_5m = int(features.get("CUST_TX_COUNT_5M", 0))
        count_1h = int(features.get("CUST_TX_COUNT_1H", 0))
        time_since_prev = features.get("CUST_TIME_SINCE_PREV", 86400)

        if count_5m >= 3:
            reasons.append(
                f"HIGH VELOCITY BURST: {count_5m + 1} transactions initiated within a 5-minute window."
            )
        elif count_1h >= 4:
            reasons.append(
                f"ELEVATED FREQUENCY: {count_1h + 1} transactions attempted in the last 60 minutes."
            )
        elif time_since_prev < 60.0:
            reasons.append(
                f"RAPID SEQUENCING: Transaction occurred only {time_since_prev:.0f}s after previous transaction."
            )

        # 3. New & Unusual Relationships
        is_new_term = features.get("CUST_IS_NEW_TERMINAL", 0.0)
        is_new_rel = features.get("GRAPH_NEW_RELATIONSHIP", 0.0)
        if is_new_term >= 0.5 or is_new_rel >= 0.5:
            reasons.append(
                f"NEW RELATIONSHIP: Customer {customer_id} has never transacted at Terminal {terminal_id} before."
            )

        # 4. Graph Neighborhood & Terminal Risk
        graph_risk = components.get("graph_risk", 0.0)
        neighborhood_fraud = features.get("GRAPH_NEIGHBORHOOD_FRAUD_RISK", 0.0)
        term_fraud_rate = features.get("TERM_FRAUD_RATE_SMOOTHED", 0.0)

        if neighborhood_fraud > 0.05:
            reasons.append(
                f"GRAPH RISK: Terminal {terminal_id} is connected to historical fraud-flagged entities (Neighborhood Risk: {neighborhood_fraud:.1%})."
            )
        elif term_fraud_rate > 0.02:
            reasons.append(
                f"SUSPICIOUS TERMINAL: Terminal exhibits elevated historical fraud activity ({term_fraud_rate:.1%})."
            )

        # 5. Temporal / Off-Hours Anomaly
        unusual_hour = features.get("CUST_UNUSUAL_HOUR_SCORE", 0.0)
        is_night = features.get("TX_IS_NIGHT", 0.0)
        if unusual_hour >= 0.7:
            reasons.append(
                f"TEMPORAL ANOMALY: Transaction initiated outside customer's typical active hours."
            )
        elif is_night >= 0.5 and (amount_ratio >= 2.0 or count_1h >= 2):
            reasons.append(
                "NIGHT TIME SURGE: Off-hours transaction matching atypical velocity profile."
            )

        # 6. Unsupervised Anomaly Isolation
        anom_score = components.get("anomaly_score", 0.0)
        if anom_score >= 0.70:
            reasons.append(
                f"UNSUPERVISED ANOMALY: Isolation Forest flagged multidimensional behavior outlier (Anomaly Score: {anom_score:.2f})."
            )

        # 7. Supervised ML Pattern Match
        p_fraud = components.get("fraud_probability", 0.0)
        if p_fraud >= 0.75:
            reasons.append(
                f"SUPERVISED ML MATCH: Gradient boosting pattern strongly matches historical fraud signatures (Fraud Prob: {p_fraud:.1%})."
            )

        # If clean / normal
        if not reasons:
            reasons.append("NORMAL BEHAVIOR: Transaction aligns with customer baseline and terminal history.")

        return reasons

    def compute_feature_attributions(
        self,
        features: Dict[str, float],
        top_n: int = 6,
    ) -> List[Dict[str, Any]]:
        """
        Compute normalized feature contributions for forensic radar/bar charts.
        """
        key_signals = [
            ("Amount Deviation", min(1.0, max(0.0, (features.get("CUST_AMOUNT_RATIO", 1.0) - 1.0) / 4.0))),
            ("Velocity Spike", min(1.0, features.get("CUST_TX_COUNT_1H", 0.0) / 5.0)),
            ("Entity Rarity", features.get("CUST_IS_NEW_TERMINAL", 0.0)),
            ("Graph Neighborhood", min(1.0, features.get("GRAPH_NEIGHBORHOOD_FRAUD_RISK", 0.0) * 10.0)),
            ("Terminal Risk", features.get("TERM_RISK_SCORE", 0.0)),
            ("Off-Hours Deviation", features.get("CUST_UNUSUAL_HOUR_SCORE", 0.0)),
        ]

        # Sort by signal magnitude
        sorted_signals = sorted(key_signals, key=lambda x: x[1], reverse=True)
        return [{"factor": name, "contribution": round(score, 3)} for name, score in sorted_signals[:top_n]]
