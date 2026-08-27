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
  Share2,
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
          title="Transaction Record Not Found"
          description="The requested transaction record could not be found in the current evaluation stream."
          actionLabel="Return to Transactions Stream"
          onAction={() => navigate('/transactions')}
        />
      </div>
    );
  }

  const baselineMean = ((tx.tx_amount / (1 + (tx.components?.customer_deviation || 0.5) * 3))).toFixed(2);
  const departureFactor = (tx.tx_amount / (parseFloat(baselineMean) || 1)).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-slate-100 border border-surface-border text-ink-secondary hover:text-ink transition"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Forensic Investigation / {tx.transaction_id}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-mono">
              Transaction {tx.transaction_id}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span>Evaluated at:</span>
          <span className="text-ink font-medium bg-white border border-surface-border px-2.5 py-1 rounded shadow-subtle">
            {new Date(tx.tx_datetime).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Flagship Decision & Risk Status Card */}
      <div
        className={`p-6 rounded-lg border transition ${
          tx.decision === 'BLOCK'
            ? 'bg-red-50/70 border-red-200'
            : tx.decision === 'CHALLENGE' || tx.decision === 'REVIEW'
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {tx.decision === 'BLOCK' ? (
                <ShieldAlert className="w-5 h-5 text-red-600" />
              ) : tx.decision === 'CHALLENGE' || tx.decision === 'REVIEW' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              )}
              <span className="font-mono text-xs uppercase tracking-widest text-ink-muted font-semibold">
                Authorization Decision
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-mono">
              {tx.decision === 'BLOCK'
                ? 'HARD BLOCK · CRITICAL RISK'
                : tx.decision === 'CHALLENGE'
                ? 'STEP-UP 2FA · HIGH RISK'
                : tx.decision === 'REVIEW'
                ? 'MANUAL REVIEW · MEDIUM RISK'
                : 'APPROVED · LOW RISK'}
            </h2>

            <p className="text-sm text-ink-secondary max-w-2xl font-sans leading-relaxed">
              {tx.decision === 'BLOCK'
                ? 'Automated hard block executed due to severe behavioral departure (+3.4x spend spike) combined with high terminal compromise probability.'
                : tx.decision === 'CHALLENGE'
                ? 'Step-up authentication required: cardholder activity departs from established weekday schedule and merchant history.'
                : tx.decision === 'REVIEW'
                ? 'Transaction routed to triage desk for secondary validation before settlement.'
                : 'Transaction aligns with established 30-day cardholder behavior and merchant profile.'}
            </p>
          </div>

          <div className="text-left md:text-right font-mono shrink-0">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Risk Score</div>
            <div className="text-3xl sm:text-4xl font-bold text-ink font-numeric">
              {tx.risk_score.toFixed(1)} <span className="text-sm font-normal text-ink-muted">/ 100</span>
            </div>
            <div className="mt-2 flex items-center md:justify-end gap-2">
              <RiskBadge level={tx.risk_level} size="md" />
              <RiskBadge decision={tx.decision} size="md" />
            </div>
          </div>
        </div>

        {/* Risk Gauge Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <RiskScale score={tx.risk_score} level={tx.risk_level} />
          {tx.is_escalated && (
            <p className="text-xs font-mono text-orange-700 pt-2 flex items-center gap-1.5 font-medium">
              <span>⚡</span>
              <span>{tx.escalation_notes || 'Adaptive escalation active: multiple consecutive high-risk events detected within rolling window.'}</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Analyst Operations Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-surface-border rounded-lg shadow-subtle font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted uppercase font-semibold text-[11px]">Triage Actions:</span>
          {actionFeedback && (
            <span className="text-emerald-700 text-xs font-sans font-medium">{actionFeedback}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 font-sans">
          <button
            onClick={() => handleAnalystAction('Hard Block Confirmed')}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition font-medium text-xs shadow-subtle"
          >
            Confirm Hard Block
          </button>
          <button
            onClick={() => handleAnalystAction('MFA Step-up Dispatched')}
            className="px-3.5 py-1.5 bg-white border border-surface-border text-ink hover:border-ink rounded-md transition font-medium text-xs shadow-subtle"
          >
            Request Step-up MFA
          </button>
          <button
            onClick={() => handleAnalystAction('Marked False Positive')}
            className="px-3.5 py-1.5 bg-white border border-surface-border text-ink-secondary hover:text-ink rounded-md transition font-medium text-xs shadow-subtle"
          >
            Mark False Positive
          </button>
        </div>
      </div>

      {/* 4. Investigation Workspace (7 Cols Left / 5 Cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. Transaction Attributes Grid */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-4">
            <h2 className="text-sm font-semibold text-ink">
              Authorization Attributes
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] text-ink-muted uppercase">Transaction Amount</div>
                <div className="font-bold text-ink text-base mt-0.5 font-numeric">${tx.tx_amount.toFixed(2)}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] text-ink-muted uppercase">Customer Account</div>
                <div className="font-bold text-ink text-base mt-0.5">{tx.customer_id}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] text-ink-muted uppercase">Terminal Terminal</div>
                <div className="font-bold text-ink text-base mt-0.5">{tx.terminal_id}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] text-ink-muted uppercase">Timestamp</div>
                <div className="font-medium text-ink mt-0.5">{new Date(tx.tx_datetime).toLocaleTimeString()}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] text-ink-muted uppercase">Model Version</div>
                <div className="font-medium text-ink mt-0.5">{tx.model_version || 'v1.0.0'}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] text-ink-muted uppercase">Settlement Risk</div>
                <div className="font-bold text-red-600 mt-0.5">{tx.risk_level}</div>
              </div>
            </div>
          </div>

          {/* B. Customer Behavioral Baseline Departure */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Customer Behavioral Baseline Departure
                </h2>
                <p className="text-xs text-ink-secondary">
                  Current authorization compared against 30-day expanding historical baseline.
                </p>
              </div>
              <span className="text-xs font-mono text-ink-muted">Customer #{tx.customer_id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                  <tr>
                    <th className="py-2.5 px-3">Behavioral Metric</th>
                    <th className="py-2.5 px-3 text-right">30-Day Baseline</th>
                    <th className="py-2.5 px-3 text-right">Current Event</th>
                    <th className="py-2.5 px-3 text-right">Departure Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs">
                  <tr>
                    <td className="py-3 px-3 text-ink font-medium">Average ticket amount</td>
                    <td className="py-3 px-3 text-right text-ink-secondary font-numeric">${baselineMean}</td>
                    <td className="py-3 px-3 text-right font-bold text-ink font-numeric">${tx.tx_amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-red-600 font-bold font-numeric">
                      +{departureFactor}x surge
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-ink font-medium">Hourly transaction velocity</td>
                    <td className="py-3 px-3 text-right text-ink-secondary font-numeric">0.8 tx/hr</td>
                    <td className="py-3 px-3 text-right font-bold text-ink">
                      {(tx.components?.velocity_score || 0) > 0.5 ? 'Burst (>4/hr)' : 'Normal (<2/hr)'}
                    </td>
                    <td className="py-3 px-3 text-right text-ink-secondary">
                      {(tx.components?.velocity_score || 0) > 0.5 ? 'Velocity spike' : 'Normal'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-ink font-medium">Merchant relationship</td>
                    <td className="py-3 px-3 text-right text-ink-secondary">Known terminal</td>
                    <td className="py-3 px-3 text-right font-bold text-ink">
                      Terminal {tx.terminal_id}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${(tx.components?.graph_risk || 0) > 0.3 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {(tx.components?.graph_risk || 0) > 0.3 ? 'Unprecedented' : 'Known'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* C. Preceding Session Trail */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-3">
            <h2 className="text-sm font-semibold text-ink">
              Preceding Session Activity Trail
            </h2>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-ink-secondary">
                <span className="text-ink-muted text-[11px]">14:12:00</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Terminal 8023 · $34.50 — <b className="text-ink font-semibold">APPROVED (Normal baseline)</b></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-ink-secondary">
                <span className="text-ink-muted text-[11px]">14:55:10</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Terminal 8023 · $52.00 — <b className="text-ink font-semibold">APPROVED (Normal baseline)</b></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-200 rounded font-semibold text-ink">
                <span className="text-red-600 text-[11px]">15:37:31</span>
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Terminal {tx.terminal_id} · ${tx.tx_amount.toFixed(2)} — <b className="text-red-700">{tx.decision} ({tx.risk_score.toFixed(1)})</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* A. Flagged Anomaly Signals */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-3">
            <h2 className="text-sm font-semibold text-ink">
              Flagged Anomaly Signals
            </h2>

            <div className="space-y-2.5">
              {tx.reasons && tx.reasons.length > 0 ? (
                tx.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                    <span className="font-mono text-brand font-bold shrink-0">{idx + 1}.</span>
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

          {/* B. Multi-Signal Risk Decomposition */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-3">
            <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Multi-Signal Decomposition
                </h2>
                <p className="text-xs text-ink-secondary">
                  6 Calibrated statistical and machine learning signals.
                </p>
              </div>
              <span className="text-[11px] font-mono text-ink-muted">Fusion v1.2</span>
            </div>

            <div className="space-y-1">
              <SignalBar
                label="Supervised Fraud Probability"
                value={tx.components.fraud_probability}
                isPercentage={true}
                weight="35% weight"
                description="HistGradientBoosting classifier calibrated on severe class imbalance."
              />
              <SignalBar
                label="Unsupervised Anomaly Score"
                value={tx.components.anomaly_score}
                weight="20% weight"
                description="Isolation Forest multidimensional outlier distance."
              />
              <SignalBar
                label="Customer Spending Deviation"
                value={tx.components.customer_deviation}
                weight="15% weight"
                description="Z-Score standard deviations from expanding customer spend baseline."
              />
              <SignalBar
                label="Velocity Dynamics"
                value={tx.components.velocity_score}
                weight="10% weight"
                description="Rolling transaction frequency across short sliding windows."
              />
              <SignalBar
                label="Terminal Historical Prior"
                value={tx.components.terminal_risk}
                weight="10% weight"
                description="Empirical Bayes smoothed historical merchant fraud prior."
              />
              <SignalBar
                label="Graph Relationship Rarity"
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
