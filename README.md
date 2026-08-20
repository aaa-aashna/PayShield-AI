# AI Defense Lab for Payment Security

Mastercard Innovation Challenge 2026 project.

## Objective

Build an adversarial AI system for payment security that continuously improves through a closed loop of attack discovery, generation, simulation, and ML-based defense.

## System Pillars

The system will eventually implement three pillars:

1. **Identify** — Research and map emerging GenAI-powered payment fraud attacks; maintain an attack taxonomy and knowledge base.
2. **Generate** — Produce realistic synthetic payment-fraud attack scenarios for simulation and adversarial testing.
3. **Defend** — Detect payment fraud and compromise using ML-based models (not manually authored fraud rules), evaluated on precision, recall, F1, ROC-AUC, and false-positive rate.

## Closed Loop

```
Identify → Generate → Attack Simulation → ML Defense → Failure Analysis → New / Harder Attacks → Generate
```

## Current Stage

This repository is in the **research and baseline scaffolding** stage. Directory structure and documentation are in place; application logic, models, and UI are not yet implemented.

## Repository Layout

| Directory     | Purpose                                      |
|---------------|----------------------------------------------|
| `research/`   | Attack landscape research and knowledge base |
| `data/`       | Raw and processed datasets                   |
| `red_team/`   | Attack taxonomy, generators, and evaluation  |
| `blue_team/`  | ML preprocessing, features, models, eval     |
| `simulator/`  | Attack simulation environment                |
| `experiments/`| Experiment configs and run artifacts         |
| `api/`        | Backend service layer                        |
| `web/`        | Frontend application                         |
| `tests/`      | Automated tests                              |
