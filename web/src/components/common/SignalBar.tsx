import React from 'react';

interface SignalBarProps {
  label: string;
  value: number;
  isPercentage?: boolean;
  weight?: string;
  description?: string;
}

export const SignalBar: React.FC<SignalBarProps> = ({
  label,
  value,
  isPercentage = false,
  weight,
  description,
}) => {
  const normalized = value <= 1.0 ? value * 100 : value;
  const clamped = Math.min(100, Math.max(0, normalized));

  let barColor = 'bg-slate-800';
  if (clamped >= 80) barColor = 'bg-red-600';
  else if (clamped >= 60) barColor = 'bg-orange-500';
  else if (clamped >= 40) barColor = 'bg-amber-500';
  else barColor = 'bg-emerald-600';

  const displayVal = isPercentage
    ? `${clamped.toFixed(1)}%`
    : value <= 1.0
    ? value.toFixed(3)
    : value.toFixed(1);

  return (
    <div className="py-2.5 border-b border-surface-border last:border-b-0 space-y-1.5">
      <div className="flex justify-between items-baseline text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink font-medium">{label}</span>
          {weight && <span className="text-[10px] text-ink-muted font-mono">({weight})</span>}
        </div>
        <span className="font-mono text-ink font-semibold">{displayVal}</span>
      </div>

      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {description && <p className="text-[11px] text-ink-secondary leading-snug">{description}</p>}
    </div>
  );
};
