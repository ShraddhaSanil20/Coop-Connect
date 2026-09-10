import React from 'react';
import { CooperativePulseData } from '../../types';
import { Users, Briefcase, HeartHandshake, Vote, TrendingUp } from 'lucide-react';

interface CooperativePulseProps {
  data: CooperativePulseData | null;
}

export const CooperativePulse: React.FC<CooperativePulseProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-coop-forest text-white border-b border-coop-forest-dark py-3 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold tracking-wider text-coop-saffron uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Cooperative Pulse Engine
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Metric 1 */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-coop-sand" />
            <span className="text-coop-sand">Active Workers:</span>
            <span className="font-bold text-white">{data.activeWorkers} / {data.totalWorkers}</span>
          </div>

          {/* Metric 2 */}
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-coop-sand" />
            <span className="text-coop-sand">Jobs Distributed:</span>
            <span className="font-bold text-white">{data.totalBookings}</span>
          </div>

          {/* Metric 3 */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-coop-sand">Gross GMV:</span>
            <span className="font-bold text-white">₹{data.grossGMV.toLocaleString()}</span>
          </div>

          {/* Metric 4 */}
          <div className="flex items-center gap-2 bg-coop-forest-dark px-2.5 py-1 rounded-md border border-coop-forest-light">
            <HeartHandshake className="w-4 h-4 text-coop-saffron" />
            <span className="text-coop-sand">Welfare Pool:</span>
            <span className="font-bold text-coop-saffron">₹{data.welfareFundBalance.toLocaleString()}</span>
          </div>

          {/* Metric 5 */}
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-amber-300" />
            <span className="text-coop-sand">Active Ballot:</span>
            <span className="font-bold text-white">{data.activeProposals} Proposals</span>
          </div>
        </div>
      </div>
    </div>
  );
};
