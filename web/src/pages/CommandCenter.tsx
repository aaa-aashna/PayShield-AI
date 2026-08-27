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
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Filter, Search, Play } from 'lucide-react';
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

  // Quick transaction sandbox state
  const [customerId, setCustomerId] = useState('1376');
  const [terminalId, setTerminalId] = useState('8023');
  const [amount, setAmount] = useState('167.40');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScoredTx, setLastScoredTx] = useState<TransactionRecord | null>(null);

  const presets = [
    { label: 'Normal Spend ($49.49)', cust: '1104', term: '1205', amt: '49.49' },
    { label: 'Spending Surge ($167.40)', cust: '1376', term: '8023', amt: '167.40' },
    { label: 'New Terminal Spike ($240.10)', cust: '1488', term: '9211', amt: '240.10' },
    { label: 'Terminal Hopping ($195.00)', cust: '1042', term: '5081', amt: '195.00' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, alts] = await Promise.all([
        api.getTransactions(35),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header & Operational Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Payment Operations & Risk Console
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Real-time streaming authorization monitor · Multi-tier behavioral & graph anomaly detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-secondary bg-white border border-surface-border px-3 py-1.5 rounded-md shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
            <span>Active Model: <b className="text-ink font-semibold">HistGB Champion</b> (Threshold 0.757)</span>
          </div>
        </div>
      </div>

      {/* 2. Structured Operational KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Monitored Volume</div>
          <div className="text-2xl font-bold text-ink font-numeric">1,754,155 <span className="text-xs font-normal text-ink-muted">Txs</span></div>
          <div className="text-xs text-ink-secondary">6-Month continuous card stream</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Critical Threats Intercepted</div>
          <div className="text-2xl font-bold text-risk-critical font-numeric">{loading ? '—' : criticalCount} <span className="text-xs font-normal text-ink-muted">Blocked</span></div>
          <div className="text-xs text-ink-secondary">100% automated hard block execution</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Verification Challenges</div>
          <div className="text-2xl font-bold text-risk-high font-numeric">{loading ? '—' : highCount} <span className="text-xs font-normal text-ink-muted">Challenged</span></div>
          <div className="text-xs text-ink-secondary">Step-up 2FA on suspicious deviations</div>
        </div>

        <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Population Stability (PSI)</div>
          <div className="text-2xl font-bold text-risk-low font-numeric">0.0241</div>
          <div className="text-xs text-risk-low font-medium">STABLE · Zero feature drift (&lt; 0.10)</div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: 8 Cols (Telemetry & Stream) + 4 Cols (Triage & Sandbox) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: 8 Cols */}
        <div className="lg:col-span-8 space-y-8">
          {/* A. Live Risk Score Velocity Chart */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Live Risk Score Velocity
                </h2>
                <p className="text-xs text-ink-secondary">
                  Continuous multi-signal risk evaluations across recent authorization events.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Risk score (0–100)
                </span>
                <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                  <span className="w-3 h-0.5 bg-red-600" /> Block threshold (80.0)
                </span>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} fontStyle="JetBrains Mono" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={11} fontStyle="JetBrains Mono" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    />
                    <ReferenceLine y={80} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1.5} />
                    <Line
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0f172a' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <LoadingState message="Loading risk velocity telemetry..." className="py-16" />
              )}
            </div>
          </div>

          {/* B. Real-Time Transaction Stream */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Recent Stream Transactions
                </h2>
                <p className="text-xs text-ink-secondary">
                  Real-time payment transactions evaluated against customer 30-day baseline.
                </p>
              </div>

              <button
                onClick={() => navigate('/transactions')}
                className="text-xs font-medium text-brand hover:text-brand-hover flex items-center gap-1 font-sans"
              >
                <span>View all transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                  <tr>
                    <th className="py-2.5 px-3.5">Transaction ID</th>
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Terminal</th>
                    <th className="py-2.5 px-3.5 text-right">Amount</th>
                    <th className="py-2.5 px-3.5 text-center">Fraud Prob</th>
                    <th className="py-2.5 px-3.5">Risk Level</th>
                    <th className="py-2.5 px-3.5">Decision</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs">
                  {transactions.slice(0, 8).map((tx) => (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => navigate(`/transactions/${tx.transaction_id}`)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-3 px-3.5 font-semibold text-ink">{tx.transaction_id}</td>
                      <td className="py-3 px-3.5 text-ink-secondary">{tx.customer_id}</td>
                      <td className="py-3 px-3.5 text-ink-muted">{tx.terminal_id}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-ink font-numeric">
                        ${tx.tx_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-center text-ink-secondary font-numeric">
                        {(tx.fraud_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3.5">
                        <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-3.5">
                        <RiskBadge decision={tx.decision} size="sm" />
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="text-brand hover:underline font-sans font-medium">Inspect →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Cols (Triage & Sandbox) */}
        <div className="lg:col-span-4 space-y-8">
          {/* A. Priority Incident Queue */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Priority Incidents
                </h2>
                <p className="text-xs text-ink-secondary">
                  Flagged anomalies needing disposition.
                </p>
              </div>
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs text-brand hover:text-brand-hover font-medium flex items-center gap-1"
              >
                <span>Queue ({alerts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-surface-border">
              {loading ? (
                <LoadingState message="Loading incident queue..." className="py-8" />
              ) : alerts.length > 0 ? (
                alerts.slice(0, 4).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => navigate(`/transactions/${alt.transaction_id}`)}
                    className="py-3 hover:bg-slate-50 transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={alt.severity} score={alt.risk_score} size="sm" />
                        <span className="font-mono text-xs font-bold text-ink">
                          {alt.transaction_id}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-ink font-numeric">
                        ${alt.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary font-sans leading-snug line-clamp-2">
                      {alt.primary_reason}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="Queue Clean" description="No unreviewed priority alerts." className="py-8" />
              )}
            </div>
          </div>

          {/* B. Live Transaction Evaluation Sandbox */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-4 space-y-4">
            <div className="border-b border-surface-border pb-3">
              <h2 className="text-sm font-semibold text-ink">
                Transaction Scoring Sandbox
              </h2>
              <p className="text-xs text-ink-secondary">
                Simulate real-time scoring through the live risk fusion engine.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink-muted uppercase">Sample Scenarios:</label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-ink-secondary hover:text-ink px-2.5 py-1 rounded border border-slate-200 transition"
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
                    className="w-full bg-slate-50 border border-surface-border rounded px-2.5 py-1.5 text-ink focus:border-brand outline-none"
                    placeholder="1376"
                  />
                </div>

                <div>
                  <label className="block text-ink-muted text-[11px] mb-1">Terminal ID</label>
                  <input
                    type="text"
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                    className="w-full bg-slate-50 border border-surface-border rounded px-2.5 py-1.5 text-ink focus:border-brand outline-none"
                    placeholder="8023"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-muted text-[11px] mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-surface-border rounded px-2.5 py-1.5 text-ink focus:border-brand outline-none font-numeric"
                  placeholder="167.40"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-ink hover:bg-slate-800 text-white font-medium py-2 px-4 rounded text-xs transition disabled:opacity-50 font-mono shadow-subtle flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isProcessing ? 'Scoring transaction...' : 'Score Transaction →'}</span>
              </button>
            </form>

            {/* Last Evaluation Result Panel */}
            {lastScoredTx && (
              <div className="pt-3 border-t border-surface-border space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase text-ink-muted">Evaluation Result:</span>
                  <div className="flex items-center gap-1.5">
                    <RiskBadge level={lastScoredTx.risk_level} score={lastScoredTx.risk_score} size="sm" />
                    <RiskBadge decision={lastScoredTx.decision} size="sm" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-surface-border rounded p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Fraud Probability:</span>
                    <span className="font-bold text-ink font-numeric">{(lastScoredTx.fraud_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Anomaly Outlier Score:</span>
                    <span className="font-bold text-ink font-numeric">{lastScoredTx.anomaly_score.toFixed(2)}</span>
                  </div>
                  {lastScoredTx.reasons.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-200 text-[11px] font-sans text-ink leading-snug">
                      <b className="font-medium text-slate-900">Primary Signal:</b> {lastScoredTx.reasons[0]}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/transactions/${lastScoredTx.transaction_id}`)}
                  className="text-xs text-brand hover:underline flex items-center gap-1 font-sans font-medium"
                >
                  <span>Open forensic analysis for {lastScoredTx.transaction_id}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
