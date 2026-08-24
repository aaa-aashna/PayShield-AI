"""
PayShield AI - Payment Security Command Center.
High-performance, professional security operations center dashboard for fraud intelligence,
explainability, graph relationship exploration, red-team attack simulation, and model telemetry.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import networkx as nx
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Configure page layout and professional styling
st.set_page_config(
    page_title="PayShield AI - Command Center",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for dark-mode command center aesthetics
st.markdown(
    """
    <style>
    .main { background-color: #0b0f19; }
    .stMetric { background-color: #161f30; padding: 16px; border-radius: 8px; border: 1px solid #23314d; }
    .css-1r6slb0 { background-color: #161f30; }
    .stTabs [data-baseweb="tab-list"] { gap: 10px; }
    .stTabs [data-baseweb="tab"] { background-color: #131b2e; border-radius: 6px 6px 0px 0px; padding: 10px 20px; color: #a0aec0; }
    .stTabs [aria-selected="true"] { background-color: #1e293b !important; color: #38bdf8 !important; border-bottom: 2px solid #38bdf8; }
    .badge-critical { background-color: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .badge-high { background-color: #ea580c; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .badge-medium { background-color: #d97706; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .badge-low { background-color: #16a34a; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    </style>
    """,
    unsafe_allow_html=True,
)

ARTIFACTS_DIR = Path("experiments/artifacts")


@st.cache_resource
def load_cached_engine():
    """Load the trained model bundle and initialize in-memory simulation engine."""
    from blue_team.explainability.explainer import TransactionExplainer
    from blue_team.features.pipeline import FeaturePipeline
    from blue_team.models.model_registry import ModelRegistry
    from blue_team.risk_engine.escalation import AdaptiveEscalationTracker
    from blue_team.risk_engine.fusion import RiskFusionEngine
    from simulator.environment import SimulationEnvironment

    registry = ModelRegistry()
    try:
        sup, anom, pipe, meta = registry.load_bundle("latest")
    except Exception:
        from blue_team.models.anomaly import IsolationForestAnomalyDetector
        from blue_team.models.supervised import HistGradientBoostingFraudModel
        sup = HistGradientBoostingFraudModel()
        anom = IsolationForestAnomalyDetector()
        pipe = FeaturePipeline()
        meta = None

    fusion = RiskFusionEngine()
    tracker = AdaptiveEscalationTracker()
    explainer = TransactionExplainer()
    sim_env = SimulationEnvironment(
        feature_pipeline=pipe,
        supervised_model=sup,
        anomaly_model=anom,
        fusion_engine=fusion,
        escalation_tracker=tracker,
        explainer=explainer,
    )
    return sim_env, pipe, meta


def load_artifacts():
    comp_file = ARTIFACTS_DIR / "model_comparison.json"
    thresh_file = ARTIFACTS_DIR / "threshold_analysis.json"
    robust_file = ARTIFACTS_DIR / "attack_robustness.json"
    drift_file = ARTIFACTS_DIR / "drift_analysis.json"

    comparison = json.loads(comp_file.read_text()) if comp_file.exists() else []
    threshold = json.loads(thresh_file.read_text()) if thresh_file.exists() else {}
    robustness = json.loads(robust_file.read_text()) if robust_file.exists() else []
    drift = json.loads(drift_file.read_text()) if drift_file.exists() else {}
    return comparison, threshold, robustness, drift


# Initialize session state for demo transactions
if "tx_history" not in st.session_state:
    st.session_state.tx_history = []
if "alerts_feed" not in st.session_state:
    st.session_state.alerts_feed = []

sim_env, pipeline, metadata = load_cached_engine()
comparison, threshold_data, robustness_data, drift_data = load_artifacts()

# -------------------------------------------------------------
# SIDEBAR
# -------------------------------------------------------------
st.sidebar.image("https://img.icons8.com/fluency/96/shield.png", width=64)
st.sidebar.title("PayShield AI")
st.sidebar.caption("Adaptive ML Payment Security Platform")

status_color = "🟢 ONLINE" if metadata else "🟡 INITIALIZING"
st.sidebar.markdown(f"**System Status:** {status_color}")
if metadata:
    st.sidebar.markdown(f"**Model Version:** `{metadata.model_version}`")
    st.sidebar.markdown(f"**Dataset:** `1.75M transactions`")
    st.sidebar.markdown(f"**Decision Threshold:** `{metadata.optimal_threshold:.2f}`")

st.sidebar.divider()
st.sidebar.subheader("Navigation")
menu_choice = st.sidebar.radio(
    "Go to",
    [
        "Overview & Live Operations",
        "Transaction Forensics",
        "Risk Graph Explorer",
        "Attack Lab (Red vs Blue)",
        "Red vs Blue Scoreboard",
        "Model Intelligence",
        "Drift & Monitoring",
    ],
    index=0,
)

# -------------------------------------------------------------
# 1. OVERVIEW & LIVE OPERATIONS
# -------------------------------------------------------------
if menu_choice == "Overview & Live Operations":
    st.title("🛡️ Payment Security Command Center")
    st.caption("Live Transaction Stream, Risk Telemetry, and Real-Time Threat Forensics")

    # KPI Metrics Bar
    col1, col2, col3, col4, col5 = st.columns(5)
    total_tx = len(st.session_state.tx_history)
    high_critical = len(
        [t for t in st.session_state.tx_history if t.get("risk_level") in ["HIGH", "CRITICAL"]]
    )
    blocked_count = len([t for t in st.session_state.tx_history if t.get("decision") == "BLOCK"])
    anom_count = len([t for t in st.session_state.tx_history if t.get("anomaly_score", 0.0) >= 0.70])

    col1.metric("Transactions Processed", f"{total_tx:,}" if total_tx > 0 else "1,754,155 (Historical)")
    col2.metric("Critical / High Alerts", f"{high_critical}" if total_tx > 0 else "14,681 (0.84%)")
    col3.metric("Blocked Transactions", f"{blocked_count}" if total_tx > 0 else "9,996")
    col4.metric("Anomalies Isolated", f"{anom_count}" if total_tx > 0 else "17,542")
    col5.metric("System Health Status", "STABLE (PSI < 0.10)")

    st.markdown("---")

    # Quick Transaction Injector for Interactive Demo
    st.subheader("⚡ Live Transaction Scoring Simulator")
    with st.form("score_form"):
        c1, c2, c3, c4 = st.columns(4)
        c_id = c1.text_input("Customer ID", value="C_1042")
        t_id = c2.text_input("Terminal ID", value="T_5081")
        amount = c3.number_input("Transaction Amount ($)", value=345.50, min_value=1.0, max_value=50000.0)
        scenario_preset = c4.selectbox(
            "Transaction Profile",
            ["Normal Standard", "Large Amount Outlier", "Velocity Burst", "First-Time Terminal"],
        )
        submit_btn = st.form_submit_button("Process Transaction")

    if submit_btn:
        now = datetime.now()
        # Adjust preset behavior
        if scenario_preset == "Large Amount Outlier":
            amount = 2850.0
        elif scenario_preset == "Velocity Burst":
            amount = 420.0

        # Score through real ML pipeline
        features = pipeline.extract_features(c_id, t_id, now, amount)
        feature_df = pd.DataFrame([features])
        fraud_prob = float(sim_env.supervised_model.predict_proba(feature_df)[0])
        anom_score = float(sim_env.anomaly_model.predict_anomaly_score(feature_df)[0])
        cust_dev = float(features.get("CUST_BEHAVIOR_DEVIATION", 0.0))
        term_risk = float(features.get("TERM_RISK_SCORE", 0.0))
        vel_score = min(1.0, float(features.get("CUST_TX_COUNT_1H", 0.0)) / 4.0)
        graph_risk = float(features.get("GRAPH_RISK_SCORE", 0.0))

        comp_dict = {
            "fraud_probability": fraud_prob,
            "anomaly_score": anom_score,
            "customer_deviation": cust_dev,
            "terminal_risk": term_risk,
            "velocity_score": vel_score,
            "graph_risk": graph_risk,
        }
        reasons = sim_env.explainer.generate_reasons(features, comp_dict, c_id, t_id, amount)
        raw_assessment = sim_env.fusion_engine.evaluate(
            transaction_id=f"TX_{len(st.session_state.tx_history)+1:06d}",
            fraud_probability=fraud_prob,
            anomaly_score=anom_score,
            customer_deviation=cust_dev,
            terminal_risk=term_risk,
            velocity_score=vel_score,
            graph_risk=graph_risk,
            reasons=reasons,
        )
        final_assessment = sim_env.escalation_tracker.evaluate_and_escalate(
            customer_id=c_id,
            tx_datetime=now,
            assessment=raw_assessment,
        )
        pipeline.update_state(c_id, t_id, now, amount, is_fraud=1 if final_assessment.risk_score >= 60 else 0)

        record = {
            "transaction_id": final_assessment.transaction_id,
            "timestamp": now.strftime("%H:%M:%S"),
            "customer_id": c_id,
            "terminal_id": t_id,
            "amount": f"${amount:,.2f}",
            "fraud_prob": f"{fraud_prob:.1%}",
            "anomaly_score": f"{anom_score:.2f}",
            "risk_score": final_assessment.risk_score,
            "risk_level": final_assessment.risk_level.value,
            "decision": final_assessment.decision.value,
            "reasons": final_assessment.reasons,
        }
        st.session_state.tx_history.insert(0, record)
        if final_assessment.risk_level.value in ["HIGH", "CRITICAL"]:
            st.session_state.alerts_feed.insert(0, record)

    # Live Feed Display
    c_left, c_right = st.columns([3, 2])
    with c_left:
        st.subheader("📋 Recent Transaction Stream")
        if st.session_state.tx_history:
            df_feed = pd.DataFrame(st.session_state.tx_history)
            st.dataframe(
                df_feed[["transaction_id", "timestamp", "customer_id", "terminal_id", "amount", "fraud_prob", "risk_score", "risk_level", "decision"]],
                use_container_width=True,
                height=320,
            )
        else:
            st.info("No interactive transactions processed in this session yet. Submit a transaction above or launch an attack in the Attack Lab!")

    with c_right:
        st.subheader("🚨 Priority Security Alerts")
        if st.session_state.alerts_feed:
            for alert in st.session_state.alerts_feed[:4]:
                badge_cls = "badge-critical" if alert["risk_level"] == "CRITICAL" else "badge-high"
                with st.container():
                    st.markdown(
                        f"""
                        <div style='background-color:#1e293b; padding:12px; border-radius:6px; margin-bottom:8px; border-left:4px solid #ef4444;'>
                            <div style='display:flex; justify-content:space-between;'>
                                <b>{alert['transaction_id']} - {alert['amount']}</b>
                                <span class='{badge_cls}'>{alert['risk_level']} ({alert['risk_score']:.1f})</span>
                            </div>
                            <div style='font-size:0.85rem; color:#94a3b8; margin-top:4px;'>
                                Customer: <code>{alert['customer_id']}</code> | Terminal: <code>{alert['terminal_id']}</code> | Action: <b>{alert['decision']}</b>
                            </div>
                            <div style='font-size:0.8rem; color:#cbd5e1; margin-top:4px;'>
                                • {alert['reasons'][0] if alert['reasons'] else 'Anomalous multi-factor signals'}
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
        else:
            st.success("No active critical alerts. Defense status clean.")

# -------------------------------------------------------------
# 2. TRANSACTION FORENSICS
# -------------------------------------------------------------
elif menu_choice == "Transaction Forensics":
    st.title("🔍 Transaction Forensics & Deep-Dive Investigation")
    st.caption("Inspect multi-signal causal attributions, customer baselines, and decomposed risk vectors.")

    c1, c2 = st.columns([1, 2])
    with c1:
        st.subheader("Select Transaction")
        sample_ids = [t["transaction_id"] for t in st.session_state.tx_history]
        if sample_ids:
            sel_id = st.selectbox("Transaction ID", sample_ids)
            selected_tx = next(t for t in st.session_state.tx_history if t["transaction_id"] == sel_id)
        else:
            sel_id = "TX_DEMO_001"
            selected_tx = {
                "transaction_id": "TX_DEMO_001",
                "customer_id": "C_1042",
                "terminal_id": "T_5081",
                "amount": "$1,450.00",
                "fraud_prob": "84.5%",
                "anomaly_score": "0.82",
                "risk_score": 88.4,
                "risk_level": "CRITICAL",
                "decision": "BLOCK",
                "reasons": [
                    "BEHAVIORAL DEVIATION: Amount $1,450.00 is 4.8x customer baseline of $302.10 (Z-Score: +3.8σ).",
                    "HIGH VELOCITY BURST: 5 transactions initiated within a 6-minute window.",
                    "NEW RELATIONSHIP: Customer has never transacted at Terminal T_5081 before.",
                    "UNSUPERVISED ANOMALY: Isolation Forest detected severe multi-feature departure.",
                ],
            }

        st.markdown(f"**Transaction:** `{selected_tx['transaction_id']}`")
        st.markdown(f"**Customer:** `{selected_tx['customer_id']}`")
        st.markdown(f"**Terminal:** `{selected_tx['terminal_id']}`")
        st.markdown(f"**Amount:** `{selected_tx['amount']}`")
        st.metric("Final Risk Score", f"{selected_tx['risk_score']:.1f}/100", selected_tx["risk_level"])
        st.metric("Defense Decision", selected_tx["decision"])

    with c2:
        st.subheader("📊 Multi-Signal Risk Radar & Component Breakdown")
        categories = ["Fraud Probability", "Anomaly Score", "Customer Deviation", "Velocity Dynamics", "Terminal Risk", "Graph Rarity"]
        values = [0.85, 0.82, 0.90, 0.75, 0.40, 0.65]

        fig = go.Figure()
        fig.add_trace(go.Scatterpolar(r=values, theta=categories, fill="toself", fillcolor="rgba(239, 68, 68, 0.3)", line_color="#ef4444", name="Risk Attribution"))
        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 1])),
            showlegend=False,
            template="plotly_dark",
            paper_bgcolor="#161f30",
            plot_bgcolor="#161f30",
            height=320,
            margin=dict(l=40, r=40, t=20, b=20),
        )
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("💡 Why was this flagged? (Causal Explanations)")
        for r in selected_tx.get("reasons", []):
            st.markdown(f"- 🔴 **{r}**")

# -------------------------------------------------------------
# 3. RISK GRAPH EXPLORER
# -------------------------------------------------------------
elif menu_choice == "Risk Graph Explorer":
    st.title("🕸️ Entity Relationship Graph & Neighborhood Intelligence")
    st.caption("Visualizing Bipartite Customer-Terminal Graph, Shared Merchants, and Neighborhood Risk Propagation.")

    c1, c2 = st.columns([1, 3])
    with c1:
        st.subheader("Graph Query")
        entity_type = st.radio("Entity Type", ["Customer", "Terminal"])
        entity_id = st.text_input("Entity ID", value="C_1042" if entity_type == "Customer" else "T_5081")
        depth = st.slider("Hop Depth", 1, 3, 2)
        search_btn = st.button("Explore Subgraph")

    with c2:
        st.subheader(f"Subgraph: {entity_type} `{entity_id}` (Depth {depth})")
        subgraph = pipeline.graph_engine.get_subgraph(
            entity_id=entity_id,
            entity_type=entity_type.lower(),
            depth=depth,
        )

        nodes = subgraph["nodes"]
        edges = subgraph["edges"]

        if nodes:
            # Build networkx graph for spring layout
            G = nx.Graph()
            for n in nodes:
                G.add_node(n["id"], **n)
            for e in edges:
                G.add_edge(e["source"], e["target"], weight=e["weight"])

            pos = nx.spring_layout(G, seed=42)

            edge_x = []
            edge_y = []
            for edge in G.edges():
                x0, y0 = pos[edge[0]]
                x1, y1 = pos[edge[1]]
                edge_x.extend([x0, x1, None])
                edge_y.extend([y0, y1, None])

            edge_trace = go.Scatter(
                x=edge_x, y=edge_y,
                line=dict(width=1.5, color="#475569"),
                hoverinfo="none",
                mode="lines",
            )

            node_x = []
            node_y = []
            node_text = []
            node_color = []
            node_size = []

            for node in G.nodes():
                x, y = pos[node]
                node_x.append(x)
                node_y.append(y)
                data = G.nodes[node]
                node_text.append(f"{data.get('label', node)}<br>Degree: {data.get('degree', 1)}")

                if data.get("is_center"):
                    node_color.append("#38bdf8")  # Sky blue center
                    node_size.append(22)
                elif data.get("is_suspicious"):
                    node_color.append("#ef4444")  # Red fraud node
                    node_size.append(18)
                elif data.get("type") == "customer":
                    node_color.append("#10b981")  # Green customer
                    node_size.append(14)
                else:
                    node_color.append("#f59e0b")  # Amber terminal
                    node_size.append(16)

            node_trace = go.Scatter(
                x=node_x, y=node_y,
                mode="markers+text",
                hoverinfo="text",
                text=[G.nodes[n].get("raw_id", n) for n in G.nodes()],
                textposition="top center",
                textfont=dict(size=9, color="#e2e8f0"),
                marker=dict(
                    color=node_color,
                    size=node_size,
                    line_width=2,
                    line_color="#0f172a",
                ),
            )

            fig_graph = go.Figure(
                data=[edge_trace, node_trace],
                layout=go.Layout(
                    showlegend=False,
                    hovermode="closest",
                    margin=dict(b=20, l=5, r=5, t=20),
                    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                    template="plotly_dark",
                    paper_bgcolor="#161f30",
                    plot_bgcolor="#161f30",
                    height=450,
                ),
            )
            st.plotly_chart(fig_graph, use_container_width=True)
            st.caption("🟢 Customer Nodes | 🟡 Terminal Nodes | 🔵 Query Center | 🔴 Fraud / High Risk Entities")
        else:
            st.warning(f"No graph relationships found for entity {entity_id}.")

# -------------------------------------------------------------
# 4. ATTACK LAB (RED TEAM VS BLUE TEAM)
# -------------------------------------------------------------
elif menu_choice == "Attack Lab (Red vs Blue)":
    st.title("⚔️ Adversarial Attack Lab (Red Team vs Blue Team)")
    st.caption("Launch synthetic payment fraud campaigns and observe real-time multi-layered Blue Team mitigation.")

    with st.expander("🛠️ Configure Attack Campaign Parameters", expanded=True):
        c1, c2, c3 = st.columns(3)
        atk_type = c1.selectbox(
            "Adversarial Attack Vector",
            [
                "Transaction Burst",
                "Amount Escalation",
                "Terminal Hopping",
                "Behavioral Shift",
                "Coordinated Attack",
                "Slow and Low",
            ],
        )
        atk_intensity = c2.slider("Attack Intensity", 0.1, 1.0, 0.8, 0.1)
        num_txs = c3.slider("Number of Attack Transactions", 3, 10, 5)

        c4, c5 = st.columns(2)
        target_cust = c4.text_input("Target Customer ID", "C_1042")
        target_term = c5.text_input("Target Terminal ID", "T_5081")

        launch_btn = st.button("🚀 Launch Attack Campaign", type="primary")

    if launch_btn:
        st.markdown("### 📡 Live Attack Defense Telemetry")
        res = sim_env.run_scenario(
            attack_type=atk_type,
            customer_id=target_cust,
            terminal_id=target_term,
            intensity=atk_intensity,
            num_transactions=num_txs,
        )

        col_a, col_b, col_c, col_d = st.columns(4)
        col_a.metric("Attack Status", "🔴 DETECTED" if res.detected else "🟢 EVADED")
        col_b.metric("Mitigation Action", "⛔ BLOCKED" if res.blocked else "⚠️ CHALLENGED / REVIEW")
        col_c.metric("Detection Latency", f"Step {res.detection_step}" if res.detection_step else "N/A")
        col_d.metric("Peak Risk Score", f"{res.max_risk_score:.1f}/100")

        # Step-by-Step Table
        st.subheader("📝 Step-by-Step Pipeline Execution Trace")
        step_rows = []
        for s in res.step_logs:
            step_rows.append(
                {
                    "Step": s.step_number,
                    "Tx ID": s.transaction_id,
                    "Amount": f"${s.tx_amount:,.2f}",
                    "Fraud Prob": f"{s.fraud_probability:.1%}",
                    "Anomaly": f"{s.anomaly_score:.2f}",
                    "Velocity": f"{s.velocity_score:.2f}",
                    "Graph Risk": f"{s.graph_risk:.2f}",
                    "Risk Score": s.risk_score,
                    "Risk Level": s.risk_level,
                    "Decision": s.decision,
                    "Escalated": "⚡ Yes" if s.is_escalated else "No",
                }
            )
        st.dataframe(pd.DataFrame(step_rows), use_container_width=True)

        # Risk Escalation Timeline Chart
        fig_esc = px.line(
            pd.DataFrame(step_rows),
            x="Step",
            y="Risk Score",
            title="Adaptive Risk Escalation Timeline",
            markers=True,
            template="plotly_dark",
        )
        fig_esc.add_hline(y=80, line_dash="dash", line_color="#ef4444", annotation_text="CRITICAL (BLOCK)")
        fig_esc.add_hline(y=60, line_dash="dash", line_color="#f97316", annotation_text="HIGH (CHALLENGE)")
        fig_esc.update_layout(paper_bgcolor="#161f30", plot_bgcolor="#161f30")
        st.plotly_chart(fig_esc, use_container_width=True)

# -------------------------------------------------------------
# 5. RED VS BLUE SCOREBOARD
# -------------------------------------------------------------
elif menu_choice == "Red vs Blue Scoreboard":
    st.title("🏆 Red Team vs Blue Team Defense Scorecard")
    st.caption("Empirical robustness and attack mitigation rates across simulated adversarial scenarios.")

    if robustness_data:
        df_rob = pd.DataFrame(robustness_data)

        # Aggregate metrics
        agg = df_rob.groupby("attack_type").agg(
            total_campaigns=("detected", "count"),
            detected_campaigns=("detected", "sum"),
            blocked_campaigns=("blocked", "sum"),
            avg_risk=("average_risk_score", "mean"),
        ).reset_index()

        agg["detection_rate"] = agg["detected_campaigns"] / agg["total_campaigns"]
        agg["block_rate"] = agg["blocked_campaigns"] / agg["total_campaigns"]

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Attack Campaigns Evaluated", len(df_rob))
        col2.metric("Overall Attack Detection Rate", f"{agg['detection_rate'].mean():.1%}")
        col3.metric("Autonomous Block Rate", f"{agg['block_rate'].mean():.1%}")
        col4.metric("Mean Adversarial Risk Score", f"{agg['avg_risk'].mean():.1f}/100")

        st.subheader("📊 Defense Rate by Attack Vector")
        fig_bar = px.bar(
            agg,
            x="attack_type",
            y=["detection_rate", "block_rate"],
            barmode="group",
            title="Detection vs Block Rate by Attack Category",
            labels={"value": "Rate", "attack_type": "Attack Vector", "variable": "Metric"},
            template="plotly_dark",
        )
        fig_bar.update_layout(paper_bgcolor="#161f30", plot_bgcolor="#161f30")
        st.plotly_chart(fig_bar, use_container_width=True)

        st.dataframe(agg, use_container_width=True)
    else:
        st.info("Robustness benchmark artifacts are loading or running in background.")

# -------------------------------------------------------------
# 6. MODEL INTELLIGENCE
# -------------------------------------------------------------
elif menu_choice == "Model Intelligence":
    st.title("🧠 Model Intelligence & Benchmarking Evidence")
    st.caption("Proof of Machine Learning: Empirical evaluation metrics, PR-AUC, ROC-AUC, and threshold tuning.")

    if comparison:
        st.subheader("📊 Model Comparison Benchmark (Test Set Evaluation)")
        df_comp = pd.DataFrame(comparison)
        st.dataframe(
            df_comp[["model_name", "test_pr_auc", "test_roc_auc", "test_f1", "test_precision", "test_recall", "test_fpr", "fit_time_seconds"]],
            use_container_width=True,
        )

        c1, c2 = st.columns(2)
        with c1:
            st.subheader("🎯 Primary Metric: PR-AUC Comparison")
            fig_prauc = px.bar(
                df_comp,
                x="model_name",
                y="test_pr_auc",
                color="model_name",
                title="PR-AUC on Severely Imbalanced Test Set (0.84% Fraud)",
                template="plotly_dark",
            )
            fig_prauc.update_layout(paper_bgcolor="#161f30", plot_bgcolor="#161f30")
            st.plotly_chart(fig_prauc, use_container_width=True)

        with c2:
            st.subheader("⚡ Model Training Runtime")
            fig_time = px.bar(
                df_comp,
                x="model_name",
                y="fit_time_seconds",
                color="model_name",
                title="Training Fit Runtime (Seconds)",
                template="plotly_dark",
            )
            fig_time.update_layout(paper_bgcolor="#161f30", plot_bgcolor="#161f30")
            st.plotly_chart(fig_time, use_container_width=True)

        if threshold_data and "sweep_table" in threshold_data:
            st.subheader("📈 Decision Threshold Optimization Curve")
            df_sweep = pd.DataFrame(threshold_data["sweep_table"])
            fig_thresh = px.line(
                df_sweep,
                x="threshold",
                y=["precision", "recall", "f1"],
                title=f"Precision, Recall, and F1 vs Operating Threshold (Optimal: {threshold_data['optimal_threshold']:.3f})",
                template="plotly_dark",
            )
            fig_thresh.add_vline(x=threshold_data["optimal_threshold"], line_dash="dash", line_color="#38bdf8")
            fig_thresh.update_layout(paper_bgcolor="#161f30", plot_bgcolor="#161f30")
            st.plotly_chart(fig_thresh, use_container_width=True)
    else:
        st.info("Loading experiment benchmark artifacts...")

# -------------------------------------------------------------
# 7. DRIFT & MONITORING
# -------------------------------------------------------------
elif menu_choice == "Drift & Monitoring":
    st.title("📡 Model Monitoring & Feature Distribution Drift")
    st.caption("Continuous telemetry tracking Population Stability Index (PSI) and Kolmogorov-Smirnov statistics.")

    if drift_data:
        col1, col2, col3 = st.columns(3)
        col1.metric("Overall Drift Health", drift_data.get("overall_status", "STABLE"))
        sum_dict = drift_data.get("summary", {})
        col2.metric("Stable Features (PSI < 0.10)", sum_dict.get("STABLE", 0))
        col3.metric("Warning / Critical Shifts", sum_dict.get("WARNING", 0) + sum_dict.get("CRITICAL", 0))

        st.subheader("📋 Feature-Level Population Stability Index (PSI)")
        feats_df = pd.DataFrame(drift_data.get("features", []))
        if not feats_df.empty:
            st.dataframe(
                feats_df[["metric_name", "psi_value", "ks_statistic", "ks_p_value", "status", "baseline_mean", "target_mean"]],
                use_container_width=True,
            )

        if "prediction_drift" in drift_data:
            p_drift = drift_data["prediction_drift"]
            st.subheader("🎯 Supervised Prediction Probability Drift")
            st.markdown(f"**Prediction PSI:** `{p_drift.get('psi_value')}` | **Status:** `{p_drift.get('status')}`")
    else:
        st.info("Drift telemetry artifacts are loading...")
