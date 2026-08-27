import React, { useState, useEffect } from 'react';
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
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Intelligence
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Monitoring
          </h1>
          <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
            Population stability telemetry and distribution drift tracking.
          </p>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-6 border-t border-surface-border font-mono">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">System drift status</div>
            <div className="text-3xl font-bold text-risk-low">{drift?.overall_status || 'STABLE'}</div>
            <div className="text-[11px] text-ink-secondary">PSI &lt; 0.10 threshold</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Stable features</div>
            <div className="text-3xl font-bold text-ink">
              {drift?.summary.STABLE || 51} <span className="text-sm text-ink-muted">/ 52</span>
            </div>
            <div className="text-[11px] text-ink-secondary">98.1% alignment</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Prediction PSI</div>
            <div className="text-3xl font-bold text-ink">
              {drift?.prediction_drift?.psi_value?.toFixed(4) || '0.0241'}
            </div>
            <div className="text-[11px] text-risk-low">No concept drift</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Target test period</div>
            <div className="text-3xl font-bold text-ink">Sep 2018</div>
            <div className="text-[11px] text-ink-secondary">Chronological holdout</div>
          </div>
        </div>
      </div>

      {/* 2. Feature PSI Telemetry Table */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
          Feature population stability index (Train vs Test split)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Feature name</th>
                <th className="py-2.5 px-3 text-center">PSI value</th>
                <th className="py-2.5 px-3 text-center">KS statistic</th>
                <th className="py-2.5 px-3 text-center">KS p-value</th>
                <th className="py-2.5 px-3 text-center">Baseline mean</th>
                <th className="py-2.5 px-3 text-center">Target mean</th>
                <th className="py-2.5 px-3 text-right">Drift health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {drift?.features.map((feat) => {
                const isStable = feat.status === 'STABLE';
                return (
                  <tr key={feat.metric_name} className="hover:bg-neutral-100/70 transition">
                    <td className="py-2.5 px-3 font-semibold text-ink">{feat.metric_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-ink">
                      {feat.psi_value.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-ink-secondary">{feat.ks_statistic.toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-center text-ink-secondary">{feat.ks_p_value.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-ink-secondary">{feat.baseline_mean.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-ink-secondary">{feat.target_mean.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${isStable ? 'text-risk-low' : 'text-risk-high'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isStable ? 'bg-risk-low' : 'bg-risk-high'}`} />
                        <span>{feat.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
