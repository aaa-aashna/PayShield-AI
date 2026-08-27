import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-xs transition-colors py-1 px-1.5 rounded-sm ${
      isActive
        ? 'text-ink font-semibold border-b-2 border-ink'
        : 'text-ink-secondary hover:text-ink hover:bg-neutral-200/40'
    }`;

  const mobileLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block text-xs font-mono py-2 px-3 transition-colors ${
      isActive
        ? 'text-ink font-bold bg-neutral-200/50'
        : 'text-ink-secondary hover:text-ink hover:bg-neutral-100'
    }`;

  const navItems = [
    { to: '/', label: 'Overview', end: true },
    { to: '/alerts', label: 'Investigations' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/risk-graph', label: 'Graph' },
    { to: '/attack-lab', label: 'Attack lab' },
    { to: '/model', label: 'Models' },
    { to: '/monitoring', label: 'Monitoring' },
  ];

  return (
    <header className="border-b border-surface-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand & System Status */}
        <div className="flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="font-bold text-sm tracking-tight text-ink uppercase font-mono">
              PayShield
            </span>
          </NavLink>

          <div className="h-4 w-px bg-surface-border hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-ink-secondary bg-surface border border-surface-border px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse shrink-0" />
            <span>OPERATIONAL · STREAM ENGINE</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5 font-mono text-xs">
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

        {/* Mobile menu toggle button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-ink-secondary hover:text-ink border border-surface-border bg-surface"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border bg-background px-6 py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-secondary py-1 mb-2 border-b border-surface-border">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-low shrink-0" />
            <span>OPERATIONAL · 1.75M STREAM</span>
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
