import React from 'react';

interface FairnessRingProps {
  debt: number; // e.g. 34.5
  totalJobs: number;
  rating: number;
  size?: number;
}

export const FairnessRing: React.FC<FairnessRingProps> = ({ debt, totalJobs, rating, size = 160 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate debt ratio (0 to 50 scale)
  const debtRatio = Math.min(1.0, Math.max(0.1, debt / 50));
  const strokeDashoffset = circumference - debtRatio * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E6E0D5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active Fairness Balance Debt arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={debt > 20 ? '#D97706' : '#1B3B2B'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold text-coop-forest">
          +{debt.toFixed(1)}
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase text-coop-charcoal-light">
          Fairness Debt
        </span>
      </div>
    </div>
  );
};
