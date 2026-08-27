export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DecisionAction = 'APPROVE' | 'REVIEW' | 'CHALLENGE' | 'BLOCK';
export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE POSITIVE';

export interface RiskComponents {
  fraud_probability: number;
  anomaly_score: number;
  customer_deviation: number;
  terminal_risk: number;
  velocity_score: number;
  graph_risk: number;
  behavior_shift?: number;
}

export interface TransactionRecord {
  transaction_id: string;
  customer_id: string;
  terminal_id: string;
  tx_amount: number;
  tx_datetime: string;
  fraud_probability: number;
  anomaly_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  decision: DecisionAction;
  components: RiskComponents;
  reasons: string[];
  is_escalated?: boolean;
  escalation_notes?: string | null;
  model_version?: string;
  actual_fraud_label?: number;
}

export interface AlertRecord {
  id: string;
  transaction_id: string;
  customer_id: string;
  terminal_id: string;
  amount: number;
  timestamp: string;
  severity: RiskLevel;
  type: string;
  risk_score: number;
  decision: DecisionAction;
  status: AlertStatus;
  primary_reason: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'customer' | 'terminal' | 'transaction';
  is_center?: boolean;
  is_suspicious?: boolean;
  degree?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  total_amount?: number;
}

export interface SubgraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AttackStepLog {
  step_number: number;
  transaction_id: string;
  tx_datetime: string;
  customer_id: string;
  terminal_id: string;
  tx_amount: number;
  attack_type: string;
  fraud_probability: number;
  anomaly_score: number;
  customer_deviation?: number;
  terminal_risk?: number;
  velocity_score?: number;
  graph_risk?: number;
  risk_score: number;
  risk_level: RiskLevel;
  decision: DecisionAction;
  is_escalated: boolean;
  escalation_notes?: string | null;
  reasons: string[];
}

export interface AttackSimulationResult {
  attack_type: string;
  intensity: number;
  total_transactions: number;
  detected: boolean;
  blocked: boolean;
  detection_step: number | null;
  max_risk_score: number;
  average_risk_score: number;
  alerts_count: number;
  step_logs: AttackStepLog[];
}

export interface ModelComparisonEntry {
  model_name: string;
  fit_time_seconds: number;
  val_pr_auc: number;
  val_roc_auc: number;
  val_f1: number;
  val_precision: number;
  val_recall: number;
  test_pr_auc: number;
  test_roc_auc: number;
  test_f1: number;
  test_precision: number;
  test_recall: number;
  test_fpr: number;
  test_metrics: Record<string, any>;
}

export interface ExternalBenchmarkModelEntry {
  model_name: string;
  fit_time_seconds: number;
  test_pr_auc: number;
  test_roc_auc: number;
  test_f1: number;
  test_precision: number;
  test_recall: number;
  test_fpr: number;
  optimal_threshold: number;
  optimal_f1: number;
  optimal_precision: number;
  optimal_recall: number;
  confusion_matrix_default?: Record<string, number>;
  confusion_matrix_optimal?: Record<string, number>;
  top_k?: Record<string, number>;
}

export interface ExternalBenchmarkData {
  benchmark_date: string;
  primary_internal_dataset: {
    name: string;
    context: string;
    total_samples: number;
    fraud_rate_pct: number;
    feature_count: number;
    models: ModelComparisonEntry[];
  };
  external_validation_dataset: {
    name: string;
    slug: string;
    source_url: string;
    context: string;
    total_samples: number;
    fraud_rate_pct: number;
    feature_count: number;
    models: ExternalBenchmarkModelEntry[];
    unsupervised_anomaly?: {
      model: string;
      roc_auc: number;
      pr_auc: number;
    };
  };
}

export interface ThresholdSweepRow {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  fp: number;
  tp: number;
}

export interface ThresholdAnalysisData {
  optimal_threshold: number;
  best_val_metrics: Record<string, any>;
  test_optimal_metrics: Record<string, any>;
  sweep_table: ThresholdSweepRow[];
}

export interface FeatureDriftRow {
  metric_name: string;
  psi_value: number;
  ks_statistic: number;
  ks_p_value: number;
  status: 'STABLE' | 'WARNING' | 'CRITICAL';
  baseline_mean: number;
  target_mean: number;
}

export interface DriftData {
  overall_status: 'STABLE' | 'WARNING' | 'CRITICAL';
  summary: {
    STABLE: number;
    WARNING: number;
    CRITICAL: number;
  };
  prediction_drift?: {
    psi_value: number;
    status: string;
    ks_statistic: number;
    baseline_mean: number;
    target_mean: number;
  };
  features: FeatureDriftRow[];
}
