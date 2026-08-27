import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import { TransactionRecord, AlertRecord } from '../types';

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick transaction test state
  const [customerId, setCustomerId] = useState('1376');
  const [terminalId, setTerminalId] = useState('8023');
  const [amount, setAmount] = useState('167.40');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScoredTx, setLastScoredTx] = useState<TransactionRecord | null>(null);

  const presets = [
    { label: 'Normal Spend', cust: '1104', term: '1205', amt: '49.49' },
    { label: 'Spending Surge (+3.4x)', cust: '1376', term: '8023', amt: '167.40' },
    { label: 'New Terminal Burst', cust: '1488', term: '9211', amt: '240.10' },
    { label: 'Terminal Hopping', cust: '1042', term: '5081', amt: '195.00' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, alts] = await Promise.all([
        api.getTransactions(30),
        api.getAlerts(15),
      ]);
      setTransactions(txs);
      setAlerts(alts);
    } catch (e) {
      console.error('Failed to load verified data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    try {
      const amt = parseFloat(amount) || 100.0;
      const res = await api.scoreTransaction({
        transaction_id: `TX_${Date.now().toString().slice(-6)}`,
        customer_id: customerId,
        terminal_id: terminalId,
        tx_amount: amt,
      });
      setLastScoredTx(res);
      setTransactions((prev) => [res, ...prev]);
      if (res.risk_level === 'CRITICAL' || res.risk_level === 'HIGH') {
        const newAlt: AlertRecord = {
          id: `ALT_${res.transaction_id}`,
          transaction_id: res.transaction_id,
          customer_id: res.customer_id,
          terminal_id: res.terminal_id,
          amount: res.tx_amount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: res.risk_level,
          type: res.reasons[0] || 'Multi-signal threshold breach',
          risk_score: res.risk_score,
          decision: res.decision,
          status: 'NEW',
          primary_reason: res.reasons[0] || 'Anomalous deviation detected',
        };
        setAlerts((prev) => [newAlt, ...prev]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setCustomerId(preset.cust);
    setTerminalId(preset.term);
    setAmount(preset.amt);
  };

  const timelineData = transactions
    .slice(0, 18)
    .reverse()
    .map((tx, idx) => ({
      time: tx.tx_datetime ? new Date(tx.tx_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${idx}`,
      risk_score: tx.risk_score,
      amount: tx.tx_amount,
      fraud_prob: tx.fraud_probability * 100,
    }));

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* 1. Operational Overview Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Monitoring Console
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Fraud operations overview
            </h1>
            <p className="text-sm text-ink-secondary max-w-2xl font-sans pt-1">
              Multi-signal risk fusion, behavioral baselining, and automated triage on live payment authorizations.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted shrink-0">
            <span>Model:</span>
            <span className="font-semibold text-ink bg-surface border border-surface-border px-2 py-1">
              HistGB Champion v1.0.0
            </span>
          </div>
        </div>

        {/* Operational Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-surface-border font-mono">
          <div className="space-y-1 bg-surface border border-surface-border p-4">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Total processed</div>
            <div className="text-2xl sm:text-3xl font-bold text-ink">1,754,155</div>
            <div className="text-[11px] text-ink-secondary">6-Month production stream</div>
          </div>

          <div className="space-y-1 bg-surface border border-surface-border p-4">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Critical threats</div>
            <div className="text-2xl sm:text-3xl font-bold text-risk-critical">{loading ? '—' : criticalCount}</div>
            <div className="text-[11px] text-ink-secondary">Automated hard block</div>
          </div>

          <div className="space-y-1 bg-surface border border-surface-border p-4">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Step-up challenges</div>
            <div className="text-2xl sm:text-3xl font-bold text-risk-high">{loading ? '—' : highCount}</div>
            <div className="text-[11px] text-ink-secondary">MFA challenge triggered</div>
          </div>

          <div className="space-y-1 bg-surface border border-surface-border p-4">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Stability index (PSI)</div>
            <div className="text-2xl sm:text-3xl font-bold text-risk-low">0.0241</div>
            <div className="text-[11px] text-risk-low font-semibold">STABLE (&lt; 0.10 threshold)</div>
          </div>
        </div>
      </div>

      {/* 2. Live Risk Velocity Chart */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Live risk score velocity
            </h2>
            <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
              Continuous multi-tier risk score evaluations across recent chronological transactions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink" /> Risk score
            </span>
            <span className="inline-flex items-center gap-1.5 text-risk-critical">
              <span className="w-2 h-0.5 bg-risk-critical" /> Block threshold (80.0)
            </span>
          </div>
        </div>

        <div className="h-60 w-full pt-2 bg-surface border border-surface-border p-3">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f0f0ed" vertical={false} />
                <XAxis dataKey="time" stroke="#8e99a8" fontSize={10} fontStyle="JetBrains Mono" />
                <YAxis stroke="#8e99a8" domain={[0, 100]} fontSize={10} fontStyle="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e6e6e2',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    borderRadius: 0,
                  }}
                />
                <ReferenceLine y={80} stroke="#b91c1c" strokeDasharray="3 3" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#0f172a"
                  strokeWidth={1.75}
                  dot={{ r: 3, fill: '#0f172a' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <LoadingState message="Loading risk score stream..." className="py-20" />
          )}
        </div>
      </div>

      {/* 3. Two Columns: Priority Triage & Interactive Transaction Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Priority Investigations Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                Priority investigations
              </h2>
              <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
                Active alerts requiring compliance or analyst review.
              </p>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-mono text-ink hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View all ({alerts.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-surface-border bg-surface border border-surface-border">
            {loading ? (
              <LoadingState message="Loading active triage cases..." className="py-12" />
            ) : alerts.length > 0 ? (
              alerts.slice(0, 5).map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => navigate(`/transactions/${alt.transaction_id}`)}
                  className="p-3.5 hover:bg-neutral-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <RiskBadge level={alt.severity} score={alt.risk_score} size="sm" />
                      <span className="font-mono text-xs font-semibold text-ink">
                        {alt.transaction_id}
                      </span>
                      <span className="text-[11px] text-ink-muted font-mono">
                        Cust {alt.customer_id} · Term {alt.terminal_id}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary leading-snug font-sans">
                      {alt.primary_reason}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 font-mono text-xs">
                    <div className="font-bold text-ink">${alt.amount.toFixed(2)}</div>
                    <div className="text-ink-muted text-[11px]">{alt.timestamp}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Queue Clean" description="No unreviewed priority alerts at this time." className="py-10" />
            )}
          </div>
        </div>

        {/* Right: Live Transaction Evaluation Console */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-b border-surface-border pb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                Test transaction evaluation
              </h2>
              <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
                Simulate real-time scoring through the risk engine.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-neutral-100 text-ink-secondary px-2 py-0.5 border border-surface-border">
              ONLINE PIPELINE
            </span>
          </div>

          <div className="bg-surface border border-surface-border p-4 space-y-4">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink-muted uppercase">Sample scenarios:</label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-[10px] font-mono bg-surface-subtle hover:bg-neutral-200 text-ink-secondary hover:text-ink px-2 py-1 border border-surface-border transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleQuickScore} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted text-[11px] mb-1">Customer ID</label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
                    placeholder="1376"
                  />
                </div>

                <div>
                  <label className="block text-ink-muted text-[11px] mb-1">Terminal ID</label>
                  <input
                    type="text"
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                    className="w-full bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
                    placeholder="8023"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-muted text-[11px] mb-1">Transaction Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
                  placeholder="167.40"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-ink hover:bg-neutral-800 text-white font-medium py-2 px-4 text-xs transition disabled:opacity-50 font-mono"
              >
                {isProcessing ? 'Scoring transaction...' : 'Score transaction →'}
              </button>
            </form>

            {/* Last Evaluation Result Panel */}
            {lastScoredTx && (
              <div className="pt-3 border-t border-surface-border space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase text-ink-muted">Evaluation result:</span>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={lastScoredTx.risk_level} score={lastScoredTx.risk_score} size="sm" />
                    <RiskBadge decision={lastScoredTx.decision} size="sm" />
                  </div>
                </div>

                <div className="bg-background border border-surface-border p-2.5 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-ink-secondary">Fraud probability:</span>
                    <span className="font-bold text-ink">{(lastScoredTx.fraud_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-ink-secondary">Anomaly outlier score:</span>
                    <span className="font-bold text-ink">{lastScoredTx.anomaly_score.toFixed(2)}</span>
                  </div>
                  {lastScoredTx.reasons.length > 0 && (
                    <div className="pt-1.5 border-t border-surface-border text-[11px] font-sans text-ink leading-snug">
                      <b>Trigger:</b> {lastScoredTx.reasons[0]}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/transactions/${lastScoredTx.transaction_id}`)}
                  className="text-[11px] text-ink hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Open forensic breakdown for {lastScoredTx.transaction_id}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Real-Time Transaction Stream */}
      <div className="space-y-4">
        <div className="border-b border-surface-border pb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Live transaction stream
            </h2>
            <p className="text-[11px] font-sans text-ink-secondary pt-0.5">
              Chronological authorizations evaluated against behavioral baselines.
            </p>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-mono text-ink hover:underline flex items-center gap-1"
          >
            <span>View full transaction log</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto bg-surface border border-surface-border">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
              <tr>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Terminal</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Fraud probability</th>
                <th className="py-2.5 px-3">Risk level</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {transactions.slice(0, 8).map((tx) => (
                <tr
                  key={tx.transaction_id}
                  onClick={() => navigate(`/transactions/${tx.transaction_id}`)}
                  className="hover:bg-neutral-50 transition cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-semibold text-ink">{tx.transaction_id}</td>
                  <td className="py-2.5 px-3 text-ink-secondary">{tx.customer_id}</td>
                  <td className="py-2.5 px-3 text-ink-muted">{tx.terminal_id}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-ink">
                    ${tx.tx_amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-ink-secondary">
                    {(tx.fraud_probability * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">
                    <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <RiskBadge decision={tx.decision} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-ink hover:underline font-semibold">Inspect →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
