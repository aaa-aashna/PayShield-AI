# PayShield AI: Adaptive ML-Driven Payment Security & Fraud Intelligence Platform


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

## 5. Datasets & External Validation

PayShield AI employs a rigorous multi-dataset validation methodology, utilizing a primary streaming dataset for feature extraction and model development, alongside an independent external Kaggle benchmark for cross-distribution generalization evaluation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATASET METHODOLOGY                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ PRIMARY DATASET                      │ EXTERNAL BENCHMARK DATASET           │
│ (Model Development & Training)       │ (Independent External Validation)    │
│                                      │                                      │
│ • Fraud Detection Handbook (FDH)     │ • Kaggle Credit Card Fraud Detection │
│ • 1,754,155 payment transactions     │ • 284,807 European cardholder txs    │
│ • 0.837% fraud rate over 183 days    │ • 0.172% fraud rate (492 cases)      │
│ • Full Customer & Terminal IDs       │ • 28 PCA dimensions (V1–V28) + Time  │
│ • 52 streaming engineered features   │ • Independent 70/30 chronological    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### A. Primary Dataset (Development & Training)
- **Source**: Fraud Detection Handbook (FDH) Transaction Stream
- **Volume**: 1,754,155 transactions (Train: 1,227,908 [70%], Val: 263,123 [15%], Test: 263,124 [15%])
- **Entities**: 5,000 customers, 10,000 terminals, continuous timestamps across 6 months (`2018-04-01` to `2018-09-30`).
- **Features**: 52 leakage-safe behavioral, terminal, temporal, and graph signals.

### B. External Kaggle Benchmark Dataset (Independent Validation)
- **Dataset Name**: **Credit Card Fraud Detection (European Cardholders)**
- **Kaggle Dataset Slug**: [`mlg-ulb/creditcardfraud`](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- **Source URL**: [https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- **Curation**: Machine Learning Group — Université Libre de Bruxelles (ULB) & Worldline.
- **Why this dataset**: Gold-standard external benchmark representing 284,807 real-world European cardholder e-commerce transactions with severe class imbalance (0.172% fraud).
- **How to Obtain**:
  ```bash
  # Option 1: Using Kaggle CLI (requires ~/.kaggle/kaggle.json)
  kaggle datasets download -d mlg-ulb/creditcardfraud -p data/raw/ --unzip

  # Option 2: Direct browser download
  # Download creditcard.csv from https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
  # Place into data/raw/creditcard.csv
  ```
  *(Note: When running in offline or CI/CD environments without the raw CSV, PayShield includes a calibrated synthetic benchmark loader so tests and evaluations run with zero dependencies).*

### C. Multi-Dataset Benchmark Comparison

| Dataset | Split / Samples | Model Architecture | PR-AUC | ROC-AUC | Precision | Recall | F1 Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PayShield Primary** | Test (263K txs, 0.84% fraud) | Logistic Regression (Baseline) | 0.0986 | 0.8486 | 18.9% | 38.0% | 0.2526 |
| **PayShield Primary** | Test (263K txs, 0.84% fraud) | **HistGradientBoosting (Champion)** | **0.3526** | **0.8516** | **21.7%** | **57.6%** | **0.3150** |
| **Kaggle External** | Test (85K txs, 0.172% fraud) | Logistic Regression (Baseline) | 0.2568 | 0.9387 | 8.4% (opt) | 61.9% | 0.1477 |
| **Kaggle External** | Test (85K txs, 0.172% fraud) | **HistGradientBoosting (Champion)** | **0.3236** | **0.9292** | **100.0% (opt)** | **23.8%** | **0.3846** |

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

### 3. Run External Kaggle Benchmark Suite
```powershell
python -m experiments.kaggle_benchmark
```

### 4. Run Primary Experiment Suite
```powershell
python -m experiments.run_experiments
```

### 5. Launch FastAPI Backend Service
```powershell
python -m uvicorn api.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`

### 6. Launch React Frontend Console
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
