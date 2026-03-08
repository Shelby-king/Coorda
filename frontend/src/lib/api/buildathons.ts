import api from './axios';
import type { Buildathon, Wave } from '@/types';

interface ListBuildathonsParams {
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  hostId?: string;
  limit?: number;
  offset?: number;
}

export async function listBuildathons(
  params?: ListBuildathonsParams
): Promise<{ data: Buildathon[]; count: number }> {
  const res = await api.get<{ data: Buildathon[]; count: number }>('/buildathons', { params });
  return res.data;
}

export async function getBuildathon(id: string): Promise<Buildathon> {
  const res = await api.get<Buildathon>(`/buildathons/${id}`);
  return res.data;
}

export async function createBuildathon(data: {
  title: string;
  description: string;
  prizePool: number;
  currency?: string;
  startDate: string;
  endDate: string;
  requirements?: string[];
  maxWaves?: number;
}): Promise<Buildathon> {
  const res = await api.post<Buildathon>('/buildathons', data);
  return res.data;
}

export async function updateBuildathon(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    status: Buildathon['status'];
    prizePool: number;
    requirements: string[];
  }>
): Promise<Buildathon> {
  const res = await api.put<Buildathon>(`/buildathons/${id}`, data);
  return res.data;
}

export async function getBuildathonWaves(id: string): Promise<{ data: Wave[]; count: number }> {
  const res = await api.get<{ data: Wave[]; count: number }>(`/buildathons/${id}/waves`);
  return res.data;
}
