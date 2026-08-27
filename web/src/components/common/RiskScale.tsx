import React from 'react';
import { RiskLevel } from '../../types';

interface RiskScaleProps {
  score: number;
  level: RiskLevel;
}

export const RiskScale: React.FC<RiskScaleProps> = ({ score, level }) => {
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <div className="w-full space-y-2 py-1">
      {/* Risk Segmented Line */}
      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
        <div className="w-[30%] bg-emerald-500/70" />
        <div className="w-[30%] bg-amber-500/70" />
        <div className="w-[20%] bg-orange-500/80" />
        <div className="w-[20%] bg-red-600/90" />
      </div>

      <div className="relative w-full h-2">
        <div
          className="absolute -top-3 w-2 h-4 bg-ink rounded-sm -translate-x-1/2 shadow-subtle border border-white"
          style={{ left: `${clamped}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted pt-0.5">
        <span>0 (LOW)</span>
        <span>30 (MEDIUM)</span>
        <span>60 (HIGH)</span>
        <span>80 (CRITICAL BLOCK)</span>
        <span>100</span>
      </div>
    </div>
  );
};
