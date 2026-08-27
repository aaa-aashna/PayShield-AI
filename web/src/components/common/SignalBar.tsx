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

  let barColor = 'bg-ink';
  if (clamped >= 80) barColor = 'bg-risk-critical';
  else if (clamped >= 60) barColor = 'bg-risk-high';

  const displayVal = isPercentage
    ? `${clamped.toFixed(1)}%`
    : value <= 1.0
    ? value.toFixed(3)
    : value.toFixed(1);

  return (
    <div className="py-2.5 border-b border-surface-border space-y-1.5">
      <div className="flex justify-between items-baseline text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink font-medium">{label}</span>
          {weight && <span className="text-[10px] text-ink-muted font-mono">({weight})</span>}
        </div>
        <span className="font-mono text-ink font-semibold">{displayVal}</span>
      </div>

      <div className="h-0.5 w-full bg-neutral-200 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {description && <p className="text-[11px] text-ink-secondary leading-normal">{description}</p>}
    </div>
  );
};
