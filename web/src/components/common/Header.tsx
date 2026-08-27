import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-xs transition-colors py-1 ${
      isActive
        ? 'text-ink font-semibold border-b border-ink'
        : 'text-ink-secondary hover:text-ink'
    }`;

  return (
    <header className="border-b border-surface-border bg-background sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <NavLink to="/" className="font-bold text-sm tracking-tight text-ink uppercase">
            PayShield
          </NavLink>
          <span className="text-[11px] font-mono text-ink-muted hidden sm:inline">
            Payment Security
          </span>
        </div>

        <nav className="flex items-center gap-6 font-mono text-xs">
          <NavLink to="/" className={linkClasses} end>
            Overview
          </NavLink>
          <NavLink to="/alerts" className={linkClasses}>
            Investigations
          </NavLink>
          <NavLink to="/transactions" className={linkClasses}>
            Transactions
          </NavLink>
          <NavLink to="/risk-graph" className={linkClasses}>
            Graph
          </NavLink>
          <NavLink to="/attack-lab" className={linkClasses}>
            Attack lab
          </NavLink>
          <NavLink to="/model" className={linkClasses}>
            Models
          </NavLink>
          <NavLink to="/monitoring" className={linkClasses}>
            Monitoring
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
