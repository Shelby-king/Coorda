export interface User {
  uid: string;
  email: string;
  role: 'host' | 'developer';
  displayName?: string;
  flowAddress?: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Buildathon {
  id: string;
  title: string;
  description: string;
  hostId: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  prizePool: number;
  currency: string;
  startDate: string;
  endDate: string;
  requirements: string[];
  maxWaves?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wave {
  id: string;
  buildathonId: string;
  hostId: string;
  name: string;
  description?: string;
  maxBuilders: number;
  builders: string[];
  status: 'open' | 'closed' | 'completed';
  prizeAmount?: number;
  requirements?: string[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  waveId: string;
  buildathonId: string;
  devId: string;
  repoUrl?: string;
  description?: string;
  projectName?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  metadataCid?: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationStatus: 'unverified' | 'verified' | 'failed';
  verificationScore?: number;
  verificationModel?: string;
  verificationCreditCost?: number;
  verifiedAt?: string;
  verificationResult?: VerificationResult;
  repoAnalysis?: RepoAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationResult {
  score: number;
  requirementChecks: RequirementCheck[];
  redFlags: string[];
  summary: string;
  recommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
}

export interface RequirementCheck {
  requirement: string;
  status: 'YES' | 'NO' | 'PARTIAL';
  reason: string;
}

export interface RepoAnalysis {
  repoAgeInDays: number;
  info: {
    language: string;
    isFork?: boolean;
    stargazersCount: number;
  };
  commits: {
    totalCommits: number;
    latestCommit?: { date: string };
  };
  languages?: Record<string, { bytes: number; percentage: string }>;
  flags: string[];
}

export interface Escrow {
  id: string;
  buildathonId: string;
  hostId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'locked' | 'released' | 'disputed' | 'resolved' | 'cancelled';
  flowTxId?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackage {
  id: string;
  credits: number;
  priceUsd: number;
  label: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'deduction' | 'manual_deduction';
  description: string;
  createdAt: string;
}
