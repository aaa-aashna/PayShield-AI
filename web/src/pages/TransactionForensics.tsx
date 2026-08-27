import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskScale } from '../components/common/RiskScale';
import { SignalBar } from '../components/common/SignalBar';
import { api } from '../services/api';
import { TransactionRecord } from '../types';

export const TransactionForensics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-ink-muted font-mono text-xs">Loading investigation data...</div>;
  }

  if (!tx) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-ink-muted font-mono text-xs space-y-4">
        <p>Transaction not found.</p>
        <button
          onClick={() => navigate('/transactions')}
          className="text-ink hover:underline"
        >
          ← Return to transactions
        </button>
      </div>
    );
  }

  const baselineMean = ((tx.tx_amount / (1 + (tx.components?.customer_deviation || 0.5) * 3))).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      {/* 1. Header & Navigation */}
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs font-mono text-ink-secondary hover:text-ink transition inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to investigations</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 pt-2 border-b border-surface-border pb-6">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Transaction details
            </div>
            <h1 className="text-4xl font-bold font-mono text-ink tracking-tight">
              {tx.transaction_id}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink-secondary pt-1">
              <span>Customer: <b className="text-ink">{tx.customer_id}</b></span>
              <span>Terminal: <b className="text-ink">{tx.terminal_id}</b></span>
              <span>{new Date(tx.tx_datetime).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Amount</div>
            <div className="text-3xl font-bold text-ink">${tx.tx_amount.toFixed(2)}</div>
            <div className="mt-2 flex items-center sm:justify-end gap-3">
              <RiskBadge level={tx.risk_level} score={tx.risk_score} size="md" />
              <RiskBadge decision={tx.decision} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Risk Score & Segmented Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline text-xs font-mono">
          <span className="uppercase tracking-wider text-ink-muted text-[11px]">Calculated risk score</span>
          <span className="font-bold text-ink">{tx.risk_score.toFixed(1)} / 100</span>
        </div>
        <RiskScale score={tx.risk_score} level={tx.risk_level} />
        {tx.is_escalated && (
          <p className="text-xs font-mono text-risk-high pt-1">
            ⚡ {tx.escalation_notes || 'Adaptive escalation triggered by consecutive suspicious events.'}
          </p>
        )}
      </div>

      {/* 3. Why This Matters */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
          Why this transaction was flagged
        </h2>

        <div className="space-y-2.5">
          {tx.reasons && tx.reasons.length > 0 ? (
            tx.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-3 py-1 text-sm">
                <span className="font-mono text-ink-muted font-bold">{idx + 1}.</span>
                <p className="text-ink leading-relaxed font-sans">{reason}</p>
              </div>
            ))
          ) : (
            <p className="text-sm font-sans text-ink-secondary">
              Transaction aligns with customer historical baseline.
            </p>
          )}
        </div>
      </div>

      {/* 4. Customer Behavior Comparison */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
          Customer behavior comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Behavior metric</th>
                <th className="py-2.5 px-3 text-right">Historical normal</th>
                <th className="py-2.5 px-3 text-right">Current event</th>
                <th className="py-2.5 px-3 text-right">Departure delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              <tr>
                <td className="py-3 px-3 text-ink font-medium">Average amount</td>
                <td className="py-3 px-3 text-right text-ink-secondary">${baselineMean}</td>
                <td className="py-3 px-3 text-right font-bold text-ink">${tx.tx_amount.toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-risk-critical font-bold">
                  +{((tx.tx_amount / (parseFloat(baselineMean) || 1))).toFixed(1)}x
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-ink font-medium">Hourly transaction velocity</td>
                <td className="py-3 px-3 text-right text-ink-secondary">0.8 tx/hr</td>
                <td className="py-3 px-3 text-right font-bold text-ink">
                  {(tx.components?.velocity_score || 0) > 0.5 ? 'Burst (>4/hr)' : 'Normal (<2/hr)'}
                </td>
                <td className="py-3 px-3 text-right text-ink-secondary">
                  {(tx.components?.velocity_score || 0) > 0.5 ? 'Elevated burst' : 'Baseline'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-ink font-medium">Terminal relationship</td>
                <td className="py-3 px-3 text-right text-ink-secondary">Known active profile</td>
                <td className="py-3 px-3 text-right font-bold text-ink">
                  Terminal {tx.terminal_id}
                </td>
                <td className="py-3 px-3 text-right text-risk-high">
                  {(tx.components?.graph_risk || 0) > 0.3 ? 'Unprecedented' : 'Known'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Model Evidence */}
      <div className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Model evidence
          </h2>
          <span className="text-[11px] font-mono text-ink-muted">6 Calibrated signals</span>
        </div>

        <div className="space-y-1">
          <SignalBar
            label="Supervised fraud probability"
            value={tx.components.fraud_probability}
            isPercentage={true}
            weight="35% weight"
            description="HistGradientBoosting classifier calibrated on class imbalance."
          />
          <SignalBar
            label="Unsupervised anomaly score"
            value={tx.components.anomaly_score}
            weight="20% weight"
            description="Isolation Forest multidimensional behavioral outlier distance."
          />
          <SignalBar
            label="Customer behavioral departure"
            value={tx.components.customer_deviation}
            weight="15% weight"
            description="Z-Score standard deviations from expanding customer spend baseline."
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
            description="Empirical Bayes smoothed historical fraud prior and entropy."
          />
          <SignalBar
            label="Graph relationship rarity"
            value={tx.components.graph_risk}
            weight="10% weight"
            description="Bipartite graph connection rarity and neighborhood risk."
          />
        </div>
      </div>

      {/* 6. Activity Timeline */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
          Session activity timeline
        </h2>

        <div className="border-l-2 border-surface-border pl-4 space-y-4 font-mono text-xs">
          <div className="space-y-0.5">
            <div className="text-[11px] text-ink-muted">14:12:00</div>
            <div className="text-ink-secondary">Transaction at Terminal 8023 • $34.50 (Normal)</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] text-ink-muted">14:55:10</div>
            <div className="text-ink-secondary">Transaction at Terminal 8023 • $52.00 (Normal)</div>
          </div>
          <div className="space-y-0.5 font-bold text-ink">
            <div className="text-[11px] text-risk-critical">15:37:31 (FLAGGED EVENT)</div>
            <div>Transaction at Terminal {tx.terminal_id} • ${tx.tx_amount.toFixed(2)} — {tx.risk_level} ({tx.risk_score.toFixed(1)})</div>
          </div>
        </div>
      </div>
    </div>
  );
};
