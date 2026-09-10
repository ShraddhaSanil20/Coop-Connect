import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppHeader } from './components/common/AppHeader';
import { AuthModal } from './components/common/AuthModal';
import { SettingsModal } from './components/common/SettingsModal';
import { CustomerView } from './pages/CustomerView';
import { WorkerView } from './pages/WorkerView';
import { CooperativeView } from './pages/CooperativeView';
import { ShieldCheck, HeartHandshake, Scale } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-coop-bg text-coop-charcoal font-sans flex flex-col justify-between">
      <div>
        <AppHeader />
        <main>
          {role === 'CUSTOMER' && <CustomerView />}
          {role === 'WORKER' && <WorkerView />}
          {role === 'COOP_ADMIN' && <CooperativeView />}
        </main>
        <AuthModal />
        <SettingsModal />
      </div>

      {/* Platform Transparency & Social Impact Footer */}
      <footer className="bg-white border-t border-coop-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-6 text-xs text-coop-charcoal-light">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-coop-forest text-white flex items-center justify-center font-bold">
              CC
            </div>
            <div>
              <div className="font-bold text-coop-forest">COOP CONNECT PLATFORM</div>
              <div>Worker-Owned Digital Service Marketplace Protocol</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <span className="flex items-center gap-1 text-coop-forest">
              <Scale className="w-4 h-4 text-coop-saffron" /> FairDispatch Engine
            </span>
            <span className="flex items-center gap-1 text-coop-forest">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 85% Direct Worker Payout
            </span>
            <span className="flex items-center gap-1 text-coop-forest">
              <HeartHandshake className="w-4 h-4 text-rose-500" /> 5% Autonomous Welfare Vault
            </span>
          </div>

          <div className="text-right text-[11px]">
            © {new Date().getFullYear()} Worker Cooperative Federation. Open Governance Standard.
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
