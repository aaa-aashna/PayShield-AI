# PayShield AI: Adaptive ML-Driven Payment Security & Fraud Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-black?style=for-the-badge&logo=github)](https://aaa-aashna.github.io/PayShield-AI/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

> **PayShield AI** is an end-to-end, machine-learning-driven payment security platform that replaces static, easily-evaded fraud rules with **customer behavioral profiling**, **terminal intelligence**, **bipartite graph relationship analytics**, **unsupervised anomaly isolation**, **hybrid risk fusion**, and **closed-loop adversarial Red Team attack simulations**.

---

## 🌐 Live Hosted Application

- **Live Web Console**: **[https://aaa-aashna.github.io/PayShield-AI/](https://aaa-aashna.github.io/PayShield-AI/)**
- **GitHub Repository**: [https://github.com/aaa-aashna/PayShield-AI](https://github.com/aaa-aashna/PayShield-AI)

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
    REST API (FastAPI)           EDITORIAL WEB CONSOLE (React + Vite)
    - /predict & /score          - Security Overview & Risk Timeline
    - /explain                   - Priority Investigations Triage
    - /simulate-attack           - Transaction Details & Forensics
    - /metrics & /drift          - Bipartite Entity Risk Graph
    - /risk-summary & /graph     - Attack Lab (Red Team Sim)
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
- Primary evaluation metric: **PR-AUC** (Precision-Recall Area Under Curve: **0.3526**, +257% vs baseline), Precision@K, and Recall@K.

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
  - *"Significant spending surge (+3.4x vs customer historical average)."*
  - *"High fraud incidence rate on terminal 8023."*
  - *"Elevated transaction frequency across 1-hour rolling window."*

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
- Node.js 18+ (for local frontend development)
- Windows PowerShell or Unix Terminal

### 1. Installation
```powershell
# Clone repository
git clone https://github.com/aaa-aashna/PayShield-AI.git
cd PayShield-AI-1

# Python backend setup
pip install -e .

# Frontend web setup
cd web
npm install
cd ..
```

### 2. Run Automated Test Suite
```powershell
python -m pytest tests -v
```

### 3. Launch FastAPI Backend Service
```powershell
python -m uvicorn api.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`

### 4. Launch React Frontend Console
```powershell
cd web
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 7. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status and loaded model version |
| `POST` | `/predict` | Full transaction scoring, risk fusion, and decisioning |
| `POST` | `/explain` | Granular forensic feature attribution and reasons |
| `POST` | `/simulate-attack` | Launch Red Team attack simulation and return defense trace |
| `GET` | `/transactions` | Verified transactions scored through the ML pipeline |
| `GET` | `/transactions/{id}` | Full forensic evaluation for a specific transaction |
| `GET` | `/alerts` | Active high-risk and critical alerts queue |
| `GET` | `/metrics` | Real model comparison benchmark and PR-AUC curves |
| `GET` | `/risk-summary` | Overall risk distribution and transaction volume |
| `GET` | `/drift` | Real feature and prediction PSI drift reports |
| `GET` | `/graph/subgraph` | Interactive entity relationship subgraphs |
