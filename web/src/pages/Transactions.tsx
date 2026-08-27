import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { api } from '../services/api';
import { TransactionRecord } from '../types';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions(50, filterLevel, searchTerm);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Activity
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">
              Transactions
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Chronological payment stream evaluated through the multi-tier model pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search ID, customer, terminal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface border border-surface-border rounded-none pl-8 pr-3 py-1.5 text-ink focus:border-ink outline-none w-52"
              />
            </form>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-surface border border-surface-border rounded-none px-3 py-1.5 text-ink focus:border-ink outline-none"
            >
              <option value="ALL">All levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stream Table */}
      <div className="overflow-x-auto border-t border-surface-border pt-2">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-ink-muted">Loading transactions...</div>
        ) : transactions.length > 0 ? (
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
              <tr>
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Terminal</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Fraud probability</th>
                <th className="py-3 px-3 text-center">Anomaly</th>
                <th className="py-3 px-3">Risk level</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-[11px]">
              {transactions.map((tx) => (
                <tr
                  key={tx.transaction_id}
                  onClick={() => navigate(`/transactions/${tx.transaction_id}`)}
                  className="hover:bg-neutral-100/70 transition cursor-pointer"
                >
                  <td className="py-3 px-3 font-semibold text-ink">{tx.transaction_id}</td>
                  <td className="py-3 px-3 text-ink-secondary">
                    {new Date(tx.tx_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-ink-secondary">{tx.customer_id}</td>
                  <td className="py-3 px-3 text-ink-muted">{tx.terminal_id}</td>
                  <td className="py-3 px-3 text-right font-bold text-ink">
                    ${tx.tx_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center text-ink-secondary">
                    {(tx.fraud_probability * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-center text-ink-secondary">
                    {tx.anomaly_score.toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <RiskBadge decision={tx.decision} size="sm" />
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
            No transactions found matching filter.
          </div>
        )}
      </div>
    </div>
  );
};
