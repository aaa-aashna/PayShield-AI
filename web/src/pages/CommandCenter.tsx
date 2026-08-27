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
} from 'recharts';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { api } from '../services/api';
import { TransactionRecord, AlertRecord } from '../types';

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick transaction injector state using real customer and terminal IDs from dataset
  const [customerId, setCustomerId] = useState('1376');
  const [terminalId, setTerminalId] = useState('8023');
  const [amount, setAmount] = useState('167.40');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleQuickScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const amt = parseFloat(amount) || 100.0;
      const res = await api.scoreTransaction({
        transaction_id: `TX_${Date.now().toString().slice(-6)}`,
        customer_id: customerId,
        terminal_id: terminalId,
        tx_amount: amt,
      });
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

  const timelineData = transactions
    .slice(0, 16)
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
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">
      {/* 1. Introduction */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Security overview
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">
            Payment security that understands behavior.
          </h1>
          <p className="text-base text-ink-secondary max-w-2xl font-sans pt-1 leading-relaxed">
            Behavioral baselines, graph intelligence, and adaptive risk escalation on 1.75M transactions.
          </p>
        </div>

        {/* 2. Typographic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-6 border-t border-surface-border font-mono">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Transactions analyzed</div>
            <div className="text-3xl font-bold text-ink">1,754,155</div>
            <div className="text-[11px] text-ink-secondary">6 month dataset</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Critical threats</div>
            <div className="text-3xl font-bold text-risk-critical">{loading ? '—' : criticalCount}</div>
            <div className="text-[11px] text-ink-secondary">Autonomous block</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">High risk challenges</div>
            <div className="text-3xl font-bold text-risk-high">{loading ? '—' : highCount}</div>
            <div className="text-[11px] text-ink-secondary">MFA challenge</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">Stability index (PSI)</div>
            <div className="text-3xl font-bold text-ink">0.0241</div>
            <div className="text-[11px] text-risk-low font-semibold">STABLE (&lt; 0.10)</div>
          </div>
        </div>
      </div>

      {/* 3. Risk Activity Timeline */}
      <div className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Risk activity timeline
          </h2>
          <span className="text-[11px] font-mono text-ink-muted">Risk score trajectory (0 to 100)</span>
        </div>

        <div className="h-56 w-full pt-2">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e2" vertical={false} />
                <XAxis dataKey="time" stroke="#8e99a8" fontSize={10} fontStyle="JetBrains Mono" />
                <YAxis stroke="#8e99a8" domain={[0, 100]} fontSize={10} fontStyle="JetBrains Mono" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6e6e2', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                />
                <Line
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#0f172a"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: '#0f172a' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-ink-muted">
              Loading transaction telemetry...
            </div>
          )}
        </div>
      </div>

      {/* 4. Priority Investigations */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Priority investigations
          </h2>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs font-mono text-ink hover:underline flex items-center gap-1"
          >
            <span>View all ({alerts.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-surface-border">
          {loading ? (
            <div className="py-8 text-xs font-mono text-ink-muted">Loading active investigations...</div>
          ) : alerts.length > 0 ? (
            alerts.slice(0, 5).map((alt) => (
              <div
                key={alt.id}
                onClick={() => navigate(`/transactions/${alt.transaction_id}`)}
                className="py-3.5 group cursor-pointer flex flex-col sm:flex-row sm:items-baseline justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-3">
                    <RiskBadge level={alt.severity} score={alt.risk_score} size="sm" />
                    <span className="font-mono text-xs font-semibold text-ink group-hover:underline">
                      {alt.transaction_id}
                    </span>
                    <span className="text-[11px] text-ink-muted font-mono">
                      Customer {alt.customer_id} • Terminal {alt.terminal_id}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-normal">
                    {alt.primary_reason}
                  </p>
                </div>

                <div className="text-right shrink-0 font-mono text-xs">
                  <span className="font-bold text-ink">${alt.amount.toFixed(2)}</span>
                  <span className="text-ink-muted text-[11px] ml-3">{alt.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-xs font-mono text-ink-muted">No active investigations in this period.</div>
          )}
        </div>
      </div>

      {/* 5. Evaluate Transaction */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-surface-border pb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Evaluate transaction
          </h2>
          <span className="text-[11px] font-mono text-ink-muted">Online scoring pipeline</span>
        </div>

        <form onSubmit={handleQuickScore} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end font-mono text-xs">
          <div>
            <label className="block text-ink-muted text-[11px] mb-1">Customer ID</label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-none px-3 py-2 text-ink focus:border-ink outline-none"
              placeholder="1376"
            />
          </div>

          <div>
            <label className="block text-ink-muted text-[11px] mb-1">Terminal ID</label>
            <input
              type="text"
              value={terminalId}
              onChange={(e) => setTerminalId(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-none px-3 py-2 text-ink focus:border-ink outline-none"
              placeholder="8023"
            />
          </div>

          <div>
            <label className="block text-ink-muted text-[11px] mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-none px-3 py-2 text-ink focus:border-ink outline-none"
              placeholder="167.40"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-ink hover:bg-neutral-800 text-white font-medium py-2 px-4 rounded-none text-xs transition disabled:opacity-50"
            >
              {isProcessing ? 'Evaluating...' : 'Score transaction →'}
            </button>
          </div>
        </form>
      </div>

      {/* 6. Recent Transactions */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-surface-border pb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
            Recent transactions
          </h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-mono text-ink hover:underline flex items-center gap-1"
          >
            <span>View full stream</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
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
                  className="hover:bg-neutral-100/70 transition cursor-pointer"
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
                    <span className="text-ink hover:underline">Inspect →</span>
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
