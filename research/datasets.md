# Datasets

Research notes on established payment-fraud datasets for the **AI Defense Lab for Payment Security** (Mastercard Innovation Challenge 2026). Findings below are drawn from official or peer-reviewed sources only. **No final dataset choice has been made.**

Use the schema-agnostic profiler after placing a local copy under `data/raw/`:

```bash
python -m blue_team.preprocessing.analyze_dataset --path data/raw/<file-or-directory>
```

For multi-table datasets (e.g., IEEE-CIS), profile each file separately or merge locally with `--join-on` before modeling.

---

## Overview

Three widely used resources cover different payment contexts:

| Dataset | Context | Real vs synthetic | Primary label |
|---------|---------|-------------------|---------------|
| IEEE-CIS Fraud Detection | E-commerce / online card-not-present payments (Vesta) | Real (anonymized) | `isFraud` |
| PaySim (Kaggle) | Mobile money / P2P wallet transfers | Synthetic (simulator-based) | `isFraud` |
| Fraud Detection Handbook simulator | Payment-card transactions to merchants/terminals | Synthetic (rule-based simulator) | `TX_FRAUD` |

All three support **Identify** and **Defend** research. Their suitability for **Generate** / Red Team attack simulation varies (see per-dataset limitations).

---

## 1. IEEE-CIS Fraud Detection

### Source

