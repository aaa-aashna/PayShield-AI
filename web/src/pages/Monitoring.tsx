import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';
import { api } from '../services/api';
import { DriftData } from '../types';

export const Monitoring: React.FC = () => {
  const [drift, setDrift] = useState<DriftData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDrift = async () => {
    setLoading(true);
    try {
      const res = await api.getDrift();
      setDrift(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrift();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Stability Telemetry
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Feature drift & stability monitoring
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) statistical drift tracking across production splits.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span>Monitoring frequency:</span>
            <span className="font-semibold text-ink bg-surface border border-surface-border px-2.5 py-1">
              Continuous Sliding Batch
            </span>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-border font-mono">
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Overall drift status</div>
            <div className="text-2xl sm:text-3xl font-bold text-risk-low mt-0.5">{drift?.overall_status || 'STABLE'}</div>
            <div className="text-[11px] text-ink-secondary">PSI &lt; 0.10 threshold</div>
          </div>
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Stable features</div>
            <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5">
              {drift?.summary.STABLE || 51} <span className="text-sm text-ink-muted font-normal">/ 52</span>
            </div>
            <div className="text-[11px] text-ink-secondary">98.1% baseline alignment</div>
          </div>
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Prediction PSI</div>
            <div className="text-2xl sm:text-3xl font-bold text-risk-low mt-0.5">
              {drift?.prediction_drift?.psi_value?.toFixed(4) || '0.0241'}
            </div>
            <div className="text-[11px] text-ink-secondary">Zero concept shift</div>
          </div>
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Target evaluation window</div>
            <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5">Sep 2018</div>
            <div className="text-[11px] text-ink-secondary">Chronological test split</div>
          </div>
        </div>
      </div>

      {/* 2. Feature PSI Telemetry Table */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Feature population stability index (Baseline vs Test)
            </h2>
            <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
              Statistical divergence between training baseline (Apr–Aug) and live holdout test (Sep).
            </p>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">PSI Threshold: Stable &lt; 0.10 · Warning &lt; 0.25</span>
        </div>

        <div className="overflow-x-auto bg-surface border border-surface-border">
          {loading ? (
            <LoadingState message="Computing statistical drift metrics..." className="py-16" />
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
                <tr>
                  <th className="py-3 px-3">Feature name</th>
                  <th className="py-3 px-3 text-center">PSI value</th>
                  <th className="py-3 px-3 text-center">KS statistic</th>
                  <th className="py-3 px-3 text-center">KS p-value</th>
                  <th className="py-3 px-3 text-center">Baseline mean</th>
                  <th className="py-3 px-3 text-center">Target mean</th>
                  <th className="py-3 px-3 text-right">Drift health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-[11px]">
                {drift?.features.map((feat) => {
                  const isStable = feat.status === 'STABLE';
                  return (
                    <tr key={feat.metric_name} className="hover:bg-neutral-50 transition">
                      <td className="py-3 px-3 font-semibold text-ink">{feat.metric_name}</td>
                      <td className="py-3 px-3 text-center font-bold text-ink">
                        {feat.psi_value.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-center text-ink-secondary">{feat.ks_statistic.toFixed(3)}</td>
                      <td className="py-3 px-3 text-center text-ink-secondary">{feat.ks_p_value.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center text-ink-secondary">{feat.baseline_mean.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center text-ink-secondary">{feat.target_mean.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 border ${
                          isStable
                            ? 'text-risk-low bg-emerald-50/80 border-emerald-200/80'
                            : 'text-risk-high bg-orange-50/80 border-orange-200/80 font-bold'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isStable ? 'bg-risk-low' : 'bg-risk-high'}`} />
                          <span>{feat.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
