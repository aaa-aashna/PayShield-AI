import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, RefreshCw } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Streaming Transaction Log
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Real-time chronological payment stream evaluated across 52 behavioral and graph features.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span>Dataset stream:</span>
          <span className="font-semibold text-ink bg-white border border-surface-border px-3 py-1.5 rounded-md shadow-subtle">
            1.75M Transaction Stream
          </span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-surface-border rounded-lg shadow-subtle font-mono text-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search transaction ID, customer, terminal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-surface-border rounded pl-9 pr-3 py-2 text-ink focus:border-brand outline-none w-full text-xs"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase font-semibold text-[11px]">Risk Filter:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-slate-50 border border-surface-border rounded px-3 py-2 text-ink focus:border-brand outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>

          <button
            onClick={fetchTransactions}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-surface-border text-ink-secondary hover:text-ink rounded transition"
            title="Refresh stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Transaction Stream Table */}
      <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
        {loading ? (
          <LoadingState message="Loading payment transactions stream..." className="py-16" />
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3.5">Transaction ID</th>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5">Terminal</th>
                  <th className="py-3 px-3.5 text-right">Amount</th>
                  <th className="py-3 px-3.5 text-center">Fraud Probability</th>
                  <th className="py-3 px-3.5 text-center">Anomaly Score</th>
                  <th className="py-3 px-3.5">Risk Level</th>
                  <th className="py-3 px-3.5">Decision</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {transactions.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    onClick={() => navigate(`/transactions/${tx.transaction_id}`)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3.5 font-bold text-ink">{tx.transaction_id}</td>
                    <td className="py-3.5 px-3.5 text-ink-secondary">
                      {new Date(tx.tx_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3.5 text-ink-secondary">{tx.customer_id}</td>
                    <td className="py-3.5 px-3.5 text-ink-muted">{tx.terminal_id}</td>
                    <td className="py-3.5 px-3.5 text-right font-bold text-ink font-numeric">
                      ${tx.tx_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">
                      {(tx.fraud_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">
                      {tx.anomaly_score.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                    </td>
                    <td className="py-3.5 px-3.5">
                      <RiskBadge decision={tx.decision} size="sm" />
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <span className="text-brand hover:underline font-sans font-medium">Inspect →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No Transactions Found"
            description="No transactions match the search query or risk filter."
            actionLabel="Clear filters"
            onAction={() => {
              setSearchTerm('');
              setFilterLevel('ALL');
            }}
            className="py-16"
          />
        )}
      </div>
    </div>
  );
};
