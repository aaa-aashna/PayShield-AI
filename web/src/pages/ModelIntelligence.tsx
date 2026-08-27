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
    { feature: 'CUST_BEHAVIOR_DEVIATION', importance: 0.245 },
    { feature: 'CUST_AMOUNT_RATIO', importance: 0.182 },
    { feature: 'GRAPH_RISK_SCORE', importance: 0.145 },
    { feature: 'CUST_TX_COUNT_1H', importance: 0.128 },
    { feature: 'TERM_RISK_SCORE', importance: 0.104 },
    { feature: 'CUST_IS_NEW_TERMINAL', importance: 0.082 },
    { feature: 'TX_HOUR_SIN', importance: 0.064 },
    { feature: 'CUST_UNUSUAL_HOUR_SCORE', importance: 0.050 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Intelligence
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Model intelligence
          </h1>
          <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
            Empirical evaluation results across primary streaming datasets and independent external benchmarks.
          </p>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-6 border-t border-surface-border font-mono">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Test PR-AUC</div>
            <div className="text-3xl font-bold text-risk-low">0.3526</div>
            <div className="text-[11px] text-ink-secondary">+257% vs baseline</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Test ROC-AUC</div>
            <div className="text-3xl font-bold text-ink">0.8516</div>
            <div className="text-[11px] text-ink-secondary">Discriminative area</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Operating threshold</div>
            <div className="text-3xl font-bold text-ink">0.757</div>
            <div className="text-[11px] text-ink-secondary">Optimal F1 (0.4189)</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Feature pipeline</div>
            <div className="text-3xl font-bold text-ink">52</div>
            <div className="text-[11px] text-ink-secondary">Leakage-safe features</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Dataset Benchmark Table */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-baseline">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Primary dataset comparison (PayShield stream · 1.75M transactions)
          </h2>
          <span className="text-[11px] font-mono text-ink-muted">0.84% fraud rate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Architecture</th>
                <th className="py-2.5 px-3 text-center">PR-AUC</th>
                <th className="py-2.5 px-3 text-center">ROC-AUC</th>
                <th className="py-2.5 px-3 text-center">Precision</th>
                <th className="py-2.5 px-3 text-center">Recall</th>
                <th className="py-2.5 px-3 text-center">F1 score</th>
                <th className="py-2.5 px-3 text-right">Fit time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {comparison.map((m) => {
                const isChampion = m.model_name.includes('Champion');
                return (
                  <tr key={m.model_name} className={isChampion ? 'font-semibold text-ink' : 'text-ink-secondary'}>
                    <td className="py-3 px-3">
                      <span>{m.model_name}</span>
                      {isChampion && <span className="text-[10px] text-risk-low uppercase ml-2">(Champion)</span>}
                    </td>
                    <td className={`py-3 px-3 text-center ${isChampion ? 'text-risk-low font-bold' : ''}`}>
                      {m.test_pr_auc.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-center">{m.test_roc_auc.toFixed(4)}</td>
                    <td className="py-3 px-3 text-center">{(m.test_precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center">{(m.test_recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center">{m.test_f1.toFixed(4)}</td>
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
        <div className="space-y-3 pt-4 border-t border-surface-border">
          <div className="flex justify-between items-baseline">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                External validation benchmark ({externalBenchmark.external_validation_dataset.name})
              </h2>
              <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
                Evaluated on independent Kaggle European cardholder transactions (284K records · 0.172% fraud rate · PCA anonymized).
              </p>
            </div>
            <a
              href={externalBenchmark.external_validation_dataset.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-ink-muted hover:text-ink underline"
            >
              Kaggle Source ↗
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Model on Kaggle benchmark</th>
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
                    <tr key={m.model_name} className={isChampion ? 'font-semibold text-ink' : 'text-ink-secondary'}>
                      <td className="py-3 px-3">
                        <span>{m.model_name}</span>
                        {isChampion && <span className="text-[10px] text-risk-low uppercase ml-2">(Champion)</span>}
                      </td>
                      <td className={`py-3 px-3 text-center ${isChampion ? 'text-risk-low font-bold' : ''}`}>
                        {m.test_pr_auc.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-center">{m.test_roc_auc.toFixed(4)}</td>
                      <td className="py-3 px-3 text-center">{(m.optimal_precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-center">{(m.optimal_recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-center">{m.optimal_f1.toFixed(4)}</td>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-surface-border">
        {/* Left: Threshold Optimizer */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex justify-between items-baseline">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Threshold optimization curve
            </h2>
            <span className="text-[11px] font-mono text-ink-muted">Optimal: 0.757</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thresholdData?.sweep_table || []} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e2" vertical={false} />
                <XAxis dataKey="threshold" stroke="#8e99a8" fontSize={10} fontStyle="JetBrains Mono" />
                <YAxis stroke="#8e99a8" domain={[0, 1]} fontSize={10} fontStyle="JetBrains Mono" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6e6e2', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                <ReferenceLine x={0.757} stroke="#0f172a" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="precision" stroke="#16a34a" strokeWidth={1.5} dot={false} name="Precision" />
                <Line type="monotone" dataKey="recall" stroke="#d97706" strokeWidth={1.5} dot={false} name="Recall" />
                <Line type="monotone" dataKey="f1" stroke="#0f172a" strokeWidth={2} dot={false} name="F1 score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Feature Contributions */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Feature importance
          </h2>

          <div className="space-y-2 font-mono text-xs max-h-56 overflow-y-auto">
            {featureImportance.map((item) => (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-ink">{item.feature}</span>
                  <span className="font-bold text-ink">{(item.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="h-0.5 w-full bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${item.importance * 350}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
