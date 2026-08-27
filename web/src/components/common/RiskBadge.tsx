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

  let textClass = 'text-ink-secondary bg-neutral-100 border-neutral-200';
  let dotClass = 'bg-ink-muted';

  if (upper === 'CRITICAL' || upper === 'BLOCK' || upper === 'BLOCKED') {
    textClass = 'text-risk-critical bg-red-50/80 border-red-200/80 font-bold';
    dotClass = 'bg-risk-critical';
  } else if (upper === 'HIGH' || upper === 'CHALLENGE') {
    textClass = 'text-risk-high bg-orange-50/80 border-orange-200/80 font-semibold';
    dotClass = 'bg-risk-high';
  } else if (upper === 'MEDIUM' || upper === 'REVIEW') {
    textClass = 'text-risk-medium bg-amber-50/80 border-amber-200/80 font-medium';
    dotClass = 'bg-risk-medium';
  } else if (upper === 'LOW' || upper === 'APPROVE' || upper === 'APPROVED') {
    textClass = 'text-risk-low bg-emerald-50/80 border-emerald-200/80 font-medium';
    dotClass = 'bg-risk-low';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 border',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium border',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold border',
  };

  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-wider ${textClass} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span>{upper}</span>
      {score !== undefined && (
        <span className="opacity-70 text-[0.9em] font-normal ml-0.5">({score.toFixed(1)})</span>
      )}
    </span>
  );
};
