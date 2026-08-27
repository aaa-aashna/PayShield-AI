import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Menu, X, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Overview', end: true },
    { to: '/transactions', label: 'Transactions' },
    { to: '/alerts', label: 'Alerts & Triage' },
    { to: '/risk-graph', label: 'Risk Graph' },
    { to: '/attack-lab', label: 'Attack Lab' },
    { to: '/model', label: 'Models & Validation' },
    { to: '/monitoring', label: 'Monitoring' },
  ];

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-xs font-medium transition-colors py-1.5 px-3 rounded-md flex items-center gap-1.5 ${
      isActive
        ? 'text-ink font-semibold bg-surface shadow-subtle border border-surface-border'
        : 'text-ink-secondary hover:text-ink hover:bg-slate-200/50'
    }`;

  const mobileLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block text-xs font-medium py-2.5 px-3 rounded-md transition-colors ${
      isActive
        ? 'text-ink font-bold bg-surface shadow-subtle border border-surface-border'
        : 'text-ink-secondary hover:text-ink hover:bg-slate-100'
    }`;

  return (
    <header className="border-b border-surface-border bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Organization Title */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center text-white shadow-subtle">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-ink font-sans">
              PayShield
            </span>
          </NavLink>

          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-ink-muted bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            Fraud Ops
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/70">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClasses}
              end={item.end}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Status Badge */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-secondary bg-slate-50 border border-surface-border px-2.5 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse shrink-0" />
            <span className="font-medium text-ink">Active Stream</span>
            <span className="text-ink-muted">· 1.75M Txs</span>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-ink-secondary hover:text-ink rounded-md border border-surface-border bg-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-slate-50 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-secondary py-1.5 mb-2 border-b border-surface-border">
            <span className="w-2 h-2 rounded-full bg-risk-low shrink-0" />
            <span>Active Stream Engine · 1.75M Transactions</span>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClasses}
              end={item.end}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};
