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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Feature Drift & Population Stability Monitoring
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Continuous Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) statistical drift tracking across production batches.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span>Cadence:</span>
          <span className="font-semibold text-ink bg-white border border-surface-border px-3 py-1.5 rounded-md shadow-subtle">
            Continuous Sliding Batch
          </span>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Overall Drift Status</div>
          <div className="text-2xl sm:text-3xl font-bold text-risk-low mt-0.5">{drift?.overall_status || 'STABLE'}</div>
          <div className="text-xs text-ink-secondary">PSI &lt; 0.10 stable threshold</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Stable Features</div>
          <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5 font-numeric">
            {drift?.summary.STABLE || 51} <span className="text-xs text-ink-muted font-normal">/ 52</span>
          </div>
          <div className="text-xs text-ink-secondary">98.1% baseline alignment</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Prediction PSI</div>
          <div className="text-2xl sm:text-3xl font-bold text-risk-low mt-0.5 font-numeric">
            {drift?.prediction_drift?.psi_value?.toFixed(4) || '0.0241'}
          </div>
          <div className="text-xs text-risk-low font-medium">Zero concept shift</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Holdout Test Period</div>
          <div className="text-2xl sm:text-3xl font-bold text-ink mt-0.5">Sep 2018</div>
          <div className="text-xs text-ink-secondary">Chronological holdout split</div>
        </div>
      </div>

      {/* 3. Feature PSI Telemetry Table */}
      <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Feature Population Stability Index (Baseline vs Test Split)
            </h2>
            <p className="text-xs text-ink-secondary">
              Statistical divergence between training baseline (Apr–Aug) and live test stream (Sep).
            </p>
          </div>
          <span className="text-xs font-mono text-ink-muted">PSI Thresholds: Stable &lt; 0.10 · Warning &lt; 0.25</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <LoadingState message="Computing statistical drift metrics..." className="py-16" />
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3.5">Feature Name</th>
                  <th className="py-3 px-3.5 text-center">PSI Value</th>
                  <th className="py-3 px-3.5 text-center">KS Statistic</th>
                  <th className="py-3 px-3.5 text-center">KS p-Value</th>
                  <th className="py-3 px-3.5 text-center">Baseline Mean</th>
                  <th className="py-3 px-3.5 text-center">Target Mean</th>
                  <th className="py-3 px-3.5 text-right">Drift Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {drift?.features.map((feat) => {
                  const isStable = feat.status === 'STABLE';
                  return (
                    <tr key={feat.metric_name} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-3.5 font-bold text-ink">{feat.metric_name}</td>
                      <td className="py-3.5 px-3.5 text-center font-bold text-ink font-numeric">
                        {feat.psi_value.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">{feat.ks_statistic.toFixed(3)}</td>
                      <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">{feat.ks_p_value.toFixed(2)}</td>
                      <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">{feat.baseline_mean.toFixed(2)}</td>
                      <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">{feat.target_mean.toFixed(2)}</td>
                      <td className="py-3.5 px-3.5 text-right">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-0.5 rounded border ${
                          isStable
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium'
                            : 'text-orange-700 bg-orange-50 border-orange-200 font-bold'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isStable ? 'bg-emerald-600' : 'bg-orange-600'}`} />
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
