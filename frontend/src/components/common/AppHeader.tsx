import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Shield, AlertTriangle, ChevronDown, Globe, LogOut, Settings, User, X, CheckCircle2, Lock } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, role, setRole, logout, setIsAuthModalOpen, setIsSettingsOpen, t } = useAuth();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close SOS Modal safely on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSosModalOpen(false);
        setSosSent(false);
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [sosIncidentData, setSosIncidentData] = useState<any>(null);

  const triggerSOS = async () => {
    setSosSending(true);
    let lat = 12.9716;
    let lng = 77.5946;

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn('Geolocation fallback to Bengaluru center:', err);
      }
    }

    try {
      const res = await fetch('/api/v1/safety/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lat,
          lng,
          note: 'EMERGENCY SOS BUTTON PRESSED FROM APP HEADER',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSosIncidentData(data);
        setSosSent(true);
      }
    } catch (err) {
      console.error('SOS failed:', err);
    } finally {
      setSosSending(false);
    }
  };

  const cancelSOS = async () => {
    if (!sosIncidentData?.incidentId) {
      closeSosSafely();
      return;
    }
    try {
      await fetch(`/api/v1/safety/sos/${sosIncidentData.incidentId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to cancel SOS:', err);
    } finally {
      closeSosSafely();
    }
  };

  const closeSosSafely = () => {
    setSosModalOpen(false);
    setSosSent(false);
    setSosIncidentData(null);
  };

  return (
    <>
      <header className="bg-white border-b border-coop-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coop-forest text-white flex items-center justify-center font-extrabold text-xl shadow-coop">
              CC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-coop-forest tracking-tight">
                  {t('appName')}
                </h1>
                <span className="bg-coop-sand text-coop-forest text-[10px] font-bold px-2 py-0.5 rounded-full border border-coop-border">
                  Worker-Owned
                </span>
              </div>
              <p className="text-[11px] text-coop-charcoal-light hidden sm:block">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex items-center bg-coop-sand/80 p-1 rounded-xl border border-coop-border">
            <button
              onClick={() => setRole('CUSTOMER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'CUSTOMER'
                  ? 'bg-coop-forest text-white shadow-sm'
                  : 'text-coop-charcoal hover:text-coop-forest'
              }`}
            >
              {t('roleCustomer')}
            </button>

            <button
              onClick={() => setRole('WORKER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'WORKER'
                  ? 'bg-coop-forest text-white shadow-sm'
                  : 'text-coop-charcoal hover:text-coop-forest'
              }`}
            >
              {t('roleWorker')}
            </button>

            <button
              onClick={() => setRole('COOP_ADMIN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'COOP_ADMIN'
                  ? 'bg-coop-forest text-white shadow-sm'
                  : 'text-coop-charcoal hover:text-coop-forest'
              }`}
            >
              {t('roleAdmin')}
            </button>
          </div>

          {/* User Profile, Settings & SOS Trigger */}
          <div className="flex items-center gap-2">
            {/* SOS Emergency Trigger */}
            <button
              onClick={() => setSosModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
              aria-label="SOS Emergency Alert"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('sosBtn')}</span>
            </button>

            {/* Language & Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all border border-stone-200"
              title="Settings & Language"
              aria-label="Open Settings"
            >
              <Globe className="w-4 h-4 text-emerald-700" />
            </button>

            {/* User Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-coop-bg hover:bg-stone-100 border border-coop-border px-2.5 py-1.5 rounded-xl transition-all"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-coop-border"
                  />
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-coop-forest line-clamp-1">{user.name}</div>
                    <div className="text-[10px] text-coop-charcoal-light font-semibold">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-2 text-stone-200 z-50 animate-in fade-in duration-150">
                    <div className="p-3 border-b border-stone-800">
                      <div className="text-xs font-bold text-stone-100">{user.name}</div>
                      <div className="text-[11px] text-stone-400">{user.email}</div>
                      <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setIsSettingsOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 hover:text-white rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-emerald-400" />
                        <span>Settings & Language</span>
                      </button>

                      <button
                        onClick={() => { setIsAuthModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 hover:text-white rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-sky-400" />
                        <span>Switch Account / Register</span>
                      </button>

                      <button
                        onClick={() => { logout(); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-coop-forest hover:bg-coop-forest-dark text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SOS Emergency Modal with Safe X button and cancel logic */}
      {sosModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={closeSosSafely}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Explicit Close X Button */}
            <button
              onClick={closeSosSafely}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Close SOS Dialog without broadcasting"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 pr-8">
              <Shield className="w-8 h-8 flex-shrink-0 text-rose-600" />
              <div>
                <h3 className="font-extrabold text-lg leading-tight">EMERGENCY SOS ALERT</h3>
                <p className="text-xs text-rose-700">Immediate Cooperative Safety Desk Dispatch</p>
              </div>
            </div>

            <p className="text-xs text-coop-charcoal leading-relaxed">
              Pressing SOS will capture your current coordinates and broadcast an emergency alert to nearby verified cooperative workers and the Cooperative Emergency Desk.
            </p>

            {sosSent ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>EMERGENCY SOS ACTIVE & DISPATCHED</span>
                  </div>
                  {sosIncidentData && (
                    <div className="text-[11px] space-y-1 text-emerald-950 pt-1 border-t border-emerald-200">
                      <div><span className="font-semibold">Assigned Responder:</span> {sosIncidentData.assignedWorker?.name} ({sosIncidentData.assignedWorker?.profession || 'Patrol'})</div>
                      <div><span className="font-semibold">Direct Helpline / Phone:</span> <a href={`tel:${sosIncidentData.assignedWorker?.phone}`} className="underline font-mono">{sosIncidentData.assignedWorker?.phone}</a></div>
                      <div><span className="font-semibold">Nearby Verified Workers:</span> {sosIncidentData.nearbyWorkersCount} active partners notified</div>
                      {sosIncidentData.capturedLocation && (
                        <div className="font-mono text-[10px] text-emerald-700">GPS Coordinates: {sosIncidentData.capturedLocation.lat.toFixed(4)}, {sosIncidentData.capturedLocation.lng.toFixed(4)}</div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={cancelSOS}
                  className="w-full bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Emergency Alert</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={triggerSOS}
                  disabled={sosSending}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md active:scale-98"
                >
                  {sosSending ? 'CAPTURING GPS & DISPATCHING...' : 'CONFIRM & BROADCAST SOS'}
                </button>
                <button
                  onClick={closeSosSafely}
                  className="bg-coop-sand hover:bg-coop-sand-dark text-coop-charcoal font-bold px-4 py-3 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
