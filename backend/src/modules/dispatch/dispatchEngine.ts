import db from '../../db';

export interface DispatchWeights {
  skillFit: number;       // 0.30
  reliability: number;    // 0.15
  proximity: number;      // 0.10
  availability: number;   // 0.10
  workerNeed: number;     // 0.15
  fairnessDebt: number;   // 0.10
  workloadBalance: number;// 0.10
}

export const DEFAULT_WEIGHTS: DispatchWeights = {
  skillFit: 0.30,
  reliability: 0.15,
  proximity: 0.10,
  availability: 0.10,
  workerNeed: 0.15,
  fairnessDebt: 0.10,
  workloadBalance: 0.10,
};

export interface WorkerCandidate {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string;
  profession: string;
  skills: string[];
  verificationStatus: string;
  safetyVerified: boolean;
  isAvailable: boolean;
  lat: number;
  lng: number;
  distanceKm: number;
  totalJobsCompleted: number;
  averageRating: number;
  fairnessDebt: number;
  opportunityScore: number;
  performanceScore: number;
  wellbeingIndex: number;
}

export interface FactorBreakdown {
  skillFit: number;
  reliability: number;
  proximity: number;
  availability: number;
  workerNeed: number;
  fairnessDebt: number;
  workloadBalance: number;
  compositeScore: number;
}

export interface CandidateResult {
  worker: WorkerCandidate;
  isEligible: boolean;
  hardFilterReason?: string;
  scores: FactorBreakdown;
  rank?: number;
}

