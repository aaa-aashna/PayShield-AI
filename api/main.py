"""
FastAPI Backend Service for PayShield AI.
Provides RESTful endpoints for real-time payment fraud scoring, explainability,
red-team attack simulations, model metrics, drift monitoring, and entity graphs.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    DriftResponse,
    HealthResponse,
    ModelMetadataResponse,
    RiskComponentsSchema,
    SimulateAttackRequest,
    SimulateAttackResponse,
    SubgraphResponse,
    TransactionRequest,
    TransactionResponse,
)
from blue_team.explainability.explainer import TransactionExplainer
from blue_team.features.pipeline import FeaturePipeline
from blue_team.models.anomaly import IsolationForestAnomalyDetector
from blue_team.models.model_registry import ModelBundleMetadata, ModelRegistry
from blue_team.models.supervised import BaseFraudModel
from blue_team.risk_engine.escalation import AdaptiveEscalationTracker
from blue_team.risk_engine.fusion import DecisionAction, RiskAssessment, RiskFusionEngine, RiskLevel
from simulator.environment import SimulationEnvironment

# Global runtime state
state: Dict[str, Any] = {
    "supervised_model": None,
    "anomaly_model": None,
    "pipeline": None,
    "metadata": None,
    "fusion_engine": RiskFusionEngine(),
    "escalation_tracker": AdaptiveEscalationTracker(),
    "explainer": TransactionExplainer(),
    "recent_transactions": [],
    "recent_alerts": [],
}


def get_or_load_models():
    """Load models from disk if not already in memory."""
    if state["supervised_model"] is None:
        registry = ModelRegistry()
        try:
            sup, anom, pipe, meta = registry.load_bundle("latest")
            state["supervised_model"] = sup
            state["anomaly_model"] = anom
            state["pipeline"] = pipe
            state["metadata"] = meta
        except Exception as e:
            from blue_team.models.supervised import HistGradientBoostingFraudModel
            state["pipeline"] = FeaturePipeline()
            state["supervised_model"] = HistGradientBoostingFraudModel()
            state["anomaly_model"] = IsolationForestAnomalyDetector()
            state["metadata"] = ModelBundleMetadata(model_version="v1.0.0-fallback")


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_or_load_models()
    yield


app = FastAPI(
    title="PayShield AI API",
    description="Adaptive ML-Driven Payment Security & Fraud Intelligence Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health_check():
    get_or_load_models()
    return HealthResponse(
        status="healthy",
        service="PayShield AI Payment Security Platform",
        model_loaded=state["supervised_model"] is not None,
        model_version=state["metadata"].model_version if state["metadata"] else "unknown",
    )


@app.post("/predict", response_model=TransactionResponse)
@app.post("/score", response_model=TransactionResponse)
def score_transaction(req: TransactionRequest):
    get_or_load_models()
    pipe: FeaturePipeline = state["pipeline"]
    sup: BaseFraudModel = state["supervised_model"]
    anom: IsolationForestAnomalyDetector = state["anomaly_model"]
    fusion: RiskFusionEngine = state["fusion_engine"]
    tracker: AdaptiveEscalationTracker = state["escalation_tracker"]
    explainer: TransactionExplainer = state["explainer"]

    tx_time = (
        datetime.fromisoformat(req.tx_datetime)
        if req.tx_datetime
        else datetime.now()
    )

    # 1. Feature Extraction
    features = pipe.extract_features(
        customer_id=req.customer_id,
        terminal_id=req.terminal_id,
        tx_datetime=tx_time,
        tx_amount=req.tx_amount,
    )
    feature_df = pd.DataFrame([features])

    # 2. Supervised Probability & Unsupervised Anomaly
    try:
        fraud_prob = float(sup.predict_proba(feature_df)[0])
    except Exception:
        fraud_prob = 0.05

    try:
        anomaly_score = float(anom.predict_anomaly_score(feature_df)[0])
    except Exception:
        anomaly_score = 0.10

    # 3. Component signals
    cust_dev = float(features.get("CUST_BEHAVIOR_DEVIATION", 0.0))
    term_risk = float(features.get("TERM_RISK_SCORE", 0.0))
    vel_score = min(1.0, float(features.get("CUST_TX_COUNT_1H", 0.0)) / 4.0)
    graph_risk = float(features.get("GRAPH_RISK_SCORE", 0.0))

    comp_dict = {
        "fraud_probability": fraud_prob,
        "anomaly_score": anomaly_score,
        "customer_deviation": cust_dev,
        "terminal_risk": term_risk,
        "velocity_score": vel_score,
        "graph_risk": graph_risk,
        "behavior_shift": 0.0,
    }

    # 4. Explainability Reasons
    reasons = explainer.generate_reasons(
        features=features,
        components=comp_dict,
        customer_id=req.customer_id,
        terminal_id=req.terminal_id,
        tx_amount=req.tx_amount,
    )

    # 5. Risk Fusion
    raw_assessment = fusion.evaluate(
        transaction_id=req.transaction_id,
        fraud_probability=fraud_prob,
        anomaly_score=anomaly_score,
        customer_deviation=cust_dev,
        terminal_risk=term_risk,
        velocity_score=vel_score,
        graph_risk=graph_risk,
        reasons=reasons,
        model_version=state["metadata"].model_version if state["metadata"] else "v1.0.0",
    )

    # 6. Adaptive Sequence Escalation
    final_assessment = tracker.evaluate_and_escalate(
        customer_id=req.customer_id,
        tx_datetime=tx_time,
        assessment=raw_assessment,
    )

    # 7. Update pipeline state
    is_fraud_flag = 1 if final_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL] else 0
    pipe.update_state(
        customer_id=req.customer_id,
        terminal_id=req.terminal_id,
        tx_datetime=tx_time,
        tx_amount=req.tx_amount,
        is_fraud=is_fraud_flag,
    )

    resp = TransactionResponse(
        transaction_id=final_assessment.transaction_id,
        fraud_probability=round(fraud_prob, 4),
        anomaly_score=round(anomaly_score, 4),
        risk_score=round(final_assessment.risk_score, 2),
        risk_level=final_assessment.risk_level.value,
        decision=final_assessment.decision.value,
        components=RiskComponentsSchema(**comp_dict),
        reasons=final_assessment.reasons,
        is_escalated=final_assessment.is_escalated,
        escalation_notes=final_assessment.escalation_notes,
        model_version=final_assessment.model_version,
    )

    # Store for recent activity & alerts
    tx_record = {
        **resp.model_dump(),
        "customer_id": req.customer_id,
        "terminal_id": req.terminal_id,
        "tx_amount": req.tx_amount,
        "tx_datetime": tx_time.isoformat(),
    }
    state["recent_transactions"].insert(0, tx_record)
    if len(state["recent_transactions"]) > 200:
        state["recent_transactions"].pop()

    if final_assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
        state["recent_alerts"].insert(0, tx_record)
        if len(state["recent_alerts"]) > 100:
            state["recent_alerts"].pop()

    return resp


@app.post("/explain")
def explain_transaction(req: TransactionRequest):
    """Return in-depth forensic attribution and reasons for a transaction."""
    get_or_load_models()
    pipe: FeaturePipeline = state["pipeline"]
    explainer: TransactionExplainer = state["explainer"]

    tx_time = (
        datetime.fromisoformat(req.tx_datetime)
        if req.tx_datetime
        else datetime.now()
    )
    features = pipe.extract_features(
        customer_id=req.customer_id,
        terminal_id=req.terminal_id,
        tx_datetime=tx_time,
        tx_amount=req.tx_amount,
    )
    attributions = explainer.compute_feature_attributions(features)
    return {
        "transaction_id": req.transaction_id,
        "customer_id": req.customer_id,
        "terminal_id": req.terminal_id,
        "tx_amount": req.tx_amount,
        "attributions": attributions,
        "raw_features": features,
    }


@app.post("/simulate-attack", response_model=SimulateAttackResponse)
def simulate_attack(req: SimulateAttackRequest):
    """Run an on-demand Red Team attack simulation through Blue Team defenses."""
    get_or_load_models()
    sim_env = SimulationEnvironment(
        feature_pipeline=state["pipeline"],
        supervised_model=state["supervised_model"],
        anomaly_model=state["anomaly_model"],
        fusion_engine=state["fusion_engine"],
        escalation_tracker=state["escalation_tracker"],
        explainer=state["explainer"],
        model_version=state["metadata"].model_version if state["metadata"] else "v1.0.0",
    )
    result = sim_env.run_scenario(
        attack_type=req.attack_type,
        customer_id=req.customer_id,
        terminal_id=req.terminal_id,
        intensity=req.intensity,
        num_transactions=req.num_transactions,
    )
    return SimulateAttackResponse(**result.to_dict())


@app.get("/transactions/{transaction_id}")
def get_transaction(transaction_id: str):
    for tx in state["recent_transactions"]:
        if tx["transaction_id"] == transaction_id:
            return tx
    raise HTTPException(status_code=404, detail="Transaction not found in active memory buffer.")


@app.get("/alerts")
def get_alerts(limit: int = 50):
    return state["recent_alerts"][:limit]


@app.get("/metrics")
def get_metrics():
    """Return real benchmark metrics and comparison artifacts."""
    artifacts_dir = Path("experiments/artifacts")
    comparison_file = artifacts_dir / "model_comparison.json"
    threshold_file = artifacts_dir / "threshold_analysis.json"
    robustness_file = artifacts_dir / "attack_robustness.json"

    comparison = json.loads(comparison_file.read_text()) if comparison_file.exists() else []
    threshold = json.loads(threshold_file.read_text()) if threshold_file.exists() else {}
    robustness = json.loads(robustness_file.read_text()) if robustness_file.exists() else []

    return {
        "model_comparison": comparison,
        "threshold_analysis": threshold,
        "attack_robustness": robustness,
    }


@app.get("/risk-summary")
def get_risk_summary():
    recent = state["recent_transactions"]
    total = len(recent)
    if total == 0:
        return {
            "total_processed": 0,
            "low_risk": 0,
            "medium_risk": 0,
            "high_risk": 0,
            "critical_risk": 0,
            "blocked_count": 0,
            "under_review_count": 0,
            "recent_feed": [],
        }

    counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    blocked = 0
    review = 0

    for tx in recent:
        lvl = tx.get("risk_level", "LOW")
        counts[lvl] = counts.get(lvl, 0) + 1
        if tx.get("decision") == "BLOCK":
            blocked += 1
        elif tx.get("decision") in ["REVIEW", "CHALLENGE"]:
            review += 1

    return {
        "total_processed": total,
        "low_risk": counts["LOW"],
        "medium_risk": counts["MEDIUM"],
        "high_risk": counts["HIGH"],
        "critical_risk": counts["CRITICAL"],
        "blocked_count": blocked,
        "under_review_count": review,
        "recent_feed": recent[:25],
    }


@app.get("/model", response_model=ModelMetadataResponse)
def get_model_metadata():
    get_or_load_models()
    meta: ModelBundleMetadata = state["metadata"]
    return ModelMetadataResponse(
        model_version=meta.model_version,
        model_name=meta.model_name,
        feature_version=meta.feature_version,
        optimal_threshold=meta.optimal_threshold,
        training_period=meta.training_period,
        test_period=meta.test_period,
        metrics=meta.metrics,
        feature_names=meta.feature_names,
    )


@app.get("/drift", response_model=DriftResponse)
def get_drift_report():
    drift_file = Path("experiments/artifacts/drift_analysis.json")
    if drift_file.exists():
        data = json.loads(drift_file.read_text())
        return DriftResponse(**data)
    raise HTTPException(status_code=404, detail="Drift analysis artifact not yet generated.")


@app.get("/graph/subgraph", response_model=SubgraphResponse)
def get_entity_subgraph(
    entity_id: str = Query(...),
    entity_type: str = Query("customer", enum=["customer", "terminal"]),
    depth: int = Query(2, ge=1, le=3),
):
    get_or_load_models()
    pipe: FeaturePipeline = state["pipeline"]
    subgraph = pipe.graph_engine.get_subgraph(
        entity_id=entity_id,
        entity_type=entity_type,
        depth=depth,
    )
    return SubgraphResponse(**subgraph)