- Kaggle competition (Vesta Corporation): [IEEE-CIS Fraud Detection](https://www.kaggle.com/competitions/ieee-fraud-detection/data)
- IEEE DataPort mirror: [IEEE-CIS Fraud Detection](https://ieee-dataport.org/documents/ieee-cis-fraud-detection) (DOI: [10.21227/y5e7-wp63](https://doi.org/10.21227/y5e7-wp63))

### Payment context

Online e-commerce transactions. The competition host describes predicting fraud at checkout for card-not-present payments processed through Vesta’s fraud-protection stack ([Kaggle competition description](https://www.kaggle.com/competitions/ieee-fraud-detection/data); [IEEE DataPort abstract](https://ieee-dataport.org/documents/ieee-cis-fraud-detection)).

### Dataset size (officially documented)

- **Package size:** ~1.35 GB on Kaggle ([competition data page](https://www.kaggle.com/competitions/ieee-fraud-detection/data)).
- **Files:** `train_transaction.csv`, `train_identity.csv`, `test_transaction.csv`, `test_identity.csv`, `sample_submission.csv` ([IEEE DataPort](https://ieee-dataport.org/documents/ieee-cis-fraud-detection)).
- **Row/column counts:** Not stated in the IEEE DataPort abstract. Confirm on your local copy with `analyze_dataset.py`. Widely reported file metadata for the training tables: `train_transaction.csv` ≈ 590,540 rows × 394 columns; `train_identity.csv` ≈ 144,233 rows × 41 columns (Kaggle file viewer / competition artifacts).

### Available fields

Two tables joined on `TransactionID`. Not all transactions have identity rows ([Kaggle](https://www.kaggle.com/competitions/ieee-fraud-detection/data); [IEEE DataPort](https://ieee-dataport.org/documents/ieee-cis-fraud-detection)).

**Transaction table (documented feature groups):**

| Group | Fields | Type (per host docs) |
|-------|--------|----------------------|
| Keys / amount / time | `TransactionID`, `TransactionAmt`, `TransactionDT` | ID, numeric amount, timedelta offset (not calendar timestamp) |
| Product | `ProductCD` | Categorical |
| Card | `card1`–`card6` | Categorical / masked numeric |
| Address / distance | `addr1`, `addr2`, `dist1`, `dist2` | Numeric |
| Email | `P_emaildomain`, `R_emaildomain` | Categorical |
| Counts | `C1`–`C14` | Numeric |
| Timedelta features | `D1`–`D15` | Numeric (days since event) |
| Match flags | `M1`–`M9` | Categorical |
| Engineered | `V1`–`V339` | Numeric (Vesta aggregated/ranked features) |

**Identity table (documented feature groups):**

| Group | Fields | Type |
|-------|--------|------|
| Key | `TransactionID` | ID |
| Device | `DeviceType`, `DeviceInfo` | Categorical |
| Identity signals | `id_01`–`id_38` | Mixed (network/device/browser proxies; masked) |

Field names are masked; semantic dictionaries are not published ([Kaggle discussion referenced by competition host](https://www.kaggle.com/competitions/ieee-fraud-detection/discussion/101203)).

### Fraud labels

- **Target:** binary `isFraud` (1 = fraudulent online transaction) in training transaction file only ([Kaggle](https://www.kaggle.com/competitions/ieee-fraud-detection/data)).
- Test set labels are withheld for competition scoring.

### Temporal information

- `TransactionDT`: seconds elapsed from an undisclosed reference datetime — **not** a wall-clock timestamp ([Kaggle](https://www.kaggle.com/competitions/ieee-fraud-detection/data)).
- `D1`–`D15`: numeric timedelta-derived features (days since associated events).

### Entity information

- **Transaction-level key:** `TransactionID`.
- **Proxy entities:** card (`card1`–`card6`), purchaser/recipient email domains, device and network identity fields (`id_*`, `DeviceType`, `DeviceInfo`).
- No explicit customer ID; entities are anonymized/masked.

### Categorical vs numerical features

Per competition host ([Kaggle](https://www.kaggle.com/competitions/ieee-fraud-detection/data); [IEEE DataPort](https://ieee-dataport.org/documents/ieee-cis-fraud-detection)):

- **Transaction categoricals:** `ProductCD`, `card1`–`card6`, `addr1`, `addr2`, `P_emaildomain`, `R_emaildomain`, `M1`–`M9`.
- **Identity categoricals:** `DeviceType`, `DeviceInfo`, `id_12`–`id_38`.
- **Remaining columns** (including `V1`–`V339`, `C1`–`C14`, `D1`–`D15`, `dist1`, `dist2`, `TransactionAmt`, `TransactionDT`) are numeric.

### Class imbalance

Severe imbalance is documented qualitatively in the competition materials. **Exact fraud rate is not stated in the IEEE DataPort abstract** — measure on your local `train_transaction.csv` with the profiler.

### Licensing / access constraints

- Download via [Kaggle competition rules](https://www.kaggle.com/competitions/ieee-fraud-detection/rules) (account required).
- IEEE DataPort copy requires login ([IEEE DataPort](https://ieee-dataport.org/documents/ieee-cis-fraud-detection)).
- Real production data; anonymized/masked features; redistribution restricted by platform terms.

### Suitability for Mastercard challenge

**Strengths for Defend (Blue Team):**

- Realistic, high-dimensional e-commerce fraud with rich behavioral aggregates — strong benchmark for ML detection (precision/recall/F1/ROC-AUC/FPR).
- Time-ordered `TransactionDT` supports temporal validation and concept-drift experiments.

**Strengths for Identify:**

- Represents card-not-present / checkout fraud patterns relevant to global payment networks.

**Gaps for closed-loop Red Team:**

- Labels and features reflect historical fraud, not GenAI-specific attack narratives.
- Masked semantics limit attack taxonomy mapping to concrete field meanings.

### Limitations for Red Team attack simulation

- Feature meanings are opaque (`V*`, masked `id_*`) — hard to craft interpretable synthetic attacks aligned to taxonomy entries.
- Identity table covers only a subset of transactions — incomplete attack surface per row.
- Post-fraud engineered features may encode investigator knowledge, complicating adversarial scenario design.
- No generative process or simulator bundled — attacks cannot be replayed or parametrically varied without separate Red Team tooling.

---

## 2. PaySim (Kaggle synthetic mobile-money dataset)

### Source

- Kaggle dataset: [Synthetic Financial Datasets For Fraud Detection](https://www.kaggle.com/datasets/ealaxi/paysim1) (file `PS_20174392719_1491204439457_log.csv`)
- Simulator repository: [EdgarLopezPhD/PaySim](https://github.com/EdgarLopezPhD/PaySim)
- Original paper: Lopez-Rojas, Elmir, & Axelsson (2016), *PaySim: A financial mobile money simulator for fraud detection*, EMSS 2016 ([PDF](https://www.msc-les.org/proceedings/emss/2016/EMSS2016_249.pdf))

### Payment context

Synthetic **mobile money** transactions (wallet transfers, cash-in/out, merchant payments) modeled from aggregated logs of a mobile financial service in one African country ([Kaggle dataset description](https://www.kaggle.com/datasets/ealaxi/paysim1)). Agents include clients, merchants, and simulated fraudsters ([PaySim paper](https://www.msc-les.org/proceedings/emss/2016/EMSS2016_249.pdf)).

### Dataset size (officially documented)

- **Kaggle release:** scaled to **1/4** of a full simulator run; single CSV ~493 MB ([Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1)).
- **Peer-reviewed summary** of this Kaggle file: **6,362,620 transactions**, **8,213 fraudulent** (~0.13% fraud rate) over **30 days** (744 hourly steps) ([Stojanović et al., 2021, Table 5](https://doi.org/10.3390/s21051594)).
- Full simulator runs in the paper can produce ~24M records per scenario ([Kaggle “Past Research” section](https://www.kaggle.com/datasets/ealaxi/paysim1)).

### Available fields

11 columns ([Kaggle field documentation](https://www.kaggle.com/datasets/ealaxi/paysim1)):

| Column | Description |
|--------|-------------|
| `step` | Hour index (1 step = 1 hour; 744 steps total) |
| `type` | `CASH-IN`, `CASH-OUT`, `DEBIT`, `PAYMENT`, `TRANSFER` |
| `amount` | Transaction amount (undisclosed currency unit) |
| `nameOrig` | Source account ID |
| `oldbalanceOrg` | Source balance before transaction |
| `newbalanceOrig` | Source balance after transaction |
| `nameDest` | Destination account ID |
| `oldbalanceDest` | Destination balance before transaction |
| `newbalanceDest` | Destination balance after transaction |
| `isFraud` | Simulator-assigned fraud label |
| `isFlaggedFraud` | Business-rule flag for transfers > 200,000 in one transaction |

### Fraud labels

- **`isFraud`:** transactions performed by fraudulent agents simulating account takeover → transfer → cash-out ([Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1)).
- **`isFlaggedFraud`:** operational rule-based alert, **not** equivalent to ground-truth fraud.
- **Important:** Kaggle notes that detected/cancelled fraud transactions affect balance columns — **`oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest` must not be used as features** for fraud detection ([Kaggle NOTE](https://www.kaggle.com/datasets/ealaxi/paysim1)).

### Temporal information

- `step`: discrete hourly index (744 = 30 days × 24 hours) ([Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1)).

### Entity information

- Account IDs: `nameOrig`, `nameDest` (merchant accounts prefixed with `M` per Kaggle docs).
- Transaction graph structure (clients, merchants, fraudsters) exists implicitly; no separate entity tables in the CSV.

### Categorical vs numerical features

- **Categorical:** `type`, `nameOrig`, `nameDest` (high-cardinality IDs).
- **Numerical:** `step`, `amount`, balance columns, `isFraud`, `isFlaggedFraud`.

### Class imbalance

Extreme imbalance: 8,213 / 6,362,620 ≈ **0.129%** fraud ([Stojanović et al., 2021](https://doi.org/10.3390/s21051594)). Fraudulent activity is concentrated in `TRANSFER` and `CASH-OUT` types ([Kaggle description](https://www.kaggle.com/datasets/ealaxi/paysim1); [Stojanović et al., 2021](https://doi.org/10.3390/s21051594)).

### Licensing / access constraints

- Kaggle download (subject to Kaggle terms).
- Academic citation requested ([Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1); EMSS 2016 paper).
- Synthetic — no real customer PII, but not a substitute for card-network production data.

### Suitability for Mastercard challenge

**Strengths:**

- Large-scale labeled data for ML Defend benchmarking under extreme imbalance.
- Graph/account-level structure useful for network-aware features and failure analysis.
- Open simulator ([GitHub](https://github.com/EdgarLopezPhD/PaySim)) enables controlled experimentation.

**Gaps:**

- **Mobile money**, not card-network authorization streams — different fraud modalities than CNP card checkout.
- Kaggle CSV is a downscaled snapshot; full simulator parameters differ.

### Limitations for Red Team attack simulation

- Fraud scenarios are fixed simulator behaviors (account takeover / cash-out), not GenAI-generated social engineering or synthetic identity attacks.
- Balance fields are post-event/leaky if misused — limits feature realism for adversarial testing.
- Merchant (`M*`) balance semantics are incomplete ([Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1)).
- Does not model 3-D Secure, issuer authorization, or merchant category codes.

---

## 3. Fraud Detection Handbook simulated transaction dataset

### Source

- Handbook / simulator docs: [Transaction data simulator](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)
- Baseline feature docs: [Baseline feature transformation](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/BaselineFeatureTransformation.html)
- Pre-generated raw daily files: [Fraud-Detection-Handbook/simulated-data-raw](https://github.com/Fraud-Detection-Handbook/simulated-data-raw)
- Book repository: [Fraud-Detection-Handbook/fraud-detection-handbook](https://github.com/Fraud-Detection-Handbook/fraud-detection-handbook)

### Payment context

Simulated **payment-card transactions** — customer pays a merchant terminal at a timestamp with an amount ([SimulatedDataset chapter](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)). Designed to mirror practitioner issues (imbalance, drift, feature engineering) without exposing real bank data ([Foreword](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Foreword.html)).

### Dataset size (officially documented)

Baseline configuration in the handbook ([SimulatedDataset chapter](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)):

| Statistic | Value |
|-----------|-------|
| Customers | 5,000 |
| Terminals (merchants) | 10,000 |
| Simulation period | 183 days (2018-04-01 → 2018-09-30) |
| Legitimate transactions generated | 1,754,155 |
| Fraudulent transactions (after scenarios) | 14,681 (**0.84%**) |
| Columns (labeled table) | 9 (`TX_FRAUD_SCENARIO` included) |

Distribution is reproducible via published simulator code; pre-built raw files are split into **daily `.pkl` batches** on GitHub ([simulated-data-raw](https://github.com/Fraud-Detection-Handbook/simulated-data-raw)).

### Available fields

**Core transaction table** ([SimulatedDataset](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)):

| Column | Description |
|--------|-------------|
| `TRANSACTION_ID` | Unique transaction identifier |
| `TX_DATETIME` | Wall-clock timestamp |
| `CUSTOMER_ID` | Customer identifier |
| `TERMINAL_ID` | Merchant terminal identifier |
| `TX_AMOUNT` | Transaction amount |
| `TX_TIME_SECONDS` | Seconds since simulation start |
| `TX_TIME_DAYS` | Day index since simulation start |
| `TX_FRAUD` | Binary fraud label (0/1) |
| `TX_FRAUD_SCENARIO` | Scenario ID (0 = legitimate; 1–3 = fraud types) |

**Profile tables** (used by simulator, not always shipped in daily transaction pickles): customer geography/spend parameters; terminal geography ([SimulatedDataset](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)).

### Fraud labels

Three documented fraud scenarios ([SimulatedDataset §2.5](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)):

1. **Scenario 1:** amount > 220 → fraud (deliberately obvious baseline check).
2. **Scenario 2:** random terminals compromised for 28 days — all their transactions marked fraud.
3. **Scenario 3:** random customers compromised for 14 days — 1/3 of transactions multiplied ×5 and marked fraud.

Reported counts from one baseline run: scenario 1 = 978; scenario 2 = 9,099; scenario 3 = 4,604 fraudulent rows (overlap possible across scenarios).

### Temporal information

- `TX_DATETIME` (absolute timestamps).
- `TX_TIME_SECONDS`, `TX_TIME_DAYS` (relative time indices).
- Fraud scenarios are **time-localized** (14–28 day windows) → supports concept-drift experiments.

### Entity information

- Explicit `CUSTOMER_ID`, `TERMINAL_ID`, `TRANSACTION_ID`.
- Customer–terminal associations constrained by geographic radius `r` ([SimulatedDataset](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)).

### Categorical vs numerical features

- **Categorical (high cardinality):** `CUSTOMER_ID`, `TERMINAL_ID` (not ordinal).
- **Numerical:** `TX_AMOUNT`, `TX_TIME_SECONDS`, `TX_TIME_DAYS`.
- **Temporal:** `TX_DATETIME` (datetime; not directly model-ready without encoding).
- **Labels:** `TX_FRAUD`, `TX_FRAUD_SCENARIO`.

Handbook states < 1% fraud rate and mixed feature types at scale ([SimulatedDataset intro](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)).

### Class imbalance

~0.84% fraud (14,681 / 1,754,155) in the documented baseline run ([SimulatedDataset](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html)). Imbalance severity is configurable when regenerating data.

### Licensing / access constraints

- Handbook code: **GNU GPL v3.0**; prose: **CC BY-SA 4.0** ([Foreword](https://fraud-detection-handbook.github.io/fraud-detection-handbook/Foreword.html)).
- Raw simulated data hosted on GitHub for reproducibility ([simulated-data-raw](https://github.com/Fraud-Detection-Handbook/simulated-data-raw)).
- Fully synthetic — safe for open research pipelines.

### Suitability for Mastercard challenge

**Strengths:**

- Transparent generative process — best fit for **reproducible** Identify → Defend loops while we build Red Team tooling.
- Explicit entities and timestamps support graph/temporal ML and failure analysis.
- Documented fraud scenarios map cleanly to evaluation metrics and scenario IDs.

**Gaps:**

- Simplified card-present/CNP abstraction — no authorization codes, EMV, or network switches.
- Fraud scenarios are rule-based, not GenAI-powered attacks.

### Limitations for Red Team attack simulation

- Scenario catalog is fixed (amount threshold, terminal compromise, credential leak) — does not cover GenAI phishing, deepfake KYC, or synthetic merchant onboarding.
- Simulator rules are known — attacks may be easier to reverse-engineer than production adversaries.
- Scenario 1 is explicitly non-realistic (sanity-check only).
- `TX_FRAUD_SCENARIO` is **label leakage** if used as a feature during Defend training.

---

## Comparative summary

| Criterion | IEEE-CIS | PaySim (Kaggle) | FDH Simulator |
|-----------|----------|-----------------|---------------|
| Payment domain | E-commerce CNP | Mobile money wallet | Card → merchant terminal |
| Realism | Real (masked) | Synthetic from aggregates | Synthetic, rule-based |
| Scale | ~590K train txs | ~6.36M txs | ~1.75M txs (baseline) |
| Entities | Masked proxies | Account graph | Customer + terminal IDs |
| Time | Relative `TransactionDT` | Hourly `step` | Wall-clock + relative |
| Fraud rate | Severe (verify locally) | ~0.129% | ~0.84% (baseline) |
| Open simulator | No | Yes ([PaySim](https://github.com/EdgarLopezPhD/PaySim)) | Yes ([handbook code](https://github.com/Fraud-Detection-Handbook/fraud-detection-handbook)) |
| Red Team fit | Low (opaque features) | Medium (graph fraud) | High (transparent scenarios) |

---

## Dataset analysis tooling

Modular ingestion/profiling lives in `blue_team/preprocessing/`:

| Module | Role |
|--------|------|
| `loader.py` | Load CSV/TSV/PKL from a file or directory; optional merge on key |
| `profiler.py` | Schema-agnostic reports (missingness, targets, leakage heuristics) |
| `analyze_dataset.py` | CLI wrapper |

Example:

```bash
# Single file
python -m blue_team.preprocessing.analyze_dataset --path data/raw/train_transaction.csv

# Directory of daily pickles (handbook raw data)
python -m blue_team.preprocessing.analyze_dataset --path data/raw/handbook/ --output experiments/dataset_profile.json

# Multi-table merge (example)
python -m blue_team.preprocessing.analyze_dataset --path data/raw/ieee/ --join left --join-on TransactionID
```

---

## Data governance and privacy

- **IEEE-CIS:** real anonymized transactions — treat as sensitive; follow Kaggle/IEEE terms; do not commit raw files to git (`data/raw/` is gitignored).
- **PaySim / FDH:** synthetic — lower privacy risk; still document provenance and version (Kaggle file name, handbook commit/hash).
- **No datasets are downloaded automatically by this repository.**

---

## References

1. IEEE-CIS Fraud Detection — Kaggle competition data & description: https://www.kaggle.com/competitions/ieee-fraud-detection/data  
2. IEEE-CIS Fraud Detection — IEEE DataPort (DOI 10.21227/y5e7-wp63): https://ieee-dataport.org/documents/ieee-cis-fraud-detection  
3. Lopez-Rojas, E. A., Elmir, A., & Axelsson, S. (2016). *PaySim: A financial mobile money simulator for fraud detection.* EMSS 2016. https://www.msc-les.org/proceedings/emss/2016/EMSS2016_249.pdf  
4. PaySim Kaggle dataset (ealaxi/paysim1): https://www.kaggle.com/datasets/ealaxi/paysim1  
5. PaySim simulator repository: https://github.com/EdgarLopezPhD/PaySim  
6. Stojanović, B., et al. (2021). *Follow the Trail: Machine Learning for Fraud Detection in Fintech Applications.* Sensors, 21(5), 1594. https://doi.org/10.3390/s21051594  
7. Le Borgne, Y-A., et al. (2022). *Reproducible Machine Learning for Credit Card Fraud Detection — Practical Handbook.* https://fraud-detection-handbook.github.io/fraud-detection-handbook/Foreword.html  
8. FDH transaction simulator chapter: https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/SimulatedDataset.html  
9. FDH baseline feature chapter: https://fraud-detection-handbook.github.io/fraud-detection-handbook/Chapter_3_GettingStarted/BaselineFeatureTransformation.html  
10. FDH pre-generated raw data: https://github.com/Fraud-Detection-Handbook/simulated-data-raw  
