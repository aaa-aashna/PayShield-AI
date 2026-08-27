import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiskBadge } from '../components/common/RiskBadge';
import { api } from '../services/api';
import { AlertRecord, AlertStatus } from '../types';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(50);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleStatusChange = (e: React.MouseEvent, alertId: string, newStatus: AlertStatus) => {
    e.stopPropagation();
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
  };

  const filteredAlerts = alerts.filter(
    (a) => statusFilter === 'ALL' || a.status === statusFilter
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Triage
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">
              Investigations
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Active threat triage queue for HIGH and CRITICAL risk payment anomalies.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface border border-surface-border rounded-none px-3 py-1.5 text-ink focus:border-ink outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE POSITIVE">False positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-t border-surface-border pt-2">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-ink-muted">Loading investigations...</div>
        ) : filteredAlerts.length > 0 ? (
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
              <tr>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Terminal</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Primary signal</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {filteredAlerts.map((alt) => (
                <tr
                  key={alt.id}
                  onClick={() => navigate(`/transactions/${alt.transaction_id}`)}
                  className="hover:bg-neutral-100/70 transition cursor-pointer"
                >
                  <td className="py-3 px-3">
                    <RiskBadge level={alt.severity} score={alt.risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-semibold text-ink">{alt.transaction_id}</td>
                  <td className="py-3 px-3 text-ink-secondary">{alt.customer_id}</td>
                  <td className="py-3 px-3 text-ink-muted">{alt.terminal_id}</td>
                  <td className="py-3 px-3 text-right font-bold text-ink">
                    ${alt.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-ink-secondary font-sans text-xs max-w-xs truncate">
                    {alt.primary_reason}
                  </td>
                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={alt.status}
                      onChange={(e) => handleStatusChange(e as any, alt.id, e.target.value as AlertStatus)}
                      className="bg-surface border border-surface-border rounded-none px-2 py-0.5 text-[10px] font-mono text-ink focus:border-ink outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-ink hover:underline">Inspect →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-xs font-mono text-ink-muted">
            No investigations found matching filter.
          </div>
        )}
      </div>
    </div>
  );
};
