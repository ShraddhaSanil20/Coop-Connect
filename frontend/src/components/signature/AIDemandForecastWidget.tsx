import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle, ArrowUpRight, ShieldCheck, MapPin, Zap } from 'lucide-react';

export interface Hotspot {
  locality: string;
  lat: number;
  lng: number;
  demandScore: number;
  surgeFactor: number;
  highDemandProfessions: string[];
  recommendedWorkersNeeded: number;
  activeWorkersPresent: number;
  deficit: number;
}

export const AIDemandForecastWidget: React.FC = () => {
  const [forecast, setForecast] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchForecast = async () => {
    try {
      const res = await fetch('/api/v1/cooperative/demand-forecast');
      if (res.ok) {
        const data = await res.json();
        setForecast(data);
      }
    } catch (err) {
      console.error('Failed to fetch demand forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center text-stone-400 text-xs font-bold animate-pulse">
        Loading AI Demand Forecast...
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 text-stone-100 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-stone-100 tracking-tight">AI Demand Forecast</h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Predictive demand intelligence balancing worker supply, fair opportunity allocation, and peak service surge
            </p>
          </div>
        </div>

        <button
          onClick={fetchForecast}
          className="px-4 py-2 bg-coop-forest hover:bg-coop-forest-light text-white font-bold text-xs rounded-xl shadow-coop transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Insights Carousel / Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecast.insights.map((insight: string, idx: number) => (
          <div key={idx} className="bg-stone-900/80 border border-stone-800 p-3.5 rounded-xl flex items-start space-x-3">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-300 leading-relaxed font-medium">{insight}</p>
          </div>
        ))}
      </div>

      {/* Hotspots Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-400" /> High Demand Bengaluru Hotspots ({forecast.hotspots.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {forecast.hotspots.map((spot: Hotspot) => (
            <div
              key={spot.locality}
              className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 p-4 rounded-xl space-y-3 transition-all group"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-xs text-stone-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
                  {spot.locality}
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {spot.surgeFactor}x Surge
                </span>
              </div>

              {/* Demand Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Demand Score</span>
                  <span className="font-bold text-emerald-400">{spot.demandScore} / 100</span>
                </div>
                <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                    style={{ width: `${spot.demandScore}%` }}
                  />
                </div>
              </div>

              {/* Profession Tags */}
              <div className="space-y-1">
                <div className="text-[10px] text-stone-400 font-semibold">High Demand For:</div>
                <div className="flex flex-wrap gap-1">
                  {spot.highDemandProfessions.map((p) => (
                    <span key={p} className="text-[9px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workforce Deficit Badge */}
              <div className="pt-2 border-t border-stone-800/80 flex justify-between items-center text-[10px]">
                <span className="text-stone-400">Workers: {spot.activeWorkersPresent} / {spot.recommendedWorkersNeeded}</span>
                <span className="font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">-{spot.deficit} Deficit</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
