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
import { ShieldAlert, Play, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Adversarial Testing
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Red Team attack simulation
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Controlled adversary scenarios evaluating model defenses, velocity barriers, and adaptive escalation.
            </p>
          </div>

          <button
            onClick={handleLaunchAttack}
            disabled={isSimulating}
            className="bg-ink hover:bg-neutral-800 text-white font-medium px-5 py-2.5 text-xs font-mono transition disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Executing scenario...' : 'Execute attack sequence →'}</span>
          </button>
        </div>
      </div>

      {/* 2. Scenario Selection Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
          Select attack vector
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc) => {
            const isSelected = attackType.toLowerCase() === sc.name.toLowerCase();
            return (
              <div
                key={sc.name}
                onClick={() => setAttackType(sc.name)}
                className={`p-3.5 border transition cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'border-ink bg-neutral-100 shadow-sm'
                    : 'border-surface-border bg-surface hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ink">
                    {sc.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-ink" />
                  )}
                </div>
                <p className="text-[11px] text-ink-secondary leading-snug font-sans">
                  {sc.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-surface border border-surface-border font-mono text-xs">
        <div>
          <label className="block text-ink-muted text-[11px] mb-1">Attack intensity: {intensity.toFixed(1)}</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-ink"
          />
        </div>

        <div>
          <label className="block text-ink-muted text-[11px] mb-1">Transaction count</label>
          <input
            type="number"
            min="2"
            max="10"
            value={txCount}
            onChange={(e) => setTxCount(Number(e.target.value))}
            className="w-full bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
          />
        </div>

        <div>
          <label className="block text-ink-muted text-[11px] mb-1">Target customer ID</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
          />
        </div>

        <div>
          <label className="block text-ink-muted text-[11px] mb-1">Target terminal ID</label>
          <input
            type="text"
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            className="w-full bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
          />
        </div>
      </div>

      {/* 4. Results & Escalation Response */}
      {simResult && (
        <div className="space-y-6 pt-4 border-t border-surface-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-3.5 bg-surface border border-surface-border">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Defense outcome</div>
              <div className="text-2xl font-bold text-risk-critical mt-0.5">
                {simResult.detected ? 'DETECTED' : 'EVADED'}
              </div>
              <div className="text-[11px] text-ink-secondary">Caught at Step #{simResult.detection_step || 1}</div>
            </div>

            <div className="p-3.5 bg-surface border border-surface-border">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Enforced mitigation</div>
              <div className="text-2xl font-bold text-ink mt-0.5">
                {simResult.blocked ? 'HARD BLOCK' : 'MFA CHALLENGE'}
              </div>
              <div className="text-[11px] text-ink-secondary">Automated action</div>
            </div>

            <div className="p-3.5 bg-surface border border-surface-border">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Peak risk score</div>
              <div className="text-2xl font-bold text-ink mt-0.5">
                {simResult.max_risk_score.toFixed(1)} <span className="text-xs text-ink-muted font-normal">/ 100</span>
              </div>
              <div className="text-[11px] text-ink-secondary">Adaptive peak</div>
            </div>

            <div className="p-3.5 bg-surface border border-surface-border">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Alerts generated</div>
              <div className="text-2xl font-bold text-ink mt-0.5">
                {simResult.alerts_count} <span className="text-xs text-ink-muted font-normal">/ {simResult.total_transactions} txs</span>
              </div>
              <div className="text-[11px] text-ink-secondary">Security events</div>
            </div>
          </div>

          {/* Risk Progression Chart */}
          <div className="space-y-3 bg-surface border border-surface-border p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                Risk progression curve (Steps $T_1 \to T_n$)
              </h2>
              <span className="text-[11px] font-mono text-risk-critical">Block Threshold: 80.0</span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f0f0ed" vertical={false} />
                  <XAxis dataKey="step" stroke="#8e99a8" fontSize={10} fontStyle="JetBrains Mono" />
                  <YAxis stroke="#8e99a8" domain={[0, 100]} fontSize={10} fontStyle="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e6e6e2',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <ReferenceLine y={80} stroke="#b91c1c" strokeDasharray="3 3" strokeWidth={1} />
                  <Line type="monotone" dataKey="risk_score" stroke="#b91c1c" strokeWidth={2} dot={{ r: 3.5, fill: '#b91c1c' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Execution Log Table */}
          <div className="overflow-x-auto bg-surface border border-surface-border">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border bg-background">
                <tr>
                  <th className="py-2.5 px-3">Step</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Fraud prob</th>
                  <th className="py-2.5 px-3 text-center">Anomaly</th>
                  <th className="py-2.5 px-3 text-center">Risk score</th>
                  <th className="py-2.5 px-3">Risk level</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3 text-right">Adaptive status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-[11px]">
                {simResult.step_logs.map((step) => (
                  <tr key={step.step_number} className="hover:bg-neutral-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-ink-muted">#{step.step_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-ink">{step.transaction_id}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-ink">${step.tx_amount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-ink-secondary">{(step.fraud_probability * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-center text-ink-secondary">{step.anomaly_score.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-risk-critical">{step.risk_score.toFixed(1)}</td>
                    <td className="py-2.5 px-3">
                      <RiskBadge level={step.risk_level} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <RiskBadge decision={step.decision} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right text-risk-high font-semibold">
                      {step.is_escalated ? '⚡ Escalated' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
