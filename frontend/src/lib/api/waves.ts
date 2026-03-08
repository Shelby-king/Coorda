import api from './axios';
import type { Wave, Submission } from '@/types';

export async function getWave(id: string): Promise<Wave> {
  const res = await api.get<Wave>(`/waves/${id}`);
  return res.data;
}

export async function createWave(data: {
  buildathonId: string;
  name: string;
  description?: string;
  maxBuilders: number;
  requirements?: string[];
  prizeAmount?: number;
  deadline?: string;
}): Promise<Wave> {
  const res = await api.post<Wave>('/waves', data);
  return res.data;
}

export async function joinWave(id: string): Promise<Wave> {
  const res = await api.post<Wave>(`/waves/${id}/join`);
  return res.data;
}

export async function getWaveBuilders(id: string): Promise<{
  waveId: string;
  count: number;
  builders: { uid: string; displayName?: string; email: string; flowAddress?: string }[];
}> {
  const res = await api.get(`/waves/${id}/builders`);
  return res.data;
}

export async function getWaveSubmissions(
  id: string
): Promise<{ data: Submission[]; count: number }> {
  const res = await api.get<{ data: Submission[]; count: number }>(`/waves/${id}/submissions`);
  return res.data;
}

export async function updateWave(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    status: Wave['status'];
    maxBuilders: number;
    requirements: string[];
    deadline: string;
  }>
): Promise<Wave> {
  const res = await api.put<Wave>(`/waves/${id}`, data);
  return res.data;
}
