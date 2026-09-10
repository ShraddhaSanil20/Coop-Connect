export type Role = 'CUSTOMER' | 'WORKER' | 'COOP_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  workerProfile?: WorkerProfile | null;
}

export interface WorkerProfile {
  id: string;
  userId?: string;
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  profession?: string;
  locality?: string;
  skills: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  safetyVerified: boolean;
  isAvailable: boolean;
  lat?: number;
  lng?: number;
  serviceRadiusKm?: number;
  experienceYears?: number;
  totalJobsCompleted: number;
  averageRating: number;
  fairnessDebt: number;
  opportunityScore: number;
  performanceScore: number;
  wellbeingIndex: number;
}

export interface ServiceCategory {
  id: string;
  title: string;
  category: string;
  base_price: number;
  estimated_duration_mins: number;
  icon: string;
  description: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  worker_id?: string;
  service_id: string;
  service_title?: string;
  service_category?: string;
  worker_name?: string;
  worker_phone?: string;
  worker_avatar?: string;
  status: 'REQUESTED' | 'DISPATCHING' | 'DISPATCHED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  address: string;
  lat: number;
  lng: number;
  scheduled_time: string;
  total_amount: number;
  coop_fee: number;
  welfare_fee: number;
  worker_earnings: number;
  payment_status: 'PENDING_ESCROW' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED';
  created_at: string;
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
  worker: {
    id: string;
    name: string;
    phone: string;
    avatarUrl: string;
    skills: string[];
    verificationStatus: string;
    safetyVerified: boolean;
    isAvailable: boolean;
    distanceKm: number;
    totalJobsCompleted: number;
    averageRating: number;
    fairnessDebt: number;
  };
  isEligible: boolean;
  hardFilterReason?: string;
  scores: FactorBreakdown;
  rank?: number;
}

export interface DispatchSimulationResult {
  bookingId: string;
  selectedWorkerId: string | null;
  hardFilteredCount: number;
  totalCandidatesEvaluated: number;
  candidates: CandidateResult[];
  weightsUsed: Record<string, number>;
  rationale: string;
}

export interface CooperativePulseData {
  activeWorkers: number;
  totalWorkers: number;
  activeJobs: number;
  totalBookings: number;
  grossGMV: number;
  coopRevenue: number;
  welfareContributions: number;
  totalWorkerPayouts: number;
  welfareFundBalance: number;
  activeProposals: number;
  opportunityDeficitBalance: number;
  avgFairnessDebt: number;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  proposerName?: string;
  proposer_name?: string;
  status: string;
  quorumRequired?: number;
  quorum_required?: number;
  votesFor?: number;
  votes_for?: number;
  votesAgainst?: number;
  votes_against?: number;
  votesAbstain?: number;
  votes_abstain?: number;
  totalVotes?: number;
  total_votes?: number;
  endsAt?: string;
  ends_at?: string;
  userVote?: string | null;
  user_vote?: string | null;
}

export interface WelfareLog {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  worker_name?: string;
  created_at: string;
}
