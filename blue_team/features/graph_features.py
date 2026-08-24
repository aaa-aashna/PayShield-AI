"""
Graph feature extraction interface.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional

from blue_team.graph.graph_engine import TransactionGraphEngine


def compute_graph_features(
    graph_engine: TransactionGraphEngine,
    customer_id: str,
    terminal_id: str,
    tx_datetime: Optional[datetime] = None,
    tx_amount: float = 0.0,
) -> Dict[str, float]:
    """
    Extract graph relationship features using the stateful graph engine.
    """
    return graph_engine.compute_features(
        customer_id=customer_id,
        terminal_id=terminal_id,
        tx_datetime=tx_datetime,
        tx_amount=tx_amount,
    )
