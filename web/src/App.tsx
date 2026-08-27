import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/common/Header';
import { CommandCenter } from './pages/CommandCenter';
import { Transactions } from './pages/Transactions';
import { TransactionForensics } from './pages/TransactionForensics';
import { Alerts } from './pages/Alerts';
import { RiskGraph } from './pages/RiskGraph';
import { AttackLab } from './pages/AttackLab';
import { ModelIntelligence } from './pages/ModelIntelligence';
import { Monitoring } from './pages/Monitoring';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-ink flex flex-col font-sans selection:bg-neutral-200">
        <Header />
        <main className="flex-1 w-full pb-16">
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionForensics />} />
            <Route path="/risk-graph" element={<RiskGraph />} />
            <Route path="/attack-lab" element={<AttackLab />} />
            <Route path="/model" element={<ModelIntelligence />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};
