import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import { AlertRecord, AlertStatus } from '../types';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
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

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const newCount = alerts.filter((a) => a.status === 'NEW').length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* 1. Header & Summary Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Triage Operations
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Security investigations
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Active threat triage queue for HIGH and CRITICAL risk payment anomalies.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span>Active queue:</span>
            <span className="font-bold text-ink bg-surface border border-surface-border px-2.5 py-1">
              {alerts.length} Incidents
            </span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-border font-mono">
          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Unreviewed cases</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{newCount}</div>
            <div className="text-[11px] text-ink-secondary">Requires disposition</div>
          </div>

          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Critical blocks</div>
            <div className="text-2xl font-bold text-risk-critical mt-0.5">{criticalCount}</div>
            <div className="text-[11px] text-ink-secondary">Hard block applied</div>
          </div>

          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">High risk challenges</div>
            <div className="text-2xl font-bold text-risk-high mt-0.5">{highCount}</div>
            <div className="text-[11px] text-ink-secondary">MFA challenged</div>
          </div>

          <div className="p-3.5 bg-surface border border-surface-border">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Auto triage coverage</div>
            <div className="text-2xl font-bold text-risk-low mt-0.5">100%</div>
            <div className="text-[11px] text-ink-secondary">All streams covered</div>
          </div>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-surface border border-surface-border font-mono text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-surface-border px-2.5 py-1 text-ink focus:border-ink outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE POSITIVE">False positive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase text-[11px]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-background border border-surface-border px-2.5 py-1 text-ink focus:border-ink outline-none"
            >
              <option value="ALL">All severities</option>
              <option value="CRITICAL">Critical only</option>
              <option value="HIGH">High only</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-ink-muted">
          Showing {filteredAlerts.length} of {alerts.length} incidents
        </div>
      </div>

      {/* 3. Incidents Table */}
      <div className="overflow-x-auto bg-surface border border-surface-border">
        {loading ? (
          <LoadingState message="Loading active investigations queue..." className="py-16" />
        ) : filteredAlerts.length > 0 ? (
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
              <tr>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Terminal</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Primary signal trigger</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {filteredAlerts.map((alt) => (
                <tr
                  key={alt.id}
                  onClick={() => navigate(`/transactions/${alt.transaction_id}`)}
                  className="hover:bg-neutral-50 transition cursor-pointer"
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
                  <td className="py-3 px-3 text-ink-secondary font-sans text-xs max-w-sm">
                    {alt.primary_reason}
                  </td>
                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={alt.status}
                      onChange={(e) => handleStatusChange(e as any, alt.id, e.target.value as AlertStatus)}
                      className="bg-background border border-surface-border px-2 py-0.5 text-[10px] font-mono text-ink focus:border-ink outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-ink hover:underline font-semibold">Inspect →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No Investigations Match Filter"
            description="Adjust your status or severity filter criteria to display incident records."
            actionLabel="Reset filters"
            onAction={() => {
              setStatusFilter('ALL');
              setSeverityFilter('ALL');
            }}
            className="py-16"
          />
        )}
      </div>
    </div>
  );
};
