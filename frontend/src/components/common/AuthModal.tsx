import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Shield, User, Wrench, Building2, X, Lock, Mail, Phone, ArrowRight, FileText, MapPin, Award } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithCredentials, registerUser, t } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('CUSTOMER');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('Electrician');
  const [skills, setSkills] = useState('Wiring, Circuit Repair, MCB Replacement');
  const [experienceYears, setExperienceYears] = useState('5');
  const [locality, setLocality] = useState('Koramangala');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const success = await loginWithCredentials(email, password);
        if (!success) {
          setErrorMsg('Invalid email or password. Try demo credentials or register a new account.');
        }
      } else {
        if (!name || !phone || !email || !password) {
          setErrorMsg('Please fill in all required fields.');
          setIsSubmitting(false);
          return;
        }
        const extra = selectedRole === 'WORKER' ? {
          profession,
          skills,
          experience_years: parseInt(experienceYears) || 3,
          locality,
          certificateUrl: certificateUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300'
        } : undefined;

        const success = await registerUser(name, phone, email, password, selectedRole, extra);
        if (!success) {
          setErrorMsg('Registration failed. Email or phone might already be registered.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-stone-900 border border-amber-500/20 rounded-2xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close Authentication Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-100">
              {mode === 'login' ? 'Sign In to Coop Connect' : 'Join Worker Cooperative'}
            </h3>
            <p className="text-xs text-stone-400">
              {mode === 'login' ? 'Access your role-based dashboard & services' : 'Create an equitable account'}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-stone-800 p-1 rounded-xl mb-6 border border-stone-700/50">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t('loginBtn')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t('registerBtn')}
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-stone-400 mb-2">Select Account Role:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('CUSTOMER')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center space-y-1 ${
                selectedRole === 'CUSTOMER'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                  : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[11px]">{t('roleCustomer')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('WORKER')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center space-y-1 ${
                selectedRole === 'WORKER'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                  : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span className="text-[11px]">{t('roleWorker')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('COOP_ADMIN')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center space-y-1 ${
                selectedRole === 'COOP_ADMIN'
                  ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-semibold'
                  : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[11px]">{t('roleAdmin')}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Mobile Phone (+91)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {selectedRole === 'WORKER' && (
                <div className="space-y-3 p-3 bg-stone-800/40 rounded-xl border border-stone-800">
                  <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Worker Partner Profile Details</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Primary Profession</label>
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Electrician">Electrician</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Painter">Painter</option>
                      <option value="Mechanic">Mechanic</option>
                      <option value="AC Technician">AC Technician</option>
                      <option value="Beautician">Beautician</option>
                      <option value="Barber">Barber</option>
                      <option value="Cook">Cook</option>
                      <option value="Solar Technician">Solar Technician</option>
                      <option value="Computer Technician">Computer Technician</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Key Skills & Certifications</label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="Wiring, MCB, Meter installation"
                        className="w-full pl-8 pr-3 py-1.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Base Locality</label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-500" />
                        <input
                          type="text"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300">
                    ℹ️ Worker accounts require admin verification before receiving live dispatches.
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs text-stone-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@coopconnect.org"
                className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In Now' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
          <p className="text-[11px] text-stone-500">
            Coop Connect guarantees 100% data privacy & worker ownership rights.
          </p>
        </div>
      </div>
    </div>
  );
};

