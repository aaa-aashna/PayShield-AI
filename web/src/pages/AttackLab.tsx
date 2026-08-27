import React, { useState } from 'react';
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
import { Play, ShieldAlert, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingState } from '../components/common/LoadingState';
import { api } from '../services/api';
import { AttackSimulationResult } from '../types';

export const AttackLab: React.FC = () => {
  const [attackType, setAttackType] = useState('Transaction Burst');
  const [intensity, setIntensity] = useState(0.8);
  const [txCount, setTxCount] = useState(5);
  const [customerId, setCustomerId] = useState('1376');
  const [terminalId, setTerminalId] = useState('8023');

  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<AttackSimulationResult | null>(null);

  const scenarios = [
    { name: 'Transaction burst', desc: 'High-frequency card velocity bursts across rapid time windows.' },
    { name: 'Amount escalation', desc: 'Exponential ticket size growth ($50 → $200 → $800 → $3,200).' },
    { name: 'Terminal hopping', desc: 'Card distribution across multiple geographically distinct terminals.' },
    { name: 'Behavioral shift', desc: 'Unprecedented off-hours authorization with unusual ticket size.' },
    { name: 'Coordinated attack', desc: 'Distributed botnet accounts simultaneously hitting one terminal.' },
    { name: 'Slow and low', desc: 'Stealth micro-transactions designed to stay below rule thresholds.' },
  ];

  const handleLaunchAttack = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateAttack({
        attack_type: attackType,
        intensity: intensity,
        customer_id: customerId,
        terminal_id: terminalId,
        num_transactions: txCount,
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const chartData =
    simResult?.step_logs.map((s) => ({
      step: `Step #${s.step_number}`,
      risk_score: s.risk_score,
      fraud_prob: s.fraud_probability * 100,
      amount: s.tx_amount,
    })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Adversarial Attack Simulation Lab
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Controlled red-team simulation console evaluating model defenses, velocity barriers, and adaptive escalation.
          </p>
        </div>

        <button
          onClick={handleLaunchAttack}
          disabled={isSimulating}
          className="bg-ink hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-md text-xs font-mono transition disabled:opacity-50 flex items-center gap-2 shadow-subtle"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isSimulating ? 'Executing Scenario...' : 'Execute Attack Scenario →'}</span>
        </button>
      </div>

      {/* 2. Scenario Selection Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">
          Select Adversary Scenario
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc) => {
            const isSelected = attackType.toLowerCase() === sc.name.toLowerCase();
            return (
              <div
                key={sc.name}
                onClick={() => setAttackType(sc.name)}
                className={`p-4 rounded-lg border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-brand bg-sky-50/50 shadow-subtle ring-1 ring-brand/30'
                    : 'border-surface-border bg-white hover:bg-slate-50 shadow-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ink">
                    {sc.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  )}
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                  {sc.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-white border border-surface-border rounded-lg shadow-subtle font-mono text-xs">
        <div>
          <label className="block text-ink-muted text-[11px] font-semibold mb-1">Attack Intensity: {intensity.toFixed(1)}</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-brand"
          />
        </div>

        <div>
          <label className="block text-ink-muted text-[11px] font-semibold mb-1">Transaction Count</label>
          <input
            type="number"
            min="2"
            max="10"
            value={txCount}
            onChange={(e) => setTxCount(Number(e.target.value))}
            className="w-full bg-slate-50 border border-surface-border rounded px-3 py-2 text-ink focus:border-brand outline-none"
          />
        </div>

        <div>
          <label className="block text-ink-muted text-[11px] font-semibold mb-1">Target Customer ID</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded px-3 py-2 text-ink focus:border-brand outline-none"
          />
        </div>

        <div>
          <label className="block text-ink-muted text-[11px] font-semibold mb-1">Target Terminal ID</label>
          <input
            type="text"
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            className="w-full bg-slate-50 border border-surface-border rounded px-3 py-2 text-ink focus:border-brand outline-none"
          />
        </div>
      </div>

      {/* 4. Results & Escalation Response */}
      {simResult && (
        <div className="space-y-6 pt-4 border-t border-surface-border">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Defense Outcome</div>
              <div className="text-2xl font-bold text-risk-critical mt-1">
                {simResult.detected ? 'DETECTED' : 'EVADED'}
              </div>
              <div className="text-xs text-ink-secondary">Caught at Step #{simResult.detection_step || 1}</div>
            </div>

            <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Enforced Mitigation</div>
              <div className="text-2xl font-bold text-ink mt-1">
                {simResult.blocked ? 'HARD BLOCK' : 'MFA CHALLENGE'}
              </div>
              <div className="text-xs text-ink-secondary">Automated policy execution</div>
            </div>

            <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Peak Risk Score</div>
              <div className="text-2xl font-bold text-ink mt-1 font-numeric">
                {simResult.max_risk_score.toFixed(1)} <span className="text-xs text-ink-muted font-normal">/ 100</span>
              </div>
              <div className="text-xs text-ink-secondary">Adaptive maxima reached</div>
            </div>

            <div className="bg-white border border-surface-border p-4 rounded-lg shadow-subtle">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Security Alerts</div>
              <div className="text-2xl font-bold text-ink mt-1 font-numeric">
                {simResult.alerts_count} <span className="text-xs text-ink-muted font-normal">/ {simResult.total_transactions} txs</span>
              </div>
              <div className="text-xs text-ink-secondary">Triage incidents emitted</div>
            </div>
          </div>

          {/* Risk Progression Chart */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Risk Progression Curve (Steps $T_1 \to T_n$)
                </h2>
                <p className="text-xs text-ink-secondary">
                  Real-time risk score escalation across sequential adversary transactions.
                </p>
              </div>
              <span className="text-xs font-mono text-red-600 font-semibold">Block Threshold: 80.0</span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="step" stroke="#94a3b8" fontSize={11} fontStyle="JetBrains Mono" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={11} fontStyle="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono',
                      borderRadius: '6px',
                    }}
                  />
                  <ReferenceLine y={80} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="risk_score" stroke="#dc2626" strokeWidth={2} dot={{ r: 4, fill: '#dc2626' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Execution Log Table */}
          <div className="bg-white border border-surface-border rounded-lg shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[11px] uppercase tracking-wider text-ink-muted bg-slate-50 border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-3.5">Step</th>
                    <th className="py-3 px-3.5">Transaction ID</th>
                    <th className="py-3 px-3.5 text-right">Amount</th>
                    <th className="py-3 px-3.5 text-center">Fraud Prob</th>
                    <th className="py-3 px-3.5 text-center">Anomaly</th>
                    <th className="py-3 px-3.5 text-center">Risk Score</th>
                    <th className="py-3 px-3.5">Risk Level</th>
                    <th className="py-3 px-3.5">Decision</th>
                    <th className="py-3 px-3.5 text-right">Adaptive Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs">
                  {simResult.step_logs.map((step) => (
                    <tr key={step.step_number} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-3.5 font-bold text-ink-muted">#{step.step_number}</td>
                      <td className="py-3.5 px-3.5 font-bold text-ink">{step.transaction_id}</td>
                      <td className="py-3.5 px-3.5 text-right font-bold text-ink font-numeric">${step.tx_amount.toFixed(2)}</td>
                      <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">{(step.fraud_probability * 100).toFixed(1)}%</td>
                      <td className="py-3.5 px-3.5 text-center text-ink-secondary font-numeric">{step.anomaly_score.toFixed(2)}</td>
                      <td className="py-3.5 px-3.5 text-center font-bold text-red-600 font-numeric">{step.risk_score.toFixed(1)}</td>
                      <td className="py-3.5 px-3.5">
                        <RiskBadge level={step.risk_level} size="sm" />
                      </td>
                      <td className="py-3.5 px-3.5">
                        <RiskBadge decision={step.decision} size="sm" />
                      </td>
                      <td className="py-3.5 px-3.5 text-right text-orange-700 font-bold">
                        {step.is_escalated ? '⚡ Escalated' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
