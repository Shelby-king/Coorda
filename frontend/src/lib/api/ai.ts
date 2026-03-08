import api from './axios';
import type { VerificationResult, RepoAnalysis } from '@/types';

type AIModel = 'gemini' | 'claude' | 'openai';

interface VerifyRepoResponse {
  repoUrl: string;
  model: string;
  creditCost: number;
  repoAnalysis: RepoAnalysis;
  verification: VerificationResult;
}

export async function verifyRepo(data: {
  repoUrl: string;
  requirements: string[];
  model?: AIModel;
  hackathonStartDate?: string;
}): Promise<VerifyRepoResponse> {
  const res = await api.post<VerifyRepoResponse>('/ai/verify-repo', data);
  return res.data;
}

interface CheckRequirementsResponse {
  model: string;
  creditCost: number;
  verification: VerificationResult;
}

export async function checkRequirements(data: {
  description: string;
  requirements: string[];
  model?: AIModel;
}): Promise<CheckRequirementsResponse> {
  const res = await api.post<CheckRequirementsResponse>('/ai/check-requirements', data);
  return res.data;
}

interface AnalyzeSubmissionResponse {
  model: string;
  creditCost: number;
  verification: VerificationResult;
  submissionData: { repoUrl?: string; description?: string; repoAnalysis?: RepoAnalysis };
}

export async function analyzeSubmission(data: {
  submissionData: { repoUrl?: string; description?: string; projectName?: string };
  requirements: string[];
  model?: AIModel;
}): Promise<AnalyzeSubmissionResponse> {
  const res = await api.post<AnalyzeSubmissionResponse>('/ai/analyze-submission', data);
  return res.data;
}
