"""
Pydantic v2 schemas for the PayShield AI FastAPI service.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class TransactionRequest(BaseModel):
    transaction_id: str = Field(..., json_schema_extra={"example": "TX_890123"})
    customer_id: str = Field(..., json_schema_extra={"example": "C_1042"})
    terminal_id: str = Field(..., json_schema_extra={"example": "T_5081"})
    tx_amount: float = Field(..., ge=0.0, json_schema_extra={"example": 450.0})
    tx_datetime: Optional[str] = Field(None, json_schema_extra={"example": "2026-08-24T13:45:00"})


class RiskComponentsSchema(BaseModel):
    fraud_probability: float
    anomaly_score: float
    customer_deviation: float
    terminal_risk: float
    velocity_score: float
    graph_risk: float
    behavior_shift: float = 0.0


class TransactionResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    anomaly_score: float
    risk_score: float
    risk_level: str
    decision: str
    components: RiskComponentsSchema
    reasons: List[str]
    is_escalated: bool = False
    escalation_notes: Optional[str] = None
    model_version: str


class SimulateAttackRequest(BaseModel):
    attack_type: str = Field(
        "Transaction Burst",
        description="One of: Transaction Burst, Amount Escalation, Terminal Hopping, Behavioral Shift, Coordinated Attack, Slow and Low",
        json_schema_extra={"example": "Transaction Burst"},
    )
    intensity: float = Field(0.8, ge=0.1, le=1.0, json_schema_extra={"example": 0.8})
    customer_id: str = Field("C_1042", json_schema_extra={"example": "C_1042"})
    terminal_id: str = Field("T_5081", json_schema_extra={"example": "T_5081"})
    num_transactions: int = Field(5, ge=1, le=20, json_schema_extra={"example": 5})


class SimulateStepLogSchema(BaseModel):
    step_number: int
    transaction_id: str
    tx_datetime: str
    customer_id: str
    terminal_id: str
    tx_amount: float
    attack_type: str
    fraud_probability: float
    anomaly_score: float
    risk_score: float
    risk_level: str
    decision: str
    is_escalated: bool
    reasons: List[str]


class SimulateAttackResponse(BaseModel):
    attack_type: str
    intensity: float
    total_transactions: int
    detected: bool
    blocked: bool
    detection_step: Optional[int]
    max_risk_score: float
    average_risk_score: float
    alerts_count: int
    step_logs: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    model_version: str


class ModelMetadataResponse(BaseModel):
    model_version: str
    model_name: str
    feature_version: str
    optimal_threshold: float
    training_period: Tuple[str, str]
    test_period: Tuple[str, str]
    metrics: Dict[str, Any]
    feature_names: List[str]


class DriftResponse(BaseModel):
    overall_status: str
    summary: Dict[str, int]
    prediction_drift: Dict[str, Any]
    features: List[Dict[str, Any]]


class SubgraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
