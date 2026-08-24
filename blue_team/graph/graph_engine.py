"""
Graph-based transaction relationship intelligence engine.
Constructs and maintains a bipartite customer-terminal entity graph using NetworkX.
Provides topological features, neighborhood risk propagation, and interactive subgraphs.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

import networkx as nx


class TransactionGraphEngine:
    """
    Stateful bipartite entity graph engine connecting Customers and Terminals.
    """

    def __init__(self) -> None:
        self.graph: nx.Graph = nx.Graph()
        self.fraud_nodes: Set[str] = set()

    def _cust_node(self, customer_id: str) -> str:
        return f"C_{customer_id}"

    def _term_node(self, terminal_id: str) -> str:
        return f"T_{terminal_id}"

    def compute_features(
        self,
        customer_id: str,
        terminal_id: str,
        tx_datetime: Optional[datetime] = None,
        tx_amount: float = 0.0,
    ) -> Dict[str, float]:
        """
        Compute graph topological and neighborhood features BEFORE adding the new edge (leakage-safe).
        """
        c_node = self._cust_node(customer_id)
        t_node = self._term_node(terminal_id)

        # 1. Degrees (number of distinct connected entities)
        cust_degree = float(self.graph.degree(c_node)) if self.graph.has_node(c_node) else 0.0
        term_degree = float(self.graph.degree(t_node)) if self.graph.has_node(t_node) else 0.0

        # 2. Relationship rarity & history
        if self.graph.has_edge(c_node, t_node):
            is_new_relationship = 0.0
            edge_data = self.graph[c_node][t_node]
            edge_weight = float(edge_data.get("weight", 1))
            edge_volume = float(edge_data.get("total_amount", 0.0))
        else:
            is_new_relationship = 1.0
            edge_weight = 0.0
            edge_volume = 0.0

        # 3. Shared terminal neighbors (2-hop customer neighbors)
        shared_customers_count = 0.0
        if self.graph.has_node(t_node):
            shared_customers_count = float(len(list(self.graph.neighbors(t_node))))

        # 4. Neighborhood fraud risk (1-hop & 2-hop)
        neighbor_fraud_count = 0
        total_neighbors = 0
        if self.graph.has_node(t_node):
            for nbr in self.graph.neighbors(t_node):
                total_neighbors += 1
                if nbr in self.fraud_nodes:
                    neighbor_fraud_count += 1

        neighborhood_risk = (
            (neighbor_fraud_count / max(1, total_neighbors))
            if total_neighbors > 0
            else 0.0
        )

        # 5. Composite Graph Risk Score (0 to 1)
        # Higher if new relationship at a terminal with fraud neighborhood or very anomalous degrees
        graph_risk = float(
            0.40 * neighborhood_risk
            + 0.35 * is_new_relationship
            + 0.25 * min(1.0, term_degree / 100.0 if term_degree > 50 else 0.0)
        )

        return {
            "GRAPH_CUST_DEGREE": cust_degree,
            "GRAPH_TERM_DEGREE": term_degree,
            "GRAPH_NEW_RELATIONSHIP": is_new_relationship,
            "GRAPH_EDGE_WEIGHT": edge_weight,
            "GRAPH_SHARED_CUSTOMERS": shared_customers_count,
            "GRAPH_NEIGHBORHOOD_FRAUD_RISK": float(neighborhood_risk),
            "GRAPH_RISK_SCORE": graph_risk,
        }

    def update(
        self,
        customer_id: str,
        terminal_id: str,
        tx_datetime: Optional[datetime] = None,
        tx_amount: float = 0.0,
        is_fraud: int = 0,
    ) -> None:
        """
        Update entity graph AFTER computing features.
        """
        c_node = self._cust_node(customer_id)
        t_node = self._term_node(terminal_id)
        amount = float(tx_amount)

        # Add or update customer node
        if not self.graph.has_node(c_node):
            self.graph.add_node(c_node, entity_type="customer", raw_id=str(customer_id), tx_count=0)
        self.graph.nodes[c_node]["tx_count"] += 1

        # Add or update terminal node
        if not self.graph.has_node(t_node):
            self.graph.add_node(t_node, entity_type="terminal", raw_id=str(terminal_id), tx_count=0)
        self.graph.nodes[t_node]["tx_count"] += 1

        # Mark fraud nodes
        if is_fraud > 0:
            self.fraud_nodes.add(c_node)
            self.fraud_nodes.add(t_node)
            self.graph.nodes[c_node]["has_fraud"] = True
            self.graph.nodes[t_node]["has_fraud"] = True

        # Add or update edge
        if self.graph.has_edge(c_node, t_node):
            edge = self.graph[c_node][t_node]
            edge["weight"] += 1
            edge["total_amount"] += amount
            edge["last_tx_time"] = tx_datetime
        else:
            self.graph.add_edge(
                c_node,
                t_node,
                weight=1,
                total_amount=amount,
                last_tx_time=tx_datetime,
            )

    def get_subgraph(
        self,
        entity_id: str,
        entity_type: str = "customer",
        depth: int = 2,
        max_nodes: int = 40,
    ) -> Dict[str, Any]:
        """
        Extract an ego subgraph centered on an entity for interactive UI visualization.
        """
        center_node = (
            self._cust_node(entity_id)
            if entity_type == "customer"
            else self._term_node(entity_id)
        )

        if not self.graph.has_node(center_node):
            # Return empty or single node fallback
            return {
                "nodes": [{"id": center_node, "label": entity_id, "type": entity_type, "is_center": True}],
                "edges": [],
            }

        # BFS expansion up to specified depth
        nodes_to_include = {center_node}
        current_frontier = {center_node}

        for _ in range(depth):
            next_frontier = set()
            for node in current_frontier:
                neighbors = set(self.graph.neighbors(node))
                next_frontier.update(neighbors)
            nodes_to_include.update(next_frontier)
            current_frontier = next_frontier
            if len(nodes_to_include) >= max_nodes:
                break

        # Trim to max_nodes while keeping center
        if len(nodes_to_include) > max_nodes:
            nodes_list = [center_node] + [n for n in nodes_to_include if n != center_node][: max_nodes - 1]
            nodes_to_include = set(nodes_list)

        subgraph = self.graph.subgraph(nodes_to_include)

        nodes_data = []
        for node in subgraph.nodes():
            raw_id = self.graph.nodes[node].get("raw_id", node)
            node_type = self.graph.nodes[node].get("entity_type", "unknown")
            is_fraud = node in self.fraud_nodes
            degree = subgraph.degree(node)
            nodes_data.append(
                {
                    "id": node,
                    "label": f"{node_type.capitalize()}: {raw_id}",
                    "type": node_type,
                    "is_center": node == center_node,
                    "is_suspicious": is_fraud,
                    "degree": int(degree),
                }
            )

        edges_data = []
        for u, v, data in subgraph.edges(data=True):
            edges_data.append(
                {
                    "source": u,
                    "target": v,
                    "weight": int(data.get("weight", 1)),
                    "total_amount": float(data.get("total_amount", 0.0)),
                }
            )

        return {"nodes": nodes_data, "edges": edges_data}
