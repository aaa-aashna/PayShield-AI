import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header & Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Security Investigations & Triage Desk
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Active threat triage queue for HIGH and CRITICAL risk payment authorization anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span>Active cases:</span>
          <span className="font-bold text-ink bg-white border border-surface-border px-3 py-1.5 rounded-md shadow-subtle">
            {alerts.length} Incidents
          </span>
        </div>
      </div>

      {/* 2. Structured KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Pending Disposition</div>
          <div className="text-2xl font-bold text-ink font-numeric">{newCount} <span className="text-xs font-normal text-ink-muted">Cases</span></div>
          <div className="text-xs text-ink-secondary">Unreviewed incoming alerts</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Hard Block Interceptions</div>
          <div className="text-2xl font-bold text-risk-critical font-numeric">{criticalCount} <span className="text-xs font-normal text-ink-muted">Critical</span></div>
          <div className="text-xs text-ink-secondary">Autonomous block executed</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">MFA Challenges</div>
          <div className="text-2xl font-bold text-risk-high font-numeric">{highCount} <span className="text-xs font-normal text-ink-muted">High Risk</span></div>
          <div className="text-xs text-ink-secondary">Step-up verification required</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Auto Triage SLA</div>
          <div className="text-2xl font-bold text-risk-low font-numeric">100%</div>
          <div className="text-xs text-risk-low font-medium">All streams actively triaged</div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-surface-border rounded-lg shadow-subtle font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase font-semibold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-surface-border rounded px-3 py-1.5 text-ink focus:border-brand outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE POSITIVE">False Positive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase font-semibold text-[11px]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-surface-border rounded px-3 py-1.5 text-ink focus:border-brand outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-sans text-ink-muted">
          Showing <b className="text-ink">{filteredAlerts.length}</b> of {alerts.length} incidents
        </div>
      </div>

      {/* 4. Incidents Table */}
      <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
        {loading ? (
          <LoadingState message="Loading active triage queue..." className="py-16" />
        ) : filteredAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3.5">Severity</th>
                  <th className="py-3 px-3.5">Transaction ID</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5">Terminal</th>
                  <th className="py-3 px-3.5 text-right">Amount</th>
                  <th className="py-3 px-3.5">Primary Anomaly Signal</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {filteredAlerts.map((alt) => (
                  <tr
                    key={alt.id}
                    onClick={() => navigate(`/transactions/${alt.transaction_id}`)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3.5">
                      <RiskBadge level={alt.severity} score={alt.risk_score} size="sm" />
                    </td>
                    <td className="py-3.5 px-3.5 font-bold text-ink">{alt.transaction_id}</td>
                    <td className="py-3.5 px-3.5 text-ink-secondary">{alt.customer_id}</td>
                    <td className="py-3.5 px-3.5 text-ink-muted">{alt.terminal_id}</td>
                    <td className="py-3.5 px-3.5 text-right font-bold text-ink font-numeric">
                      ${alt.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3.5 text-ink-secondary font-sans text-xs max-w-sm">
                      {alt.primary_reason}
                    </td>
                    <td className="py-3.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={alt.status}
                        onChange={(e) => handleStatusChange(e as any, alt.id, e.target.value as AlertStatus)}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] font-mono text-ink focus:border-brand outline-none"
                      >
                        <option value="NEW">NEW</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <span className="text-brand hover:underline font-sans font-medium">Investigate →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No Incidents Match Selected Filters"
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
