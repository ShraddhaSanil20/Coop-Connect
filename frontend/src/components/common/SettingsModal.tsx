import React, { useEffect } from 'react';
import { useAuth, Language } from '../../context/AuthContext';
import { Globe, X, Check, Bell, Moon, Sun, ShieldCheck } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, language, setLanguage, theme, toggleTheme, t } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  const languages: { code: Language; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close Settings"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-100">Coop Connect Settings</h3>
            <p className="text-xs text-stone-400">Language, theme & platform preferences</p>
          </div>
        </div>

        {/* Multilingual Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3">
            Select Language ({t('languageSelect')}):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${
                  language === lang.code
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-stone-800 bg-stone-800/50 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="text-xs font-bold">{lang.nativeName}</div>
                <div className="text-[10px] text-stone-400 mt-1">{lang.label}</div>
                {language === lang.code && <Check className="w-3.5 h-3.5 text-emerald-400 mt-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Preferences */}
        <div className="space-y-4 pt-4 border-t border-stone-800">
          <div className="flex items-center justify-between p-3 bg-stone-800/40 rounded-xl border border-stone-800">
            <div className="flex items-center space-x-3">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <div className="text-xs font-semibold text-stone-200">App Theme ({theme.toUpperCase()})</div>
                <div className="text-[10px] text-stone-400">
                  {theme === 'dark' ? 'Earthy dark background mode' : 'Clean light background mode'}
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Switch Light' : 'Switch Dark'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-800/40 rounded-xl border border-stone-800">
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-xs font-semibold text-stone-200">FairDispatch Notifications</div>
                <div className="text-[10px] text-stone-400">Real-time alert on job allocations</div>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4 rounded" />
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-800/40 rounded-xl border border-stone-800">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-stone-200">Aadhaar / eShram Verification</div>
                <div className="text-[10px] text-stone-400">Identity verification active</div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono rounded">VERIFIED</span>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(false)}
          className="w-full mt-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition-all"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

