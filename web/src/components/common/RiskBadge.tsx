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

  let textClass = 'text-ink-secondary';
  let dotClass = 'bg-ink-muted';

  if (upper === 'CRITICAL' || upper === 'BLOCK' || upper === 'BLOCKED') {
    textClass = 'text-risk-critical font-bold';
    dotClass = 'bg-risk-critical';
  } else if (upper === 'HIGH' || upper === 'CHALLENGE') {
    textClass = 'text-risk-high font-semibold';
    dotClass = 'bg-risk-high';
  } else if (upper === 'MEDIUM' || upper === 'REVIEW') {
    textClass = 'text-risk-medium font-medium';
    dotClass = 'bg-risk-medium';
  } else if (upper === 'LOW' || upper === 'APPROVE' || upper === 'APPROVED') {
    textClass = 'text-risk-low font-medium';
    dotClass = 'bg-risk-low';
  }

  const sizeClasses = {
    sm: 'text-[11px] gap-1.5',
    md: 'text-xs gap-1.5 font-medium',
    lg: 'text-sm gap-2 font-semibold',
  };

  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-wider ${textClass} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span>{upper}</span>
      {score !== undefined && (
        <span className="text-ink-muted text-[0.9em] font-normal">({score.toFixed(1)})</span>
      )}
    </span>
  );
};
