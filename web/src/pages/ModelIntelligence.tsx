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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Model Governance
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Model intelligence & benchmarking
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Empirical evaluation across primary streaming datasets and independent external benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span>Primary architecture:</span>
            <span className="font-semibold text-ink bg-surface border border-surface-border px-2.5 py-1">
              HistGB Champion v1.0.0
            </span>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-border font-mono">
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Test PR-AUC</div>
            <div className="text-2xl sm:text-3xl font-bold text-risk-low mt-0.5">0.3526</div>
            <div className="text-[11px] text-ink-secondary">+257% vs baseline</div>
          </div>
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Test ROC-AUC</div>
            <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5">0.8516</div>
            <div className="text-[11px] text-ink-secondary">Discriminative area</div>
          </div>
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Operating threshold</div>
            <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5">0.757</div>
            <div className="text-[11px] text-ink-secondary">Optimal F1 (0.4189)</div>
          </div>
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Feature pipeline</div>
            <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5">52</div>
            <div className="text-[11px] text-ink-secondary">Leakage-safe signals</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Dataset Benchmark Table */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Primary dataset performance (PayShield stream · 1.75M transactions)
            </h2>
            <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
              Evaluated on unseen chronological holdout test split (263,124 transactions · 0.837% fraud rate).
            </p>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">70/15/15 Chronological Split</span>
        </div>

        <div className="overflow-x-auto bg-surface border border-surface-border">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
              <tr>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3 text-center">PR-AUC</th>
                <th className="py-2.5 px-3 text-center">ROC-AUC</th>
                <th className="py-2.5 px-3 text-center">Precision</th>
                <th className="py-2.5 px-3 text-center">Recall</th>
                <th className="py-2.5 px-3 text-center">F1 score</th>
                <th className="py-2.5 px-3 text-right">Training time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {comparison.map((m) => {
                const isChampion = m.model_name.includes('Champion');
                return (
                  <tr key={m.model_name} className={isChampion ? 'font-semibold text-ink bg-neutral-50/50' : 'text-ink-secondary'}>
                    <td className="py-3 px-3">
                      <span>{m.model_name}</span>
                      {isChampion && <span className="text-[10px] text-risk-low uppercase ml-2 font-bold">(Champion)</span>}
                    </td>
                    <td className={`py-3 px-3 text-center ${isChampion ? 'text-risk-low font-bold' : ''}`}>
                      {m.test_pr_auc.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-ink">{m.test_roc_auc.toFixed(4)}</td>
                    <td className="py-3 px-3 text-center">{(m.test_precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center">{(m.test_recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center font-bold text-ink">{m.test_f1.toFixed(4)}</td>
                    <td className="py-3 px-3 text-right text-ink-muted">{m.fit_time_seconds}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. External Kaggle Validation Benchmark Table */}
      {externalBenchmark && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                External validation benchmark ({externalBenchmark.external_validation_dataset.name})
              </h2>
              <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
                Evaluated on independent Kaggle European cardholder transactions (284,807 records · 0.172% fraud rate · PCA anonymized).
              </p>
            </div>
            <a
              href={externalBenchmark.external_validation_dataset.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-ink hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Kaggle Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto bg-surface border border-surface-border">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
                <tr>
                  <th className="py-2.5 px-3">Model architecture on Kaggle benchmark</th>
                  <th className="py-2.5 px-3 text-center">PR-AUC</th>
                  <th className="py-2.5 px-3 text-center">ROC-AUC</th>
                  <th className="py-2.5 px-3 text-center">Precision (opt)</th>
                  <th className="py-2.5 px-3 text-center">Recall (opt)</th>
                  <th className="py-2.5 px-3 text-center">F1 score</th>
                  <th className="py-2.5 px-3 text-right">Fit time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-[11px]">
                {externalBenchmark.external_validation_dataset.models.map((m) => {
                  const isChampion = m.model_name.includes('Champion');
                  return (
                    <tr key={m.model_name} className={isChampion ? 'font-semibold text-ink bg-neutral-50/50' : 'text-ink-secondary'}>
                      <td className="py-3 px-3">
                        <span>{m.model_name}</span>
                        {isChampion && <span className="text-[10px] text-risk-low uppercase ml-2 font-bold">(Champion)</span>}
                      </td>
                      <td className={`py-3 px-3 text-center ${isChampion ? 'text-risk-low font-bold' : ''}`}>
                        {m.test_pr_auc.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-ink">{m.test_roc_auc.toFixed(4)}</td>
                      <td className="py-3 px-3 text-center">{(m.optimal_precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-center">{(m.optimal_recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-center font-bold text-ink">{m.optimal_f1.toFixed(4)}</td>
                      <td className="py-3 px-3 text-right text-ink-muted">{m.fit_time_seconds}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Two Columns: Threshold Optimization Curve & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left: Threshold Optimizer */}
        <div className="lg:col-span-7 space-y-3 bg-surface border border-surface-border p-4">
          <div className="flex justify-between items-baseline">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                Decision threshold optimization curve
              </h2>
              <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
                Precision vs Recall operating trade-off on chronological validation split.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-ink">Optimal: 0.757</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thresholdData?.sweep_table || []} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f0f0ed" vertical={false} />
                <XAxis dataKey="threshold" stroke="#8e99a8" fontSize={10} fontStyle="JetBrains Mono" />
                <YAxis stroke="#8e99a8" domain={[0, 1]} fontSize={10} fontStyle="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e6e6e2',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <ReferenceLine x={0.757} stroke="#0f172a" strokeDasharray="2 2" strokeWidth={1.5} />
                <Line type="monotone" dataKey="precision" stroke="#16a34a" strokeWidth={1.5} dot={false} name="Precision" />
                <Line type="monotone" dataKey="recall" stroke="#d97706" strokeWidth={1.5} dot={false} name="Recall" />
                <Line type="monotone" dataKey="f1" stroke="#0f172a" strokeWidth={2} dot={false} name="F1 score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feature Contributions */}
        <div className="lg:col-span-5 space-y-3 bg-surface border border-surface-border p-4">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Top predictive feature importance
            </h2>
            <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
              Relative gain attribution across 52 streaming features.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto pr-1">
            {featureImportance.map((item) => (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-ink font-medium">{item.feature}</span>
                  <span className="font-bold text-ink">{(item.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 w-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${item.importance * 350}%` }}
                  />
                </div>
                <p className="text-[10px] text-ink-muted font-sans leading-tight">
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
