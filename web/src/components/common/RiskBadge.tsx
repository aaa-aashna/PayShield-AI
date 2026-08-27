import React from 'react';
import { RiskLevel, DecisionAction } from '../../types';

interface RiskBadgeProps {
  level?: RiskLevel | string;
  decision?: DecisionAction | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, decision, score, size = 'sm' }) => {
  const badgeType = level || decision || 'LOW';
  const upper = badgeType.toUpperCase();

  let textClass = 'text-slate-700 bg-slate-100 border-slate-200';
  let dotClass = 'bg-slate-500';

  if (upper === 'CRITICAL' || upper === 'BLOCK' || upper === 'BLOCKED') {
    textClass = 'text-red-700 bg-red-50 border-red-200 font-semibold';
    dotClass = 'bg-red-600';
  } else if (upper === 'HIGH' || upper === 'CHALLENGE') {
    textClass = 'text-orange-700 bg-orange-50 border-orange-200 font-semibold';
    dotClass = 'bg-orange-600';
  } else if (upper === 'MEDIUM' || upper === 'REVIEW') {
    textClass = 'text-amber-700 bg-amber-50 border-amber-200 font-medium';
    dotClass = 'bg-amber-600';
  } else if (upper === 'LOW' || upper === 'APPROVE' || upper === 'APPROVED') {
    textClass = 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium';
    dotClass = 'bg-emerald-600';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 rounded border',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-md font-medium border',
    lg: 'text-sm px-3 py-1.5 gap-2 rounded-md font-semibold border',
  };

  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-wider ${textClass} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span>{upper}</span>
      {score !== undefined && (
        <span className="opacity-75 text-[0.9em] font-normal ml-0.5">({score.toFixed(1)})</span>
      )}
    </span>
  );
};
