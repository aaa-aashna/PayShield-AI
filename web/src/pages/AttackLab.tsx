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
import { RiskBadge } from '../components/common/RiskBadge';
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
    { name: 'Transaction burst', desc: 'High-frequency transaction velocity bursts.' },
    { name: 'Amount escalation', desc: 'Exponential jumps in transaction ticket values.' },
    { name: 'Terminal hopping', desc: 'Rapid movement across distinct merchant terminals.' },
    { name: 'Behavioral shift', desc: 'Off-hours departure with extreme ticket sizes.' },
    { name: 'Coordinated attack', desc: 'Synchronized botnet accounts targeting one terminal.' },
    { name: 'Slow and low', desc: 'Stealth micro-transactions spaced over long intervals.' },
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
      step: `T${s.step_number}`,
      risk_score: s.risk_score,
      fraud_prob: s.fraud_probability * 100,
      amount: s.tx_amount,
    })) || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Simulation
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">
              Attack lab
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Controlled security experiments testing model defense and adaptive escalation.
            </p>
          </div>

          <button
            onClick={handleLaunchAttack}
            disabled={isSimulating}
            className="bg-ink hover:bg-neutral-800 text-white font-medium px-5 py-2 rounded-none text-xs font-mono transition disabled:opacity-50"
          >
            {isSimulating ? 'Executing experiment...' : 'Run experiment →'}
          </button>
        </div>
      </div>

      {/* 2. Scenarios */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
          Select scenario
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {scenarios.map((sc) => {
            const isSelected = attackType.toLowerCase() === sc.name.toLowerCase();
            return (
              <div
                key={sc.name}
                onClick={() => setAttackType(sc.name)}
                className={`p-3 border transition cursor-pointer space-y-1 ${
                  isSelected
                    ? 'border-ink bg-neutral-200/60'
                    : 'border-surface-border bg-surface hover:bg-neutral-100'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-ink">
                  {sc.name}
                </div>
                <p className="text-[11px] text-ink-secondary leading-tight line-clamp-2">
                  {sc.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4 border-t border-surface-border font-mono text-xs">
        <div>
          <label className="block text-ink-muted mb-1">Intensity ({intensity.toFixed(1)})</label>
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
          <label className="block text-ink-muted mb-1">Sequence count</label>
          <input
            type="number"
            min="2"
            max="10"
            value={txCount}
            onChange={(e) => setTxCount(Number(e.target.value))}
            className="w-full bg-surface border border-surface-border rounded-none px-3 py-1.5 text-ink focus:border-ink outline-none"
          />
        </div>

        <div>
          <label className="block text-ink-muted mb-1">Customer target</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-none px-3 py-1.5 text-ink focus:border-ink outline-none"
          />
        </div>

        <div>
          <label className="block text-ink-muted mb-1">Terminal target</label>
          <input
            type="text"
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-none px-3 py-1.5 text-ink focus:border-ink outline-none"
          />
        </div>
      </div>

      {/* 4. Results */}
      {simResult && (
        <div className="space-y-8 pt-4 border-t border-surface-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Outcome</div>
              <div className="text-2xl font-bold text-risk-critical mt-0.5">
                {simResult.detected ? 'DETECTED' : 'EVADED'}
              </div>
              <div className="text-xs text-ink-secondary">Step #{simResult.detection_step || 1}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Mitigation</div>
              <div className="text-2xl font-bold text-ink mt-0.5">
                {simResult.blocked ? 'BLOCK' : 'CHALLENGE'}
              </div>
              <div className="text-xs text-ink-secondary">Autonomous policy</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Peak risk</div>
              <div className="text-2xl font-bold text-ink mt-0.5">
                {simResult.max_risk_score.toFixed(1)} <span className="text-xs text-ink-muted">/ 100</span>
              </div>
              <div className="text-xs text-ink-secondary">Adaptive maxima</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">Threat alerts</div>
              <div className="text-2xl font-bold text-ink mt-0.5">
                {simResult.alerts_count} <span className="text-xs text-ink-muted">/ {simResult.total_transactions}</span>
              </div>
              <div className="text-xs text-ink-secondary">Emitted in run</div>
            </div>
          </div>

          {/* Trajectory */}
          <div className="space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Risk progression curve ($T_1 \to T_n$)
            </h2>

            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e2" vertical={false} />
                  <XAxis dataKey="step" stroke="#8e99a8" fontSize={10} fontStyle="JetBrains Mono" />
                  <YAxis stroke="#8e99a8" domain={[0, 100]} fontSize={10} fontStyle="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6e6e2', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  />
                  <ReferenceLine y={80} stroke="#b91c1c" strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="risk_score" stroke="#b91c1c" strokeWidth={1.5} dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] uppercase text-ink-muted border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Step</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Fraud probability</th>
                  <th className="py-2.5 px-3 text-center">Anomaly</th>
                  <th className="py-2.5 px-3 text-center">Risk score</th>
                  <th className="py-2.5 px-3">Risk level</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3 text-right">Adaptive escalation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-[11px]">
                {simResult.step_logs.map((step) => (
                  <tr key={step.step_number} className="hover:bg-neutral-100/70 transition">
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
