import React, { useState, useEffect } from 'react';
import { FairnessRing } from '../components/signature/FairnessRing';
import { OpportunityBalance } from '../components/signature/OpportunityBalance';
import { ShieldCheck, CheckCircle2, Clock, MapPin, IndianRupee, AlertTriangle, Activity, Heart, ArrowUpRight, ToggleLeft, ToggleRight, Wrench, Plus, X, Save, Sparkles } from 'lucide-react';

export const WorkerView: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [availability, setAvailability] = useState<boolean>(true);

  // Skill Editor state
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [savingSkills, setSavingSkills] = useState<boolean>(false);
  const [skillsSavedMsg, setSkillsSavedMsg] = useState<boolean>(false);

  // Leave Portal state
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveStartDate, setLeaveStartDate] = useState<string>('');
  const [leaveEndDate, setLeaveEndDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [submittingLeave, setSubmittingLeave] = useState<boolean>(false);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  // Emergency SOS Jobs state
  const [activeSosIncidents, setActiveSosIncidents] = useState<any[]>([]);

  const fetchWorkerDashboard = async () => {
    try {
      const res = await fetch('/api/v1/workers/my-dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        setAvailability(data.profile.isAvailable);
        setMySkills(data.profile.skills || []);

        // Fetch suggested skills for worker profession
        if (data.profile.profession) {
          fetchSuggestedSkills(data.profile.profession);
        }
      }
    } catch (err) {
      console.error('Failed to fetch worker dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const res = await fetch('/api/v1/leaves/mine');
      if (res.ok) {
        const data = await res.json();
        setMyLeaves(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch worker leaves:', err);
    }
  };

  const fetchActiveSosJobs = async () => {
    try {
      const res = await fetch('/api/v1/safety/active');
      if (res.ok) {
        const data = await res.json();
        setActiveSosIncidents(data.incidents || []);
      }
    } catch (err) {
      console.error('Failed to fetch active SOS incidents:', err);
    }
  };

  const fetchSuggestedSkills = async (profession: string) => {
    try {
      const res = await fetch(`/api/v1/workers/suggested-skills?profession=${encodeURIComponent(profession)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestedSkills(data.suggestedSkills || []);
      }
    } catch (err) {
      console.error('Failed to fetch suggested skills:', err);
    }
  };

  useEffect(() => {
    fetchWorkerDashboard();
    fetchMyLeaves();
    fetchActiveSosJobs();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) return;

    setSubmittingLeave(true);
    try {
      const res = await fetch('/api/v1/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason,
        }),
      });

      if (res.ok) {
        setShowLeaveModal(false);
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveReason('');
        fetchMyLeaves();
        fetchWorkerDashboard();
      }
    } catch (err) {
      console.error('Failed to submit leave application:', err);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const updateSosStatus = async (sosId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/safety/sos/${sosId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchActiveSosJobs();
      }
    } catch (err) {
      console.error('Failed to update SOS status:', err);
    }
  };

  const toggleAvailability = async () => {
    const nextVal = !availability;
    setAvailability(nextVal);
    try {
      await fetch('/api/v1/workers/toggle-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextVal }),
      });
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const updateJobStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchWorkerDashboard();
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !mySkills.includes(trimmed)) {
      setMySkills([...mySkills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setMySkills(mySkills.filter(s => s !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const res = await fetch('/api/v1/workers/me/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: mySkills }),
      });
      if (res.ok) {
        setSkillsSavedMsg(true);
        setTimeout(() => setSkillsSavedMsg(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save skills:', err);
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-coop-forest font-bold">
        Loading Worker Opportunity Dashboard...
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const activeBookings = dashboardData?.activeBookings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header & Verification Status */}
      <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
            alt={profile?.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-coop-forest shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-coop-forest">{profile?.name}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Safety Verified
              </span>
              {profile?.totalJobsCompleted === 0 ? (
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  ⭐ No ratings yet (New Partner)
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ⭐ {profile?.averageRating?.toFixed(1)} ({profile?.totalJobsCompleted} jobs)
                </span>
              )}
            </div>
            <p className="text-xs text-coop-charcoal-light mt-1">
              Profession: <strong className="text-stone-800">{profile?.profession || 'Certified Worker'}</strong> • Phone: {profile?.phone}
            </p>
          </div>
        </div>

        {/* Action Controls: Apply for Leave & Availability */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Clock className="w-4 h-4 text-amber-600" /> Apply for Leave
          </button>

          <div className="flex items-center gap-3 bg-coop-sand px-4 py-2 rounded-xl border border-coop-border">
            <div className="text-right">
              <div className="text-xs font-bold text-coop-forest">Dispatch Status</div>
              <div className="text-[10px] text-coop-charcoal-light font-semibold">
                {availability ? 'Online & Available' : 'Offline / Rest Mode'}
              </div>
            </div>
            <button
              onClick={toggleAvailability}
              className="text-coop-forest hover:text-coop-forest-light transition-all"
            >
              {availability ? (
                <ToggleRight className="w-8 h-8 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-coop-charcoal-muted" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency SOS Incidents Card (if active) */}
      {activeSosIncidents.length > 0 && (
        <div className="bg-rose-950/90 border-2 border-rose-500 text-white rounded-2xl p-6 shadow-2xl space-y-4 animate-pulse">
          <div className="flex items-center justify-between border-b border-rose-800/80 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-400 animate-bounce" />
              <h3 className="font-extrabold text-base text-rose-100 tracking-wide uppercase">
                EMERGENCY SOS ALERT — IMMEDIATE RESPONDER NEEDED
              </h3>
            </div>
            <span className="bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
              Priority: CRITICAL ({activeSosIncidents[0].status})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-rose-200 font-medium">Incident Details:</p>
              <p className="text-sm font-bold text-white mt-0.5">{activeSosIncidents[0].incident_type || 'Customer Emergency Alert'}</p>
              <p className="text-rose-300 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-rose-400" /> Location: {activeSosIncidents[0].lat}, {activeSosIncidents[0].lng} (Bengaluru Zone)
              </p>
            </div>
            <div className="bg-rose-900/60 p-3 rounded-xl border border-rose-700/50">
              <p className="text-rose-200 text-[11px]">Emergency Response Protocol:</p>
              <p className="text-white text-xs font-semibold mt-1">
                Verified Worker SOS Priority Response • Rapid On-Site Support
              </p>
            </div>
          </div>

          {/* Emergency Job Actions */}
          <div className="pt-2 flex flex-wrap gap-3">
            {activeSosIncidents[0].status === 'OPEN' && (
              <button
                onClick={() => updateSosStatus(activeSosIncidents[0].id, 'ACCEPTED')}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept SOS Emergency Dispatch
              </button>
            )}
            {activeSosIncidents[0].status === 'ACCEPTED' && (
              <button
                onClick={() => updateSosStatus(activeSosIncidents[0].id, 'ON_THE_WAY')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Clock className="w-4 h-4" /> En Route to Emergency Site
              </button>
            )}
            {activeSosIncidents[0].status === 'ON_THE_WAY' && (
              <button
                onClick={() => updateSosStatus(activeSosIncidents[0].id, 'ARRIVED')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <MapPin className="w-4 h-4" /> Arrived at Incident Site
              </button>
            )}
            {activeSosIncidents[0].status === 'ARRIVED' && (
              <button
                onClick={() => updateSosStatus(activeSosIncidents[0].id, 'RESOLVED')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ShieldCheck className="w-4 h-4" /> Mark SOS Incident Resolved
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Opportunities & Signature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Active Job & Leave History & Skill Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave History List Card */}
          {myLeaves.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-coop space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-extrabold text-base text-stone-800">My Cooperative Leave Requests</h3>
                </div>
                <span className="text-xs font-bold text-stone-500">{myLeaves.length} Request(s)</span>
              </div>
              <div className="space-y-2">
                {myLeaves.map((l: any) => (
                  <div key={l.id} className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-800">
                        {l.start_date} to {l.end_date}
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5 font-medium">
                        Reason: {l.reason}
                      </div>
                    </div>
                    <div>
                      {l.status === 'PENDING' && (
                        <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                          ⏳ Pending Approval
                        </span>
                      )}
                      {l.status === 'APPROVED' && (
                        <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                          ✓ Approved Leave (Offline Filter Active)
                        </span>
                      )}
                      {l.status === 'REJECTED' && (
                        <span className="bg-rose-100 text-rose-900 text-xs font-bold px-3 py-1 rounded-full border border-rose-300">
                          ✕ Leave Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Job Card */}
          {activeBookings.length > 0 ? (
            <div className="bg-white border-2 border-coop-forest rounded-2xl p-6 shadow-coop space-y-4">
              <div className="flex items-center justify-between border-b border-coop-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="font-extrabold text-base text-coop-forest">
                    ACTIVE DISPATCHED JOB #{activeBookings[0].bookingNumber}
                  </h3>
                </div>
                <span className="bg-coop-saffron-muted text-coop-saffron-dark text-xs font-bold px-3 py-1 rounded-full">
                  Status: {activeBookings[0].status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-sm text-coop-forest flex justify-between items-center">
                  <span>{activeBookings[0].serviceTitle || activeBookings[0].service_title}</span>
                  <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded">
                    GPS: Live Tracking Active (12.9716° N, 77.5946° E)
                  </span>
                </div>
                <div className="text-coop-charcoal font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-coop-saffron" /> {activeBookings[0].address}
                </div>
                <div className="text-coop-charcoal-light flex justify-between">
                  <span>Customer: {activeBookings[0].customerName || activeBookings[0].customer_name || 'Valued Customer'} ({activeBookings[0].customerPhone || activeBookings[0].customer_phone || '+91 9876543210'})</span>
                  <span className="text-emerald-700 font-bold">Payment: Held in Escrow</span>
                </div>
              </div>

              <div className="bg-coop-sand p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-coop-charcoal-light">Guaranteed Net Worker Payout:</span>
                  <div className="text-base font-extrabold text-coop-forest">₹{activeBookings[0].workerEarnings || activeBookings[0].worker_earnings || Math.round(activeBookings[0].total_amount * 0.85)}</div>
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-3 py-1 rounded-lg">
                  85% Direct Net Payout • 5% Welfare Fund
                </div>
              </div>

              {/* Status Stepper Actions */}
              <div className="pt-2 flex flex-wrap gap-3">
                {activeBookings[0].status === 'DISPATCHED' && (
                  <>
                    <button
                      onClick={() => updateJobStatus(activeBookings[0].id, 'ACCEPTED')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept Job & En Route
                    </button>
                    <button
                      onClick={() => updateJobStatus(activeBookings[0].id, 'CANCELLED')}
                      className="px-4 bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 border border-rose-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Decline / Pass
                    </button>
                  </>
                )}

                {activeBookings[0].status === 'ACCEPTED' && (
                  <button
                    onClick={() => updateJobStatus(activeBookings[0].id, 'IN_PROGRESS')}
                    className="flex-1 bg-coop-saffron hover:bg-coop-saffron-dark text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Clock className="w-4 h-4" /> Arrived at Location — Start Work
                  </button>
                )}

                {activeBookings[0].status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateJobStatus(activeBookings[0].id, 'COMPLETED')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" /> Complete Work & Release Escrow Payout (₹{activeBookings[0].workerEarnings || Math.round(activeBookings[0].total_amount * 0.85)})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-coop-border rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-coop-sand text-coop-forest mx-auto flex items-center justify-center font-bold text-xl">
                ✓
              </div>
              <h3 className="font-bold text-base text-coop-forest">No Active Dispatched Job Right Now</h3>
              <p className="text-xs text-coop-charcoal-light max-w-md mx-auto leading-relaxed">
                Your profile is active in the FairDispatch pool. Higher fairness debt (+{profile?.fairnessDebt}) grants you priority allocation for upcoming customer requests!
              </p>
            </div>
          )}

          {/* Worker Skill Portfolio Manager */}
          <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-coop-forest">Skill Portfolio & Dispatch Tags</h3>
              </div>
              <button
                onClick={handleSaveSkills}
                disabled={savingSkills}
                className="px-3.5 py-1.5 bg-coop-forest hover:bg-coop-forest-light text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{savingSkills ? 'Saving...' : 'Save Skills'}</span>
              </button>
            </div>

            {skillsSavedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Skills successfully updated! FairDispatch engine will evaluate your new skills for upcoming bookings.</span>
              </div>
            )}

            {/* Current Active Skills Chips */}
            <div>
              <label className="block text-xs font-bold text-coop-charcoal-light mb-2">
                ACTIVE DISPATCH SKILLS ({mySkills.length}):
              </label>
              <div className="flex flex-wrap gap-2">
                {mySkills.map((sk) => (
                  <span
                    key={sk}
                    className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>{sk}</span>
                    <button
                      onClick={() => handleRemoveSkill(sk)}
                      className="hover:text-rose-600 text-emerald-600 transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add Custom Skill Input */}
            <div className="flex space-x-2 pt-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(newSkillInput); }}
                placeholder="Type new skill (e.g. Solar Inverter Setup)..."
                className="flex-1 px-3 py-2 border border-coop-border rounded-xl text-xs focus:outline-none focus:border-coop-forest font-semibold"
              />
              <button
                onClick={() => handleAddSkill(newSkillInput)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center space-x-1 border border-stone-300"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Suggested Skills based on Profession */}
            {suggestedSkills.length > 0 && (
              <div className="pt-3 border-t border-stone-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Suggested Skills for {profile?.profession}:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSkills
                    .filter((s) => !mySkills.includes(s))
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleAddSkill(s)}
                        className="text-[11px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-medium transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3 text-amber-600" />
                        <span>{s}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Fairness Ledger History Table */}
          <div className="bg-white border border-coop-border rounded-xl p-6 shadow-coop">
            <h3 className="text-base font-bold text-coop-forest mb-4">Your Fairness Ledger Audit Log</h3>
            <div className="space-y-2">
              {dashboardData?.fairnessLogs.map((log: any) => (
                <div key={log.id} className="bg-coop-bg border border-coop-border p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-coop-forest">{log.description}</div>
                    <div className="text-[10px] text-coop-charcoal-light mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-coop-saffron-dark">
                      Delta: {log.opportunity_delta > 0 ? `+${log.opportunity_delta}` : log.opportunity_delta}
                    </span>
                    <div className="text-[10px] text-coop-charcoal-light">New Debt: {log.debt_after}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Signature Fairness Ring & Wellbeing Meter */}
        <div className="space-y-6">
          {/* Fairness Opportunity Ring */}
          <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop text-center space-y-4">
            <h3 className="font-bold text-sm text-coop-forest uppercase tracking-wider">
              Your Opportunity Ring
            </h3>
            <FairnessRing
              debt={profile?.fairnessDebt || 0}
              totalJobs={profile?.totalJobsCompleted || 0}
              rating={profile?.averageRating || 5.0}
            />
            <p className="text-xs text-coop-charcoal-light leading-relaxed">
              Fairness Debt balances recent opportunity distribution. You are currently in a high-priority dispatch tier.
            </p>
          </div>

          {/* Opportunity Matrix */}
          <OpportunityBalance
            performanceScore={profile?.performanceScore || 90}
            opportunityScore={profile?.opportunityScore || 50}
            fairnessDebt={profile?.fairnessDebt || 0}
          />

          {/* Wellbeing Index Meter */}
          <div className="bg-white border border-coop-border rounded-2xl p-6 shadow-coop space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-coop-forest">Operational Wellbeing Index</h3>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {profile?.wellbeingIndex} / 100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-coop-charcoal-light">
                <span>Working Hours This Week:</span>
                <span className="font-semibold text-coop-forest">26 hrs</span>
              </div>
              <div className="flex justify-between text-coop-charcoal-light">
                <span>Consecutive Days Active:</span>
                <span className="font-semibold text-coop-forest">3 days</span>
              </div>
              <div className="flex justify-between text-coop-charcoal-light">
                <span>Fatigue Risk Status:</span>
                <span className="font-bold text-emerald-600">Optimal Rest</span>
              </div>
            </div>

            <div className="bg-coop-sand p-3 rounded-xl text-[11px] text-coop-charcoal leading-relaxed">
              💡 <strong>Operational Guidance:</strong> Workload balance optimal. Recommend taking a 30-min hydration break before next peak evening dispatch.
            </div>
          </div>
        </div>
      </div>

      {/* Apply for Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-stone-800">Apply for Cooperative Leave</h3>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Leave Start Date</label>
                <input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-coop-forest font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Leave End Date</label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-coop-forest font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Reason for Leave</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Health checkup, Family event, Rest & Recovery..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-coop-forest font-semibold"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Cooperative Policy:</strong> Approved leave automatically pauses your availability in FairDispatch matching and hides map pins during leave dates.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl border border-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-md transition-all"
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
