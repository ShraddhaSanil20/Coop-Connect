import React, { useState, useEffect } from 'react';
import { CooperativePulse } from '../components/signature/CooperativePulse';
import { FairDispatchSimulator } from '../components/signature/FairDispatchSimulator';
import { OpportunityMap, MapWorkerPin } from '../components/signature/OpportunityMap';
import { AIDemandForecastWidget } from '../components/signature/AIDemandForecastWidget';
import { GovernanceProposal } from '../types';
import { Vote, HeartHandshake, ShieldCheck, CheckCircle2, Sliders, Users, MapPin, DollarSign, ChevronRight, Plus, Edit2, RefreshCw, X, UserPlus } from 'lucide-react';

export const CooperativeView: React.FC = () => {
  const [pulseData, setPulseData] = useState<any | null>(null);
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [welfareLogs, setWelfareLogs] = useState<any[]>([]);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKERS' | 'SIMULATOR' | 'GOVERNANCE' | 'WELFARE'>('OVERVIEW');

  // Admin Worker Modal state
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState<boolean>(false);
  const [editingWorker, setEditingWorker] = useState<any | null>(null);
  const [workerFormData, setWorkerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profession: 'Electrician',
    baseLatitude: 12.9716,
    baseLongitude: 77.5946,
    serviceRadiusKm: 15,
    skills: 'Wiring, Circuit Breakers, Solar Inverters',
  });

  const fetchCommandCenterData = async () => {
    try {
      const [pulseRes, propRes, welfRes, workerRes] = await Promise.all([
        fetch('/api/v1/cooperative/pulse'),
        fetch('/api/v1/governance/proposals'),
        fetch('/api/v1/welfare/history'),
        fetch('/api/v1/workers'),
      ]);

      if (pulseRes.ok) {
        const data = await pulseRes.json();
        setPulseData(data.pulse);
      }

      if (propRes.ok) {
        const data = await propRes.json();
        setProposals(data.proposals);
      }

      if (welfRes.ok) {
        const data = await welfRes.json();
        setWelfareLogs(data.history);
      }

      if (workerRes.ok) {
        const data = await workerRes.json();
        setWorkersList(data.workers || []);
      }
    } catch (err) {
      console.error('Failed to fetch command center data:', err);
    }
  };

  useEffect(() => {
    fetchCommandCenterData();
  }, []);

  const openCreateWorkerModal = () => {
    setEditingWorker(null);
    setWorkerFormData({
      name: '',
      email: '',
      phone: '',
      profession: 'Electrician',
      baseLatitude: 12.9716,
      baseLongitude: 77.5946,
      serviceRadiusKm: 15,
      skills: 'Safety Inspection, System Diagnostics',
    });
    setIsWorkerModalOpen(true);
  };

  const openEditWorkerModal = (worker: any) => {
    setEditingWorker(worker);
    setWorkerFormData({
      name: worker.name || '',
      email: worker.email || '',
      phone: worker.phone || '',
      profession: worker.profession || 'Electrician',
      baseLatitude: worker.base_latitude || worker.lat || 12.9716,
      baseLongitude: worker.base_longitude || worker.lng || 77.5946,
      serviceRadiusKm: worker.service_radius_km || worker.serviceRadiusKm || 15,
      skills: Array.isArray(worker.skills) ? worker.skills.join(', ') : worker.skills || '',
    });
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = workerFormData.skills.split(',').map((s) => s.trim()).filter(Boolean);

      const endpoint = editingWorker ? `/api/v1/workers/${editingWorker.id}` : '/api/v1/workers';
      const method = editingWorker ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workerFormData.name,
          email: workerFormData.email,
          phone: workerFormData.phone,
          profession: workerFormData.profession,
          baseLatitude: workerFormData.baseLatitude,
          baseLongitude: workerFormData.baseLongitude,
          serviceRadiusKm: workerFormData.serviceRadiusKm,
          skills: skillsArray,
        }),
      });

      if (res.ok) {
        setIsWorkerModalOpen(false);
        fetchCommandCenterData();
      }
    } catch (err) {
      console.error('Failed to save worker:', err);
    }
  };

  const castVote = async (proposalId: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    try {
      const res = await fetch(`/api/v1/governance/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ choice }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Your democratic vote (${choice}) has been recorded!`);
        fetchCommandCenterData();
      } else {
        alert(data.error || 'Failed to submit vote');
      }
    } catch (err) {
      console.error('Failed to cast vote:', err);
      alert('Error connecting to governance server.');
    }
  };

  // Convert workersList to MapWorkerPin format
  const mapWorkers: MapWorkerPin[] = workersList.map((w) => ({
    id: w.id,
    name: w.name,
    profession: w.profession,
    skills: w.skills,
    lat: w.base_latitude || w.lat || 12.9716,
    lng: w.base_longitude || w.lng || 77.5946,
    type: 'WORKER',
    rating: w.average_rating || w.averageRating || 5.0,
    fairnessDebt: w.fairness_debt || w.fairnessDebt || 0,
    isAvailable: w.is_available === 1 || w.is_available === true || w.isAvailable === true,
    phone: w.phone,
    serviceRadiusKm: w.service_radius_km || w.serviceRadiusKm,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cooperative Header & Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-coop-border pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-coop-forest">Cooperative Command Center</h2>
          <p className="text-xs text-coop-charcoal-light">
            Real-time Operational Pulse, Democratic Governance & FairDispatch Transparency Engine
          </p>
        </div>

        <div className="flex bg-coop-sand p-1 rounded-xl border border-coop-border flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'OVERVIEW' ? 'bg-coop-forest text-white shadow-sm' : 'text-coop-charcoal hover:text-coop-forest'
            }`}
          >
            Pulse Overview
          </button>
          <button
            onClick={() => setActiveTab('WORKERS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'WORKERS' ? 'bg-coop-forest text-white shadow-sm' : 'text-coop-charcoal hover:text-coop-forest'
            }`}
          >
            Worker Roster ({workersList.length})
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SIMULATOR' ? 'bg-coop-forest text-white shadow-sm' : 'text-coop-charcoal hover:text-coop-forest'
            }`}
          >
            FairDispatch Inspector
          </button>
          <button
            onClick={() => setActiveTab('GOVERNANCE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'GOVERNANCE' ? 'bg-coop-forest text-white shadow-sm' : 'text-coop-charcoal hover:text-coop-forest'
            }`}
          >
            Worker Voting Portal
          </button>
          <button
            onClick={() => setActiveTab('WELFARE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'WELFARE' ? 'bg-coop-forest text-white shadow-sm' : 'text-coop-charcoal hover:text-coop-forest'
            }`}
          >
            Welfare Vault
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Cooperative Pulse Metrics */}
          {pulseData && <CooperativePulse data={pulseData} />}

          {/* Interactive Worker Opportunity Map */}
          <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-coop-forest">Live Bengaluru Worker & Demand Density Map</h3>
                <p className="text-xs text-coop-charcoal-light">Real-time GPS worker positions, availability, and FairDispatch opportunity debt balance</p>
              </div>
              <span className="bg-coop-sand text-coop-forest text-xs font-bold px-3 py-1 rounded-full border border-coop-border">
                {workersList.length} Active Pins
              </span>
            </div>

            <OpportunityMap workers={mapWorkers} />
          </div>

          {/* AI Demand & Geospatial Hotspot Forecast */}
          <AIDemandForecastWidget />
        </div>
      )}

      {/* WORKERS MANAGEMENT TAB */}
      {activeTab === 'WORKERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-coop-border shadow-sm">
            <div>
              <h3 className="font-extrabold text-lg text-coop-forest">Cooperative Worker Roster Management</h3>
              <p className="text-xs text-coop-charcoal-light">Admin tool to onboard new worker-owners or update skills, locality radii, and contact details</p>
            </div>
            <button
              onClick={openCreateWorkerModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Worker</span>
            </button>
          </div>

          <div className="bg-white border border-coop-border rounded-xl shadow-coop overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-coop-sand text-coop-forest font-bold border-b border-coop-border">
                  <tr>
                    <th className="p-3.5">Worker Name</th>
                    <th className="p-3.5">Profession</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">GPS Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Fairness Debt</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coop-border/60 text-coop-charcoal">
                  {workersList.map((worker) => (
                    <tr key={worker.id} className="hover:bg-coop-bg/60 transition-colors">
                      <td className="p-3.5 font-bold text-coop-forest">
                        {worker.name}
                        <div className="text-[10px] text-coop-charcoal-light font-normal">
                          {Array.isArray(worker.skills) ? worker.skills.slice(0, 2).join(', ') : worker.skills}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-coop-sand text-coop-forest text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-coop-border">
                          {worker.profession}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px] font-mono">
                        <div>{worker.phone}</div>
                        <div className="text-stone-400">{worker.email}</div>
                      </td>
                      <td className="p-3.5 text-[11px]">
                        <div>{(worker.base_latitude || worker.lat)?.toFixed(4)}, {(worker.base_longitude || worker.lng)?.toFixed(4)}</div>
                        <div className="text-stone-400 font-mono">Radius: {worker.service_radius_km || worker.serviceRadiusKm}km</div>
                      </td>
                      <td className="p-3.5">
                        {worker.is_available ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Available
                          </span>
                        ) : (
                          <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-coop-saffron-dark">
                        +{worker.fairness_debt || worker.fairnessDebt || 0}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => openEditWorkerModal(worker)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors"
                          title="Edit Worker Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATOR TAB */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          <FairDispatchSimulator />
        </div>
      )}

      {/* GOVERNANCE TAB */}
      {activeTab === 'GOVERNANCE' && (
        <div className="space-y-6">
          <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop space-y-2">
            <div className="flex items-center gap-2 text-coop-forest">
              <Vote className="w-6 h-6 text-coop-saffron" />
              <h3 className="font-extrabold text-lg">One-Worker-One-Vote Governance Portal</h3>
            </div>
            <p className="text-xs text-coop-charcoal-light leading-relaxed">
              Every worker owner has equal voting power. Key operational decisions, commission allocations, and welfare fund grants are decided democratically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((p) => {
              const votesFor = p.votes_for ?? p.votesFor ?? 0;
              const votesAgainst = p.votes_against ?? p.votesAgainst ?? 0;
              const votesAbstain = p.votes_abstain ?? p.votesAbstain ?? 0;
              const totalVotes = votesFor + votesAgainst + votesAbstain;
              const percentFor = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;

              return (
                <div key={p.id} className="bg-white border border-coop-border rounded-xl p-6 shadow-coop space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-coop-sand text-coop-forest text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-coop-border">
                        {p.category}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {p.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-coop-forest">{p.title}</h4>
                    <p className="text-xs text-coop-charcoal-light leading-relaxed">{p.description}</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-coop-border">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Approval Level ({percentFor}%)</span>
                        <span>{votesFor} For / {votesAgainst} Against</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-coop-sand overflow-hidden flex">
                        <div style={{ width: `${percentFor}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${100 - percentFor}%` }} className="bg-rose-400 h-full" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => castVote(p.id, 'FOR')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs"
                      >
                        Vote FOR
                      </button>
                      <button
                        onClick={() => castVote(p.id, 'AGAINST')}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs"
                      >
                        Vote AGAINST
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WELFARE VAULT TAB */}
      {activeTab === 'WELFARE' && (
        <div className="space-y-6">
          <div className="bg-coop-forest text-white rounded-2xl p-6 shadow-coop flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-coop-saffron" />
                <h3 className="font-extrabold text-lg">Worker Welfare & Emergency Fund Vault</h3>
              </div>
              <p className="text-coop-sand text-xs max-w-xl leading-relaxed">
                5% of all platform customer transactions automatically flow into this autonomous vault to fund emergency medical grants, accident cover, and fatigue safety payouts.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl text-right border border-white/20">
              <div className="text-xs text-coop-sand">Total Treasury Balance</div>
              <div className="text-2xl font-extrabold text-coop-saffron">₹{pulseData?.welfareVaultBalance?.toLocaleString() || '18,450'}</div>
            </div>
          </div>

          <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop space-y-4">
            <h3 className="font-bold text-base text-coop-forest">Autonomous Vault Transaction Ledger</h3>
            <div className="space-y-3">
              {welfareLogs.map((log) => (
                <div key={log.id} className="bg-coop-bg border border-coop-border p-4 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-coop-forest flex items-center gap-2">
                      <span>{log.description}</span>
                      <span className="bg-coop-sand text-coop-forest text-[10px] px-2 py-0.5 rounded-full border border-coop-border font-semibold">
                        {log.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-coop-charcoal-light mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className={`text-base font-extrabold ${log.type === 'CONTRIBUTION' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {log.type === 'CONTRIBUTION' ? `+₹${log.amount}` : `-₹${log.amount}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN WORKER MODAL (CREATE / EDIT) */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-coop-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-coop-border pb-3">
              <h3 className="font-extrabold text-base text-coop-forest">
                {editingWorker ? `Edit Worker: ${editingWorker.name}` : 'Onboard New Worker Owner'}
              </h3>
              <button
                onClick={() => setIsWorkerModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-coop-forest mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={workerFormData.name}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-medium"
                    placeholder="e.g. Ramesh Gowda"
                  />
                </div>

                <div>
                  <label className="block font-bold text-coop-forest mb-1">Profession</label>
                  <select
                    value={workerFormData.profession}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, profession: e.target.value })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-medium"
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Painter">Painter</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="AC Technician">AC Technician</option>
                    <option value="Appliance Technician">Appliance Technician</option>
                    <option value="Solar Technician">Solar Technician</option>
                    <option value="Gardener">Gardener</option>
                    <option value="Mason">Mason</option>
                    <option value="Cook">Cook</option>
                    <option value="Beautician">Beautician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-coop-forest mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={workerFormData.phone}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block font-bold text-coop-forest mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={workerFormData.email}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, email: e.target.value })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-mono"
                    placeholder="worker@coopconnect.in"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-coop-forest mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={workerFormData.baseLatitude}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, baseLatitude: parseFloat(e.target.value) })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-coop-forest mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={workerFormData.baseLongitude}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, baseLongitude: parseFloat(e.target.value) })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-coop-forest mb-1">Radius (km)</label>
                  <input
                    type="number"
                    required
                    value={workerFormData.serviceRadiusKm}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, serviceRadiusKm: parseInt(e.target.value) })}
                    className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-coop-forest mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={workerFormData.skills}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, skills: e.target.value })}
                  className="w-full bg-coop-bg border border-coop-border px-3 py-2 rounded-lg font-medium"
                  placeholder="Wiring, DB Box Repair, Inverter Setup"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-coop-border">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-coop-forest hover:bg-coop-forest-light text-white font-bold rounded-lg shadow-sm"
                >
                  {editingWorker ? 'Save Changes' : 'Onboard Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
