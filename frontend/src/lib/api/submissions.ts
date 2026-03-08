import api from './axios';
import type { Submission } from '@/types';

export async function createSubmission(formData: FormData): Promise<Submission> {
  const res = await api.post<Submission>('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getSubmission(id: string): Promise<Submission> {
  const res = await api.get<Submission>(`/submissions/${id}`);
  return res.data;
}

export async function verifySubmission(
  id: string,
  model: 'gemini' | 'claude' | 'openai'
): Promise<Submission> {
  const res = await api.post<Submission>(`/submissions/${id}/verify`, { model });
  return res.data;
}