export interface DispatchEvaluationResult {
  bookingId: string;
  selectedWorkerId: string | null;
  hardFilteredCount: number;
  totalCandidatesEvaluated: number;
  candidates: CandidateResult[];
  weightsUsed: DispatchWeights;
  rationale: string;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function evaluateFairDispatch(
  bookingId: string,
  targetLat: number,
  targetLng: number,
  requiredSkill: string,
  customWeights: DispatchWeights = DEFAULT_WEIGHTS
): DispatchEvaluationResult {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  const workersRaw = db.prepare(`
    SELECT 
      w.id, w.user_id, u.name, u.phone, u.avatar_url,
      w.skills_json, w.profession, w.verification_status, w.safety_verified,
      w.is_available, w.current_lat, w.current_lng, w.service_radius_km,
      w.total_jobs_completed, w.average_rating, w.fairness_debt,
      w.opportunity_score, w.performance_score, w.wellbeing_index
    FROM worker_profiles w
    JOIN users u ON w.user_id = u.id
  `).all() as any[];

  let hardFilteredCount = 0;
  const evaluatedCandidates: CandidateResult[] = [];

  for (const raw of workersRaw) {
    const skills: string[] = JSON.parse(raw.skills_json || '[]');
    const distanceKm = haversineDistance(targetLat, targetLng, raw.current_lat, raw.current_lng);

    const worker: WorkerCandidate = {
      id: raw.id,
      userId: raw.user_id,
      name: raw.name,
      phone: raw.phone,
      avatarUrl: raw.avatar_url,
      profession: raw.profession || 'Electrician',
      skills,
      verificationStatus: raw.verification_status,
      safetyVerified: Boolean(raw.safety_verified),
      isAvailable: Boolean(raw.is_available),
      lat: raw.current_lat,
      lng: raw.current_lng,
      distanceKm,
      totalJobsCompleted: raw.total_jobs_completed,
      averageRating: raw.average_rating,
      fairnessDebt: raw.fairness_debt,
      opportunityScore: raw.opportunity_score,
      performanceScore: raw.performance_score,
      wellbeingIndex: raw.wellbeing_index,
    };

    // 1. HARD ELIGIBILITY FILTERS
    let isEligible = true;
    let hardFilterReason = '';

    const reqLower = requiredSkill.toLowerCase();
    const profLower = (worker.profession || '').toLowerCase();
    const isAll = reqLower === 'all';
    const hasSkill = isAll || skills.some(s => s.toLowerCase().includes(reqLower) || reqLower.includes(s.toLowerCase()));
    const hasProfessionMatch = isAll || profLower.includes(reqLower) || reqLower.includes(profLower);

    // Filter A: Verification Status
    if (worker.verificationStatus !== 'VERIFIED' || !worker.safetyVerified) {
      isEligible = false;
      hardFilterReason = 'Failed Safety Verification (Pending eShram / Identity audit)';
    }
    // Filter B: Skill/Profession match
    else if (!hasSkill && !hasProfessionMatch) {
      isEligible = false;
      hardFilterReason = `Missing required skill/profession: ${requiredSkill}`;
    }
    // Filter C: Distance <= service_radius_km (or max 25km)
    else if (distanceKm > (raw.service_radius_km || 20.0)) {
      isEligible = false;
      hardFilterReason = `Distance (${distanceKm} km) exceeds maximum service radius (${raw.service_radius_km || 20} km)`;
    }
    // Filter D: Availability
    else if (!worker.isAvailable) {
      isEligible = false;
      hardFilterReason = 'Worker is currently marked Offline or on active job';
    }

    if (!isEligible) {
      hardFilteredCount++;
      evaluatedCandidates.push({
        worker,
        isEligible: false,
        hardFilterReason,
        scores: {
          skillFit: 0,
          reliability: 0,
          proximity: 0,
          availability: 0,
          workerNeed: 0,
          fairnessDebt: 0,
          workloadBalance: 0,
          compositeScore: 0,
        },
      });
      continue;
    }

    // 2. WEIGHTED SCORING FOR ELIGIBLE CANDIDATES
    const skillFit = Math.min(100, Math.max(50, Math.round(60 + (worker.averageRating / 5.0) * 40)));
    const reliability = Math.min(100, Math.max(40, Math.round(worker.performanceScore * 0.7 + (worker.averageRating / 5.0) * 30)));
    const proximity = Math.min(100, Math.max(0, Math.round(100 * (1 - distanceKm / 20.0))));
    const availability = 100;
    const workerNeed = Math.min(100, Math.max(10, Math.round(100 * (1 - Math.min(worker.totalJobsCompleted, 30) / 30.0))));
    const fairnessDebtScore = Math.min(100, Math.max(10, Math.round(50 + worker.fairnessDebt * 1.4)));
    const workloadBalance = Math.min(100, Math.max(10, Math.round(100 * (1 - Math.min(worker.totalJobsCompleted, 40) / 40.0))));

    const compositeScore = Math.round(
      skillFit * weights.skillFit +
      reliability * weights.reliability +
      proximity * weights.proximity +
      availability * weights.availability +
      workerNeed * weights.workerNeed +
      fairnessDebtScore * weights.fairnessDebt +
      workloadBalance * weights.workloadBalance
    );

    evaluatedCandidates.push({
      worker,
      isEligible: true,
      scores: {
        skillFit,
        reliability,
        proximity,
        availability,
        workerNeed,
        fairnessDebt: fairnessDebtScore,
        workloadBalance,
        compositeScore,
      },
    });
  }

  const eligibleCandidates = evaluatedCandidates
    .filter(c => c.isEligible)
    .sort((a, b) => b.scores.compositeScore - a.scores.compositeScore);

  eligibleCandidates.forEach((cand, idx) => {
    cand.rank = idx + 1;
  });

  const selectedCandidate = eligibleCandidates.length > 0 ? eligibleCandidates[0] : null;
  const selectedWorkerId = selectedCandidate ? selectedCandidate.worker.id : null;

  let rationale = '';
  if (!selectedCandidate) {
    rationale = `No eligible workers found matching skill/profession "${requiredSkill}". (${hardFilteredCount} candidate(s) filtered out by hard eligibility).`;
  } else {
    const top2 = eligibleCandidates.slice(0, 2);
    if (top2.length > 1) {
      const winner = top2[0];
      const runnerUp = top2[1];
      rationale = `Selected ${winner.worker.name} (Match Score: ${winner.scores.compositeScore}/100) over ${runnerUp.worker.name} (Match Score: ${runnerUp.scores.compositeScore}/100). `;
      if (winner.scores.fairnessDebt > runnerUp.scores.fairnessDebt) {
        rationale += `While ${runnerUp.worker.name} has rating ${runnerUp.worker.averageRating}, ${winner.worker.name} was selected due to higher Opportunity Fairness Debt (+${winner.worker.fairnessDebt} vs +${runnerUp.worker.fairnessDebt}) and work distribution equity.`;
      } else {
        rationale += `${winner.worker.name} demonstrated higher overall proximity (${winner.worker.distanceKm} km) and skill fit (${winner.scores.skillFit}/100).`;
      }
    } else {
      rationale = `Selected ${selectedCandidate.worker.name} (Match Score: ${selectedCandidate.scores.compositeScore}/100) as top eligible candidate matching skill/profession "${requiredSkill}".`;
    }
  }

  if (selectedWorkerId && bookingId && !bookingId.startsWith('sim-')) {
    db.prepare(`
      INSERT INTO dispatch_logs (id, booking_id, selected_worker_id, hard_filtered_count, candidate_breakdowns_json, weights_used_json, selected_rationale)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `disp-${Date.now()}`,
      bookingId,
      selectedWorkerId,
      hardFilteredCount,
      JSON.stringify(evaluatedCandidates),
      JSON.stringify(weights),
      rationale
    );
  }

  return {
    bookingId,
    selectedWorkerId,
    hardFilteredCount,
    totalCandidatesEvaluated: evaluatedCandidates.length,
    candidates: evaluatedCandidates.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.scores.compositeScore - a.scores.compositeScore;
    }),
    weightsUsed: weights,
    rationale,
  };
}
