import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching the selected filters or query criteria.',
  actionLabel,
  onAction,
  className = 'py-16',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center max-w-sm mx-auto ${className}`}>
      <div className="w-10 h-10 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5 text-ink-muted" />
      </div>
      <h3 className="text-sm font-semibold text-ink font-mono mb-1">{title}</h3>
      <p className="text-xs text-ink-secondary leading-relaxed font-sans mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-mono text-ink bg-surface border border-surface-border px-3 py-1.5 hover:border-ink transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
