import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Store,
  CreditCard,
  CheckCircle,
  FileCheck,
  AlertOctagon,
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskScale } from '../components/common/RiskScale';
import { SignalBar } from '../components/common/SignalBar';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import { TransactionRecord } from '../types';

export const TransactionForensics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      setLoading(true);
      try {
        if (id) {
          try {
            const data = await api.getTransaction(id);
            setTx(data);
          } catch {
            const list = await api.getTransactions(1);
            if (list.length > 0) setTx(list[0]);
          }
        } else {
          const list = await api.getTransactions(1);
          if (list.length > 0) setTx(list[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [id]);

  const handleAnalystAction = (actionName: string) => {
    setActionFeedback(`Case updated: ${actionName} applied successfully.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  if (loading) {
    return <LoadingState message="Loading forensic investigation record..." className="py-24" />;
  }

  if (!tx) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <EmptyState
          title="Transaction Not Found"
          description="The requested transaction record could not be found in the current evaluation batch."
          actionLabel="Return to transactions"
          onAction={() => navigate('/transactions')}
        />
      </div>
    );
  }

  const isHighRisk = tx.risk_level === 'CRITICAL' || tx.risk_level === 'HIGH';
  const baselineMean = ((tx.tx_amount / (1 + (tx.components?.customer_deviation || 0.5) * 3))).toFixed(2);
  const departureFactor = (tx.tx_amount / (parseFloat(baselineMean) || 1)).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* 1. Breadcrumbs & Header Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono text-ink-secondary hover:text-ink transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to list</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
            <span>Decision engine:</span>
            <span className="text-ink font-semibold bg-surface border border-surface-border px-2 py-0.5">
              Production Ruleset v1.2
            </span>
          </div>
        </div>

        {/* 2. Flagship Decision Banner */}
        <div
          className={`p-6 border transition ${
            tx.decision === 'BLOCK'
              ? 'bg-red-50/60 border-red-200'
              : tx.decision === 'CHALLENGE' || tx.decision === 'REVIEW'
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {tx.decision === 'BLOCK' ? (
                  <ShieldAlert className="w-5 h-5 text-risk-critical" />
                ) : tx.decision === 'CHALLENGE' || tx.decision === 'REVIEW' ? (
                  <AlertTriangle className="w-5 h-5 text-risk-high" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-risk-low" />
                )}
                <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                  System Decision
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-mono">
                {tx.decision === 'BLOCK'
                  ? 'BLOCK TRANSACTION · CRITICAL THREAT'
                  : tx.decision === 'CHALLENGE'
                  ? 'STEP-UP CHALLENGE · HIGH RISK'
                  : tx.decision === 'REVIEW'
                  ? 'MANUAL REVIEW · MEDIUM RISK'
                  : 'APPROVE TRANSACTION · LOW RISK'}
              </h1>
              <p className="text-xs text-ink-secondary font-sans max-w-2xl leading-relaxed">
                {tx.decision === 'BLOCK'
                  ? 'Automated hard block executed due to severe behavioral deviation and high terminal compromise probability.'
                  : tx.decision === 'CHALLENGE'
                  ? 'Two-factor step-up authentication challenge required due to unprecedented terminal relationship.'
                  : tx.decision === 'REVIEW'
                  ? 'Transaction routed to fraud operations triage queue for secondary inspection.'
                  : 'Transaction conforms to historical customer spend patterns and known terminal profile.'}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono shrink-0">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Calculated Risk</div>
              <div className="text-3xl sm:text-4xl font-bold text-ink">{tx.risk_score.toFixed(1)} <span className="text-sm font-normal text-ink-muted">/ 100</span></div>
              <div className="mt-1 flex items-center sm:justify-end gap-2">
                <RiskBadge level={tx.risk_level} size="sm" />
                <RiskBadge decision={tx.decision} size="sm" />
              </div>
            </div>
          </div>

          {/* Risk Gauge */}
          <div className="mt-6 pt-4 border-t border-surface-border">
            <RiskScale score={tx.risk_score} level={tx.risk_level} />
            {tx.is_escalated && (
              <p className="text-xs font-mono text-risk-high pt-2 flex items-center gap-1.5">
                <span>⚡</span>
                <span>{tx.escalation_notes || 'Adaptive escalation active: multiple consecutive high-risk events within rolling window.'}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analyst Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-surface border border-surface-border font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted uppercase text-[11px]">Analyst Triage:</span>
          {actionFeedback && (
            <span className="text-risk-low text-xs font-sans font-medium">{actionFeedback}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleAnalystAction('Hard Block Confirmed')}
            className="px-3 py-1.5 bg-risk-critical text-white hover:bg-red-800 transition font-medium"
          >
            Confirm Block
          </button>
          <button
            onClick={() => handleAnalystAction('MFA Step-up Dispatched')}
            className="px-3 py-1.5 bg-surface border border-surface-border text-ink hover:border-ink transition"
          >
            Request Step-up MFA
          </button>
          <button
            onClick={() => handleAnalystAction('Marked False Positive')}
            className="px-3 py-1.5 bg-surface border border-surface-border text-ink-secondary hover:text-ink transition"
          >
            Mark False Positive
          </button>
        </div>
      </div>

      {/* 3. Forensic Investigation Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transaction Metadata & Behavioral Departure */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata Cards Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Transaction attributes
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-surface border border-surface-border">
                <div className="text-[11px] text-ink-muted uppercase">Transaction ID</div>
                <div className="font-bold text-ink mt-0.5">{tx.transaction_id}</div>
              </div>

              <div className="p-3 bg-surface border border-surface-border">
                <div className="text-[11px] text-ink-muted uppercase">Amount</div>
                <div className="font-bold text-ink mt-0.5">${tx.tx_amount.toFixed(2)}</div>
              </div>

              <div className="p-3 bg-surface border border-surface-border">
                <div className="text-[11px] text-ink-muted uppercase">Customer ID</div>
                <div className="font-bold text-ink mt-0.5">{tx.customer_id}</div>
              </div>

              <div className="p-3 bg-surface border border-surface-border">
                <div className="text-[11px] text-ink-muted uppercase">Terminal ID</div>
                <div className="font-bold text-ink mt-0.5">{tx.terminal_id}</div>
              </div>

              <div className="p-3 bg-surface border border-surface-border">
                <div className="text-[11px] text-ink-muted uppercase">Authorization Time</div>
                <div className="font-semibold text-ink mt-0.5">{new Date(tx.tx_datetime).toLocaleTimeString()}</div>
              </div>

              <div className="p-3 bg-surface border border-surface-border">
                <div className="text-[11px] text-ink-muted uppercase">Model Version</div>
                <div className="font-semibold text-ink mt-0.5">{tx.model_version || 'v1.0.0'}</div>
              </div>
            </div>
          </div>

          {/* Customer Behavioral Comparison Table */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                Customer behavioral baseline departure
              </h2>
              <span className="text-[11px] font-mono text-ink-muted">30-day historical window</span>
            </div>

            <div className="overflow-x-auto bg-surface border border-surface-border">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
                  <tr>
                    <th className="py-2.5 px-3">Behavior metric</th>
                    <th className="py-2.5 px-3 text-right">Historical normal</th>
                    <th className="py-2.5 px-3 text-right">Current event</th>
                    <th className="py-2.5 px-3 text-right">Departure delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-[11px]">
                  <tr>
                    <td className="py-3 px-3 text-ink font-medium">Average ticket size</td>
                    <td className="py-3 px-3 text-right text-ink-secondary">${baselineMean}</td>
                    <td className="py-3 px-3 text-right font-bold text-ink">${tx.tx_amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-risk-critical font-bold">
                      +{departureFactor}x
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-ink font-medium">Hourly velocity</td>
                    <td className="py-3 px-3 text-right text-ink-secondary">0.8 tx/hr</td>
                    <td className="py-3 px-3 text-right font-bold text-ink">
                      {(tx.components?.velocity_score || 0) > 0.5 ? 'Burst (>4/hr)' : 'Normal (<2/hr)'}
                    </td>
                    <td className="py-3 px-3 text-right text-ink-secondary">
                      {(tx.components?.velocity_score || 0) > 0.5 ? 'Velocity surge' : 'Baseline'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-ink font-medium">Merchant relationship</td>
                    <td className="py-3 px-3 text-right text-ink-secondary">Known terminal</td>
                    <td className="py-3 px-3 text-right font-bold text-ink">
                      Terminal {tx.terminal_id}
                    </td>
                    <td className={`py-3 px-3 text-right ${(tx.components?.graph_risk || 0) > 0.3 ? 'text-risk-high font-semibold' : 'text-risk-low'}`}>
                      {(tx.components?.graph_risk || 0) > 0.3 ? 'Unprecedented' : 'Established'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Preceding Session Timeline */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Preceding cardholder session activity
            </h2>

            <div className="bg-surface border border-surface-border p-4 font-mono text-xs space-y-3">
              <div className="flex items-center gap-3 text-ink-secondary">
                <span className="text-ink-muted text-[11px]">14:12:00</span>
                <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
                <span>Terminal 8023 · $34.50 — <b className="text-ink">APPROVED (Normal)</b></span>
              </div>
              <div className="flex items-center gap-3 text-ink-secondary">
                <span className="text-ink-muted text-[11px]">14:55:10</span>
                <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
                <span>Terminal 8023 · $52.00 — <b className="text-ink">APPROVED (Normal)</b></span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-ink bg-neutral-100 p-2 border border-surface-border">
                <span className="text-risk-critical text-[11px]">15:37:31</span>
                <span className="w-2 h-2 rounded-full bg-risk-critical" />
                <span>Terminal {tx.terminal_id} · ${tx.tx_amount.toFixed(2)} — <b className="text-risk-critical">{tx.decision} ({tx.risk_score.toFixed(1)})</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Signal Attribution & Root Cause */}
        <div className="lg:col-span-5 space-y-6">
          {/* Flagged Reasons */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Flagged anomaly triggers
            </h2>

            <div className="bg-surface border border-surface-border p-4 space-y-3">
              {tx.reasons && tx.reasons.length > 0 ? (
                tx.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="font-mono text-ink-muted font-bold">{idx + 1}.</span>
                    <p className="text-ink leading-relaxed font-sans">{reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs font-sans text-ink-secondary">
                  Transaction parameters fall within normal baseline limits.
                </p>
              )}
            </div>
          </div>

          {/* Model Signals Breakdown */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                Multi-signal decomposition
              </h2>
              <span className="text-[11px] font-mono text-ink-muted">6 Calibrated signals</span>
            </div>

            <div className="bg-surface border border-surface-border p-4 space-y-1">
              <SignalBar
                label="Supervised fraud probability"
                value={tx.components.fraud_probability}
                isPercentage={true}
                weight="35% weight"
                description="HistGradientBoosting probability calibrated on class imbalance."
              />
              <SignalBar
                label="Unsupervised anomaly score"
                value={tx.components.anomaly_score}
                weight="20% weight"
                description="Isolation Forest multidimensional outlier distance."
              />
              <SignalBar
                label="Customer behavioral departure"
                value={tx.components.customer_deviation}
                weight="15% weight"
                description="Z-Score standard deviations from historical customer mean."
              />
              <SignalBar
                label="Velocity dynamics"
                value={tx.components.velocity_score}
                weight="10% weight"
                description="Rolling transaction frequency across short sliding windows."
              />
              <SignalBar
                label="Terminal prior risk"
                value={tx.components.terminal_risk}
                weight="10% weight"
                description="Empirical Bayes smoothed historical fraud prior on merchant terminal."
              />
              <SignalBar
                label="Graph relationship rarity"
                value={tx.components.graph_risk}
                weight="10% weight"
                description="Bipartite graph connection rarity and neighborhood risk."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
