import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  AlertTriangle,
  Network,
  Swords,
  BrainCircuit,
  ActivitySquare,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-colors ${
      isActive
        ? 'text-white font-semibold bg-surface-elevated'
        : 'text-slate-400 hover:text-slate-200 hover:bg-surface/50'
    }`;

  return (
    <aside className="w-52 border-r border-surface-border bg-background flex flex-col shrink-0 min-h-[calc(100vh-3rem)] select-none">
      <div className="p-4 space-y-6 flex-1">
        <div>
          <NavLink to="/" className={linkClasses} end>
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
            <span>Overview</span>
          </NavLink>
        </div>

        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono font-medium tracking-wider text-slate-500 uppercase">
            Investigate
          </div>
          <NavLink to="/alerts" className={linkClasses}>
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/transactions" className={linkClasses}>
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>Transactions</span>
          </NavLink>
        </div>

        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono font-medium tracking-wider text-slate-500 uppercase">
            Intelligence
          </div>
          <NavLink to="/risk-graph" className={linkClasses}>
            <Network className="w-3.5 h-3.5 text-slate-400" />
            <span>Risk Graph</span>
          </NavLink>
          <NavLink to="/model" className={linkClasses}>
            <BrainCircuit className="w-3.5 h-3.5 text-slate-400" />
            <span>Models</span>
          </NavLink>
          <NavLink to="/monitoring" className={linkClasses}>
            <ActivitySquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Monitoring</span>
          </NavLink>
        </div>

        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono font-medium tracking-wider text-slate-500 uppercase">
            Simulation
          </div>
          <NavLink to="/attack-lab" className={linkClasses}>
            <Swords className="w-3.5 h-3.5 text-slate-400" />
            <span>Attack Lab</span>
          </NavLink>
        </div>
      </div>

      <div className="p-4 border-t border-surface-border text-[11px] text-slate-500 font-mono">
        <div>PayShield Intelligence</div>
        <div className="text-[10px] text-slate-600">Production Build</div>
      </div>
    </aside>
  );
};
