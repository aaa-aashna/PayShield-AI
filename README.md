# PayShield AI: Adaptive ML-Driven Payment Security & Fraud Intelligence Platform

> **PayShield AI** is an end-to-end, machine-learning-driven payment security platform that replaces static, easily-evaded fraud rules with **customer behavioral profiling**, **terminal intelligence**, **bipartite graph relationship analytics**, **unsupervised anomaly isolation**, **hybrid risk fusion**, and **closed-loop adversarial Red Team attack simulations**.

---

## 1. Problem: Why Traditional Fraud Rules Fail

Traditional payment security architectures rely heavily on hardcoded heuristic rules (e.g., `amount > $5,000` or `velocity > 3 tx/min`). In modern fraud landscapes:
1. **Adaptive Attackers**: Fraudsters intentionally perform transactions just below thresholds (e.g., $4,950 or slow-and-low micro-transactions).
2. **Context Blindness**: Fixed amount rules flag high-net-worth customers making routine purchases while missing compromised accounts with small but atypical spends.
3. **Isolated Decisioning**: Traditional rules evaluate each transaction in isolation, failing to detect coordinated bot attacks, terminal hopping across merchants, or compounding risk over a session.
4. **Zero Zero-Day / Novel Threat Defense**: Rule-based engines can only detect historical patterns they were explicitly written for.

**PayShield AI solves this** by evaluating not just *"Does this transaction look like past fraud?"*, but:
- *"How abnormal is this transaction for THIS specific customer?"*
- *"Is the terminal behaving anomalously?"*
- *"Is the customer-terminal relationship unprecedented or suspicious?"*
- *"Is the risk dynamically compounding across consecutive transactions?"*

---

## 2. System Architecture

```
                                 INCOMING TRANSACTION
                                          │
        ┌───────────────────┬─────────────┴───────┬────────────────────┐
        ▼                   ▼                     ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────┐  ┌───────────────┐
│ Customer      │   │ Terminal      │   │ Temporal /        │  │ Graph-Based   │
│ Behavioral    │   │ Intelligence  │   │ Sequence          │  │ Relationship  │
│ Profile       │   │ Profile       │   │ Context           │  │ Engine        │
└───────┬───────┘   └───────┬───────┘   └─────────┬─────────┘  └───────┬───────┘
        │                   │                     │                    │
        └───────────────────┼─────────────────────┴────────────────────┘
                            ▼
               LEAKAGE-SAFE FEATURE PIPELINE
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      SUPERVISED ML ENGINE      ANOMALY DETECTION
   (HistGradientBoosting / LR)  (Isolation Forest)
               │                         │
               └────────────┬────────────┘
                            ▼
                   HYBRID RISK FUSION
                            │
              + Customer Behavior Deviation
              + Terminal Risk Score
              + Velocity Score
              + Graph Risk Score
              + Adaptive Sequence Escalation
                            │
                     RISK SCORE (0-100)
               [LOW | MEDIUM | HIGH | CRITICAL]
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      EXPLAINABILITY ENGINE       DECISION ENGINE
   (Feature attribution / SHAP) (APPROVE | CHALLENGE | BLOCK)
               │                         │
               └────────────┬────────────┘
                            ▼
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
    REST API (FastAPI)           COMMAND CENTER UI (Streamlit)
    - /predict & /score          - Overview & Live Alerts
    - /explain                   - Transaction Forensics
    - /simulate-attack           - Risk Graph Explorer
    - /metrics & /drift          - Attack Lab (Red vs Blue)
    - /risk-summary & /graph     - Model Intelligence & Drift
```

---

## 3. Core Intelligence Modules

### A. Customer Behavioral Profiling (`blue_team.features.customer_behavior`)
- **Expanding & Rolling Baselines**: Leakage-safe customer mean amount, median, variance, and standard deviation calculated strictly using transactions prior to the current timestamp.
- **Z-Score Departure & Amount Ratios**: Quantifies exact standard deviations ($\sigma$) from normal spend.
- **Multi-Horizon Velocity**: Rolling transaction counts and aggregate spend across 5m, 30m, 1h, 24h, and 7d windows.
- **Temporal Habits**: Customer-specific active hour distributions and off-hours anomaly scoring.

### B. Terminal Intelligence (`blue_team.features.terminal_intelligence`)
- **Volume & Velocity Profiling**: Historical average ticket sizes, transaction frequency bursts, and volume surges.
- **Customer Diversity & Rarity**: Ratio of distinct customers to transaction count (entropy measure).
- **Smoothed Historical Risk**: Empirical Bayes-smoothed prior fraud rates preventing cold-start volatility.

### C. Graph Relationship Intelligence (`blue_team.graph.graph_engine`)
- **Bipartite Entity Graph**: NetworkX-powered Customer-to-Terminal bipartite graph.
- **Topological Signals**: Degree centrality, connection rarity, and brand new relationship flags.
- **Neighborhood Risk Propagation**: Evaluates 1-hop and 2-hop entity neighborhoods for connections to historically compromised entities.

### D. Unsupervised Anomaly Isolation (`blue_team.models.anomaly`)
- **Isolation Forest Outlier Engine**: Trained exclusively on normal behavioral dimensions to output normalized $[0.0, 1.0]$ anomaly scores completely independent of supervised fraud labels.
- Detects novel zero-day fraud attacks that differ from historical fraud scenarios.

