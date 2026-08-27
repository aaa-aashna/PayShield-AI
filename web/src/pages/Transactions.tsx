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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Live Feed
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Transactions stream
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Chronological payment authorizations evaluated across all 52 behavioral and graph features.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span>Stream source:</span>
            <span className="font-semibold text-ink bg-surface border border-surface-border px-2.5 py-1">
              1.75M Production Dataset
            </span>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-surface border border-surface-border font-mono text-xs">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search transaction ID, customer, terminal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background border border-surface-border pl-9 pr-3 py-1.5 text-ink focus:border-ink outline-none w-full text-xs"
            />
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-ink-muted uppercase text-[11px]">Risk filter:</span>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
              >
                <option value="ALL">All risk levels</option>
                <option value="CRITICAL">Critical only</option>
                <option value="HIGH">High only</option>
                <option value="MEDIUM">Medium only</option>
                <option value="LOW">Low only</option>
              </select>
            </div>

            <button
              onClick={fetchTransactions}
              className="p-1.5 bg-background border border-surface-border text-ink-secondary hover:text-ink hover:border-ink transition"
              title="Refresh stream"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Transaction Stream Table */}
      <div className="overflow-x-auto bg-surface border border-surface-border">
        {loading ? (
          <LoadingState message="Loading payment transaction stream..." className="py-16" />
        ) : transactions.length > 0 ? (
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
              <tr>
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Terminal</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Fraud probability</th>
                <th className="py-3 px-3 text-center">Anomaly score</th>
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
                  className="hover:bg-neutral-50 transition cursor-pointer"
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
                    <span className="text-ink hover:underline font-semibold">Inspect →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No Transactions Found"
            description="No transactions matched the search query or risk filter."
            actionLabel="Clear search & filters"
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
