"""
Unit tests for bipartite graph intelligence and subgraphs.
"""

from datetime import datetime
import pytest

from blue_team.graph.graph_engine import TransactionGraphEngine


def test_graph_engine_nodes_edges_and_subgraphs():
    engine = TransactionGraphEngine()
    cid = "C_TEST"
    tid = "T_TEST"
    now = datetime(2026, 1, 1, 12, 0, 0)

    # Initial query on empty graph
    feats1 = engine.compute_features(cid, tid, now, 150.0)
    assert feats1["GRAPH_NEW_RELATIONSHIP"] == 1.0
    assert feats1["GRAPH_CUST_DEGREE"] == 0.0

    # Add transaction
    engine.update(cid, tid, now, 150.0, is_fraud=0)

    # Second query should reflect existing edge
    feats2 = engine.compute_features(cid, tid, now, 200.0)
    assert feats2["GRAPH_NEW_RELATIONSHIP"] == 0.0
    assert feats2["GRAPH_CUST_DEGREE"] == 1.0
    assert feats2["GRAPH_TERM_DEGREE"] == 1.0

    # Test ego subgraph extraction
    subgraph = engine.get_subgraph(cid, entity_type="customer")
    assert "nodes" in subgraph
    assert "edges" in subgraph
    assert len(subgraph["nodes"]) >= 2
