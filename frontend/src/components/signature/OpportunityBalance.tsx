import React from 'react';

interface OpportunityBalanceProps {
  performanceScore: number; // e.g. 91
  opportunityScore: number; // e.g. 32
  fairnessDebt: number;     // e.g. 34.5
}

export const OpportunityBalance: React.FC<OpportunityBalanceProps> = ({
  performanceScore,
  opportunityScore,
  fairnessDebt,
}) => {
  return (
    <div className="bg-white border border-coop-border rounded-xl p-5 shadow-coop">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-coop-forest uppercase tracking-wider">
            Opportunity Balance Matrix
          </h4>
          <p className="text-xs text-coop-charcoal-light mt-0.5">
            Comparing competence performance vs platform job allocation
          </p>
        </div>
        <div className="bg-coop-saffron-muted text-coop-saffron-dark px-3 py-1 rounded-full text-xs font-bold border border-coop-saffron/30">
          +{fairnessDebt.toFixed(1)} Debt Owed
        </div>
      </div>

      {/* Performance Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-coop-charcoal">Performance Score (Quality & Safety)</span>
          <span className="text-coop-forest font-bold">{performanceScore}/100</span>
        </div>
        <div className="w-full h-2.5 bg-coop-sand rounded-full overflow-hidden">
          <div
            className="h-full bg-coop-forest rounded-full transition-all duration-500"
            style={{ width: `${performanceScore}%` }}
          />
        </div>
      </div>

      {/* Opportunity Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-coop-charcoal">Actual Opportunity Score (Allocated Jobs)</span>
          <span className="text-coop-saffron font-bold">{opportunityScore}/100</span>
        </div>
        <div className="w-full h-2.5 bg-coop-sand rounded-full overflow-hidden">
          <div
            className="h-full bg-coop-saffron rounded-full transition-all duration-500"
            style={{ width: `${opportunityScore}%` }}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-coop-border text-[11px] text-coop-charcoal-light flex items-center justify-between">
        <span>Opportunity Deficit Balance:</span>
        <span className="font-bold text-coop-saffron-dark">
          {performanceScore - opportunityScore > 15 ? 'High Dispatch Priority' : 'Balanced Dispatch'}
        </span>
      </div>
    </div>
  );
};
