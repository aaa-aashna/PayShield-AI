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
      <div className="relative h-1 w-full bg-neutral-200 rounded-none flex">
        <div className="w-[30%] bg-risk-low/60" />
        <div className="w-[30%] bg-risk-medium/60" />
        <div className="w-[20%] bg-risk-high/70" />
        <div className="w-[20%] bg-risk-critical/80" />

        {/* Position marker */}
        <div
          className="absolute -top-1 bottom-0 w-1.5 h-3 bg-ink -translate-x-1/2"
          style={{ left: `${clamped}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted">
        <span>0 (LOW)</span>
        <span>30 (MEDIUM)</span>
        <span>60 (HIGH)</span>
        <span>80 (CRITICAL)</span>
        <span>100</span>
      </div>
    </div>
  );
};
