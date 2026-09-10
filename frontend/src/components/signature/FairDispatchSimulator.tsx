import React, { useState, useEffect } from 'react';
import { DispatchSimulationResult } from '../../types';
import { Sliders, Sparkles, CheckCircle2, AlertCircle, Info, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';

export const FairDispatchSimulator: React.FC = () => {
  const [simulation, setSimulation] = useState<DispatchSimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [serviceCategory, setServiceCategory] = useState<string>('Electrical Repair');

  // Configurable raw weights state
  const [rawWeights, setRawWeights] = useState({
    skillFit: 30,
    reliability: 15,
    proximity: 15,
    availability: 10,
    workerNeed: 10,
    fairnessDebt: 10,
    workloadBalance: 10,
  });

  // Calculate sum and normalized weights
  const totalWeightSum = Object.values(rawWeights).reduce((a, b) => a + b, 0) || 1;

  const normalizedWeights = {
    skillFit: Number((rawWeights.skillFit / totalWeightSum).toFixed(3)),
    reliability: Number((rawWeights.reliability / totalWeightSum).toFixed(3)),
    proximity: Number((rawWeights.proximity / totalWeightSum).toFixed(3)),
    availability: Number((rawWeights.availability / totalWeightSum).toFixed(3)),
    workerNeed: Number((rawWeights.workerNeed / totalWeightSum).toFixed(3)),
    fairnessDebt: Number((rawWeights.fairnessDebt / totalWeightSum).toFixed(3)),
    workloadBalance: Number((rawWeights.workloadBalance / totalWeightSum).toFixed(3)),
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/dispatch/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 12.9716,
          lng: 77.5946,
          serviceCategory,
          customWeights: normalizedWeights,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimulation(data.evaluationResult);
      }
    } catch (err) {
      console.error('FairDispatch simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [serviceCategory, rawWeights]);

  const handleSliderChange = (key: keyof typeof rawWeights, value: number) => {
    setRawWeights((prev) => ({ ...prev, [key]: value }));
  };

  const resetDefaultWeights = () => {
    setRawWeights({
      skillFit: 30,
      reliability: 15,
      proximity: 15,
      availability: 10,
      workerNeed: 10,
      fairnessDebt: 10,
      workloadBalance: 10,
    });
  };

  return (
    <div className="bg-white border border-coop-border rounded-xl p-6 shadow-coop">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-coop-border">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-coop-saffron" />
            <h3 className="text-lg font-bold text-coop-forest">
              FairDispatch Engine Inspector & Live Simulator
            </h3>
          </div>
          <p className="text-xs text-coop-charcoal-light mt-1">
            Deterministic, explainable opportunity allocation engine (Normalized 100% Parameter Weighting)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
            className="bg-coop-sand text-coop-forest text-xs font-semibold px-3 py-2 rounded-lg border border-coop-border focus:outline-none"
          >
            <option value="All">All Registered Professions</option>
            <option value="Electrician">Electrician & Electrical Repair</option>
            <option value="Plumber">Plumber & Pipeline Repair</option>
            <option value="Carpenter">Carpenter & Woodwork</option>
            <option value="Painter">Painter & Wall Finishing</option>
            <option value="Cleaner">Cleaner & Home Sanitation</option>
            <option value="Mechanic">Auto Mechanic</option>
            <option value="AC Technician">AC Technician & Servicing</option>
            <option value="Appliance Technician">Appliance Repair Technician</option>
            <option value="CCTV Technician">CCTV & Security Tech</option>
            <option value="Computer Technician">Computer & Network Tech</option>
            <option value="Gardener">Gardener & Landscaping</option>
            <option value="Pest Control">Pest Control Specialist</option>
            <option value="Beautician">Beautician & Skincare</option>
            <option value="Barber">Barber & Hair Stylist</option>
            <option value="Cook">Cook & Home Chef</option>
            <option value="Mason">Mason & Brickwork</option>
            <option value="Tile Worker">Tile & Marble Worker</option>
            <option value="Solar Technician">Solar Rooftop Technician</option>
          </select>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="bg-coop-forest hover:bg-coop-forest-light text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Re-Run Match'}</span>
          </button>
        </div>
      </div>

      {/* Normalized Weight Bar */}
      <div className="mb-6 bg-stone-900 border border-stone-800 p-4 rounded-2xl text-stone-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-stone-100">Live Normalized Weight Matrix (Sum = 100%)</span>
          </div>
          <button
            onClick={resetDefaultWeights}
            className="text-[10px] text-stone-400 hover:text-stone-200 underline font-mono"
          >
            Reset to Co-op Default
          </button>
        </div>

        {/* Visual Progress Bar Stack */}
        <div className="h-3 w-full bg-stone-800 rounded-full overflow-hidden flex mb-3 border border-stone-700">
          <div style={{ width: `${normalizedWeights.skillFit * 100}%` }} className="bg-emerald-500" title="Skill Fit" />
          <div style={{ width: `${normalizedWeights.reliability * 100}%` }} className="bg-sky-500" title="Reliability" />
          <div style={{ width: `${normalizedWeights.proximity * 100}%` }} className="bg-blue-500" title="Proximity" />
          <div style={{ width: `${normalizedWeights.availability * 100}%` }} className="bg-indigo-500" title="Availability" />
          <div style={{ width: `${normalizedWeights.workerNeed * 100}%` }} className="bg-amber-500" title="Worker Need" />
          <div style={{ width: `${normalizedWeights.fairnessDebt * 100}%` }} className="bg-orange-500" title="Fairness Debt" />
          <div style={{ width: `${normalizedWeights.workloadBalance * 100}%` }} className="bg-rose-500" title="Workload Balance" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px] text-center font-mono">
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-emerald-400 font-bold">{(normalizedWeights.skillFit * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Skill Fit</div>
          </div>
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-sky-400 font-bold">{(normalizedWeights.reliability * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Reliability</div>
          </div>
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-blue-400 font-bold">{(normalizedWeights.proximity * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Proximity</div>
          </div>
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-indigo-400 font-bold">{(normalizedWeights.availability * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Availability</div>
          </div>
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-amber-400 font-bold">{(normalizedWeights.workerNeed * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Worker Need</div>
          </div>
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-orange-400 font-bold">{(normalizedWeights.fairnessDebt * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Fairness Debt</div>
          </div>
          <div className="bg-stone-800 p-1.5 rounded border border-stone-700">
            <div className="text-rose-400 font-bold">{(normalizedWeights.workloadBalance * 100).toFixed(1)}%</div>
            <div className="text-stone-400 truncate">Workload</div>
          </div>
        </div>
      </div>

      {/* Rationale Banner */}
      {simulation && (
        <div className="bg-coop-sand/80 border border-coop-border rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-coop-saffron shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-coop-forest uppercase tracking-wider mb-1">
                FairDispatch Selection Rationale
              </h4>
              <p className="text-xs text-coop-charcoal leading-relaxed">
                {simulation.rationale}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Breakdown Cards */}
      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {simulation.candidates.map((cand) => {
            const isWinner = cand.worker.id === simulation.selectedWorkerId;
            return (
              <div
                key={cand.worker.id}
                className={`rounded-xl p-4 border transition-all ${
                  isWinner
                    ? 'bg-emerald-50/50 border-emerald-500/50 ring-2 ring-emerald-500/20'
                    : 'bg-coop-bg border-coop-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={cand.worker.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100'}
                      alt={cand.worker.name}
                      className="w-10 h-10 rounded-full object-cover border border-coop-border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-coop-forest">{cand.worker.name}</h4>
                        {isWinner && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selected Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-coop-charcoal-light mt-0.5">
                        <span>⭐ {cand.worker.averageRating}</span>
                        <span>•</span>
                        <span>{cand.worker.totalJobsCompleted} Jobs</span>
                        <span>•</span>
                        <span className="text-coop-saffron-dark font-bold">+{cand.worker.fairnessDebt} Debt</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-extrabold text-coop-forest">
                      {cand.scores.compositeScore}
                    </div>
                    <div className="text-[10px] text-coop-charcoal-light font-semibold uppercase">
                      Composite Score
                    </div>
                  </div>
                </div>

                {/* Eligibility Check */}
                {!cand.isEligible ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Hard Filtered: {cand.hardFilterReason}</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs pt-2 border-t border-coop-border/60">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between bg-white px-2 py-1 rounded border border-coop-border/40">
                        <span className="text-coop-charcoal-light">Skill Fit:</span>
                        <span className="font-bold text-coop-forest">{cand.scores.skillFit}</span>
                      </div>
                      <div className="flex justify-between bg-white px-2 py-1 rounded border border-coop-border/40">
                        <span className="text-coop-charcoal-light">Reliability:</span>
                        <span className="font-bold text-coop-forest">{cand.scores.reliability}</span>
                      </div>
                      <div className="flex justify-between bg-white px-2 py-1 rounded border border-coop-border/40">
                        <span className="text-coop-charcoal-light">Proximity:</span>
                        <span className="font-bold text-coop-forest">{cand.scores.proximity} ({cand.worker.distanceKm}km)</span>
                      </div>
                      <div className="flex justify-between bg-white px-2.5 py-1 rounded border border-coop-saffron/30 bg-coop-saffron-muted/40">
                        <span className="text-coop-saffron-dark font-semibold">Fairness Debt:</span>
                        <span className="font-bold text-coop-saffron-dark">{cand.scores.fairnessDebt}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Configurable Weight Sliders Accordion */}
      <details className="group border-t border-coop-border pt-4" open>
        <summary className="cursor-pointer text-xs font-bold text-coop-forest flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-coop-saffron" />
            <span>Tweak FairDispatch Allocation Weights (Cooperative Assembly Governance)</span>
          </div>
          <span className="text-[10px] text-stone-500 underline">Toggle Controls</span>
        </summary>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Skill Fit: {rawWeights.skillFit} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.skillFit}
              onChange={(e) => handleSliderChange('skillFit', parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Reliability: {rawWeights.reliability} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.reliability}
              onChange={(e) => handleSliderChange('reliability', parseInt(e.target.value))}
              className="w-full accent-sky-600"
            />
          </div>

          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Proximity: {rawWeights.proximity} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.proximity}
              onChange={(e) => handleSliderChange('proximity', parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Availability: {rawWeights.availability} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.availability}
              onChange={(e) => handleSliderChange('availability', parseInt(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Worker Need: {rawWeights.workerNeed} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.workerNeed}
              onChange={(e) => handleSliderChange('workerNeed', parseInt(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Fairness Debt: {rawWeights.fairnessDebt} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.fairnessDebt}
              onChange={(e) => handleSliderChange('fairnessDebt', parseInt(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>

          <div>
            <label className="block text-coop-charcoal font-bold mb-1">
              Workload Balance: {rawWeights.workloadBalance} pts
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rawWeights.workloadBalance}
              onChange={(e) => handleSliderChange('workloadBalance', parseInt(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>
        </div>
      </details>
    </div>
  );
};
