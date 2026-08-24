"""
Unit tests for FastAPI endpoints using TestClient.
"""

from fastapi.testclient import TestClient
import pytest

from api.main import app

client = TestClient(app)


def test_api_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PayShield AI Payment Security Platform"


def test_api_predict_and_score():
    payload = {
        "transaction_id": "TX_TEST_999",
        "customer_id": "C_1042",
        "terminal_id": "T_5081",
        "tx_amount": 1250.0,
        "tx_datetime": "2026-08-24T12:00:00",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "risk_level" in data
    assert "decision" in data
    assert "reasons" in data
    assert "components" in data
    assert 0.0 <= data["risk_score"] <= 100.0


def test_api_explain_endpoint():
    payload = {
        "transaction_id": "TX_TEST_888",
        "customer_id": "C_1042",
        "terminal_id": "T_5081",
        "tx_amount": 500.0,
    }
    response = client.post("/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "attributions" in data
    assert "raw_features" in data


def test_api_simulate_attack_endpoint():
    payload = {
        "attack_type": "Transaction Burst",
        "intensity": 0.8,
        "customer_id": "C_1042",
        "terminal_id": "T_5081",
        "num_transactions": 3,
    }
    response = client.post("/simulate-attack", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["attack_type"] == "Transaction Burst"
    assert data["total_transactions"] == 3
    assert len(data["step_logs"]) == 3


def test_api_graph_subgraph_endpoint():
    response = client.get("/graph/subgraph?entity_id=C_1042&entity_type=customer&depth=2")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
