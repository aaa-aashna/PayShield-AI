import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';
import { api } from '../services/api';
import { ExternalBenchmarkData, ModelComparisonEntry, ThresholdAnalysisData } from '../types';

export const ModelIntelligence: React.FC = () => {
  const [comparison, setComparison] = useState<ModelComparisonEntry[]>([]);
  const [thresholdData, setThresholdData] = useState<ThresholdAnalysisData | null>(null);
  const [externalBenchmark, setExternalBenchmark] = useState<ExternalBenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getMetrics();
        setComparison(res.model_comparison);
        setThresholdData(res.threshold_analysis);
        if (res.external_benchmark) {
          setExternalBenchmark(res.external_benchmark);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featureImportance = [
    { feature: 'CUST_BEHAVIOR_DEVIATION', importance: 0.245, desc: 'Spending Z-Score deviation from expanding customer history' },
    { feature: 'CUST_AMOUNT_RATIO', importance: 0.182, desc: 'Ratio of transaction ticket to customer 30-day mean' },
    { feature: 'GRAPH_RISK_SCORE', importance: 0.145, desc: 'Bipartite network connection rarity & suspicious neighbor prior' },
    { feature: 'CUST_TX_COUNT_1H', importance: 0.128, desc: 'Rolling 1-hour transaction frequency burst velocity' },
    { feature: 'TERM_RISK_SCORE', importance: 0.104, desc: 'Empirical Bayes smoothed historical terminal fraud prior' },
    { feature: 'CUST_IS_NEW_TERMINAL', importance: 0.082, desc: 'Binary flag for unprecedented customer-terminal relationship' },
    { feature: 'TX_HOUR_SIN', importance: 0.064, desc: 'Cyclical sine-encoded hour of transaction' },
    { feature: 'CUST_UNUSUAL_HOUR_SCORE', importance: 0.050, desc: 'Departure from customer established daily spending hours' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Model Intelligence & Benchmarking
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Empirical evaluation across primary streaming datasets and independent external validation benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span>Champion architecture:</span>
          <span className="font-semibold text-ink bg-white border border-surface-border px-3 py-1.5 rounded-md shadow-subtle">
            HistGradientBoosting v1.0.0
          </span>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Primary Test PR-AUC</div>
          <div className="text-2xl sm:text-3xl font-bold text-risk-low mt-0.5 font-numeric">0.3526</div>
          <div className="text-xs text-ink-secondary">+257% over baseline (0.0986)</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Primary Test ROC-AUC</div>
          <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5 font-numeric">0.8516</div>
          <div className="text-xs text-ink-secondary">Discriminative area under curve</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Operating Threshold</div>
          <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5 font-numeric">0.757</div>
          <div className="text-xs text-ink-secondary">Optimal F1 score (0.4189)</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Leakage-Safe Features</div>
          <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5 font-numeric">52</div>
          <div className="text-xs text-ink-secondary">Behavioral, terminal, temporal, graph</div>
        </div>
      </div>

      {/* 3. Primary Dataset Benchmark Table */}
      <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Primary Dataset Performance (PayShield Stream · 1.75M Transactions)
            </h2>
            <p className="text-xs text-ink-secondary">
              Evaluated on unseen chronological holdout test split (263,124 transactions · 0.837% fraud rate).
            </p>
          </div>
          <span className="text-xs font-mono text-ink-muted">70/15/15 Chronological Split</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
              <tr>
                <th className="py-3 px-3.5">Model Architecture</th>
                <th className="py-3 px-3.5 text-center">PR-AUC</th>
                <th className="py-3 px-3.5 text-center">ROC-AUC</th>
                <th className="py-3 px-3.5 text-center">Precision</th>
                <th className="py-3 px-3.5 text-center">Recall</th>
                <th className="py-3 px-3.5 text-center">F1 Score</th>
                <th className="py-3 px-3.5 text-right">Training Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-xs">
              {comparison.map((m) => {
                const isChampion = m.model_name.includes('Champion');
                return (
                  <tr key={m.model_name} className={isChampion ? 'font-semibold text-ink bg-slate-50/70' : 'text-ink-secondary'}>
                    <td className="py-3.5 px-3.5">
                      <span>{m.model_name}</span>
                      {isChampion && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase ml-2 font-bold">(Champion)</span>}
                    </td>
                    <td className={`py-3.5 px-3.5 text-center font-numeric ${isChampion ? 'text-emerald-700 font-bold' : ''}`}>
                      {m.test_pr_auc.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-bold text-ink font-numeric">{m.test_roc_auc.toFixed(4)}</td>
                    <td className="py-3.5 px-3.5 text-center font-numeric">{(m.test_precision * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-3.5 text-center font-numeric">{(m.test_recall * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-3.5 text-center font-bold text-ink font-numeric">{m.test_f1.toFixed(4)}</td>
                    <td className="py-3.5 px-3.5 text-right text-ink-muted font-numeric">{m.fit_time_seconds}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. External Kaggle Validation Benchmark Table */}
      {externalBenchmark && (
        <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                External Validation Benchmark ({externalBenchmark.external_validation_dataset.name})
              </h2>
              <p className="text-xs text-ink-secondary">
                Evaluated on independent Kaggle European cardholder transactions (284,807 records · 0.172% fraud rate · PCA anonymized).
              </p>
            </div>
            <a
              href={externalBenchmark.external_validation_dataset.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-brand hover:underline inline-flex items-center gap-1 font-medium shrink-0"
            >
              <span>Kaggle Dataset Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3.5">Model Architecture on Kaggle Benchmark</th>
                  <th className="py-3 px-3.5 text-center">PR-AUC</th>
                  <th className="py-3 px-3.5 text-center">ROC-AUC</th>
                  <th className="py-3 px-3.5 text-center">Precision (opt)</th>
                  <th className="py-3 px-3.5 text-center">Recall (opt)</th>
                  <th className="py-3 px-3.5 text-center">F1 Score</th>
                  <th className="py-3 px-3.5 text-right">Training Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {externalBenchmark.external_validation_dataset.models.map((m) => {
                  const isChampion = m.model_name.includes('Champion');
                  return (
                    <tr key={m.model_name} className={isChampion ? 'font-semibold text-ink bg-slate-50/70' : 'text-ink-secondary'}>
                      <td className="py-3.5 px-3.5">
                        <span>{m.model_name}</span>
                        {isChampion && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase ml-2 font-bold">(Champion)</span>}
                      </td>
                      <td className={`py-3.5 px-3.5 text-center font-numeric ${isChampion ? 'text-emerald-700 font-bold' : ''}`}>
                        {m.test_pr_auc.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-bold text-ink font-numeric">{m.test_roc_auc.toFixed(4)}</td>
                      <td className="py-3.5 px-3.5 text-center font-numeric">{(m.optimal_precision * 100).toFixed(1)}%</td>
                      <td className="py-3.5 px-3.5 text-center font-numeric">{(m.optimal_recall * 100).toFixed(1)}%</td>
                      <td className="py-3.5 px-3.5 text-center font-bold text-ink font-numeric">{m.optimal_f1.toFixed(4)}</td>
                      <td className="py-3.5 px-3.5 text-right text-ink-muted font-numeric">{m.fit_time_seconds}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Two Columns: Threshold Optimization Curve & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Threshold Optimizer (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Decision Threshold Optimization Curve
              </h2>
              <p className="text-xs text-ink-secondary">
                Precision vs Recall operating trade-off on chronological validation split.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-ink bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
              Optimal Threshold: 0.757
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thresholdData?.sweep_table || []} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="threshold" stroke="#94a3b8" fontSize={11} fontStyle="JetBrains Mono" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} fontSize={11} fontStyle="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                    borderRadius: '6px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <ReferenceLine x={0.757} stroke="#0f172a" strokeDasharray="3 3" strokeWidth={1.5} />
                <Line type="monotone" dataKey="precision" stroke="#16a34a" strokeWidth={1.5} dot={false} name="Precision" />
                <Line type="monotone" dataKey="recall" stroke="#ea580c" strokeWidth={1.5} dot={false} name="Recall" />
                <Line type="monotone" dataKey="f1" stroke="#0f172a" strokeWidth={2} dot={false} name="F1 Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feature Contributions (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-3">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-sm font-semibold text-ink">
              Top Predictive Feature Importance
            </h2>
            <p className="text-xs text-ink-secondary">
              Relative gain attribution across 52 streaming features.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto pr-1">
            {featureImportance.map((item) => (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink font-medium">{item.feature}</span>
                  <span className="font-bold text-ink font-numeric">{(item.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full"
                    style={{ width: `${item.importance * 350}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink-muted font-sans leading-tight">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