### E. Supervised Gradient Boosting (`blue_team.models.supervised`)
- **Champion HistGradientBoosting Classifier**: Fast histogram-based gradient boosting optimized for imbalanced fraud data with balanced class weighting and calibrated decision probabilities.
- Primary evaluation metric: **PR-AUC** (Precision-Recall Area Under Curve), Precision@K, and Recall@K.

### F. Hybrid Risk Fusion & Adaptive Escalation (`blue_team.risk_engine`)
- **Deterministic Fusion Formula**:
  $$\text{Risk Score} = 100 \times \Big( 0.35 \cdot p_{\text{fraud}} + 0.20 \cdot s_{\text{anomaly}} + 0.15 \cdot d_{\text{cust}} + 0.10 \cdot r_{\text{term}} + 0.10 \cdot v_{\text{vel}} + 0.10 \cdot g_{\text{graph}} \Big)$$
- **Discrete Decision Levels**:
  - `LOW` (0–30): **APPROVE**
  - `MEDIUM` (30–60): **REVIEW**
  - `HIGH` (60–80): **CHALLENGE** (Step-Up MFA)
  - `CRITICAL` (80–100): **BLOCK**
- **Adaptive Sequence Escalation**: Contextual tracker monitoring customer sessions in real time; escalates risk multiplicatively ($1.0\times \to 1.25\times \to 1.5\times \to 1.75\times$) as suspicious actions compound.

### G. Forensic Explainability (`blue_team.explainability`)
- Converts complex mathematical features into human-readable causal explanations:
  - *"BEHAVIORAL DEVIATION: Amount ($1,450.00) is 4.8x customer baseline of $302.10 (+3.8σ)."*
  - *"HIGH VELOCITY: 6 transactions initiated within 11 minutes."*
  - *"NEW RELATIONSHIP: Customer C_1042 has never transacted at Terminal T_5081 before."*
  - *"GRAPH SIGNAL: Terminal is connected to historically flagged entities (Neighborhood Risk: 8.2%)."*

---

## 4. Adversarial Red Team Attack Simulator (`red_team` & `simulator`)

PayShield AI includes an adversarial Red Team framework executing 6 realistic attack vectors:

| Attack Vector | Strategy | Primary Defense Trigger |
| :--- | :--- | :--- |
| **1. Transaction Burst** | Rapid series of 5–10 transactions within seconds/minutes | Multi-window velocity spikes & escalation tracker |
| **2. Amount Escalation** | Exponentially multiplying transaction amounts ($50 \to $200 \to $800 \to $3,200) | Customer amount ratio + Z-score deviation |
| **3. Terminal Hopping** | Rapid transactions across distinct terminals | Graph new relationship indicator + terminal diversity |
| **4. Behavioral Shift** | Sudden off-hours surge (e.g. 3 AM) with extreme ticket size | Cyclical temporal features + customer hour departure |
| **5. Coordinated Attack** | Botnet swarm targeting a single terminal in unison | Terminal volume burst + customer entropy drop |
| **6. Slow-and-Low Stealth** | Micro-transactions spaced over 12–24 hour intervals | Isolation Forest anomaly score + graph rarity |

---

## 5. Dataset Characteristics & Chronological Splits

Based on the real dataset of **1,754,155 payment transactions** (~0.84% fraud rate, 4,990 customers, 10,000 terminals over 6 months):
- **Training Set (70%)**: 1,227,908 transactions (`2018-04-01` to `2018-08-07`)
- **Validation Set (15%)**: 263,123 transactions (`2018-08-07` to `2018-09-03`)
- **Test Set (15%)**: 263,124 transactions (`2018-09-03` to `2018-09-30`)

---

## 6. Installation & Quickstart

### Prerequisites
- Python 3.10+
- Windows PowerShell or Unix Terminal

### 1. Installation
```powershell
# Clone and install dependencies
git clone https://github.com/aaa-aashna/PayShield-AI.git
cd PayShield-AI-1
pip install -e .
```

### 2. Run Deterministic End-to-End Demo
```powershell
python -m simulator.demo
```

### 3. Run Benchmark Experiments & Generate Artifacts
```powershell
python -m experiments.run_experiments
```

### 4. Run Automated Test Suite
```powershell
pytest tests -v
```

### 5. Launch FastAPI Backend Service
```powershell
python -m uvicorn api.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 6. Launch Payment Security Command Center UI
```powershell
python -m streamlit run web/app.py --server.port 8501
```
- Command Center: `http://localhost:8501`

---

## 7. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status and loaded model version |
| `POST` | `/predict` | Full transaction scoring, risk fusion, and decisioning |
| `POST` | `/explain` | Granular forensic feature attribution and reasons |
| `POST` | `/simulate-attack` | Launch Red Team attack simulation and return defense trace |
| `GET` | `/alerts` | Active high-risk and critical alerts |
| `GET` | `/metrics` | Real model comparison benchmark and PR-AUC curves |
| `GET` | `/risk-summary` | Overall risk distribution and transaction volume |
| `GET` | `/drift` | Real feature and prediction PSI drift reports |
| `GET` | `/graph/subgraph` | Interactive entity relationship subgraphs |

---

## 8. Limitations & Future Work

- **Graph Scale**: Current implementation uses NetworkX for in-memory bipartite graphs. Future iterations could integrate Neo4j or Graph Neural Networks (GNNs) for multi-million node graph embeddings.
- **Card-Present Biometrics**: Integrating device telemetry (typing cadence, IP ASN risk) alongside payment transaction logs.
- **Automated Feedback Loop**: Automated retraining triggers when PSI drift exceeds critical thresholds.
