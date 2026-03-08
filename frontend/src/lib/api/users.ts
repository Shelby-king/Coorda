import api from './axios';
import type { User } from '@/types';

export async function createOrGetUser(data: {
  email: string;
  role: 'host' | 'developer';
  displayName?: string;
  flowAddress?: string;
}): Promise<User> {
  const res = await api.post<User>('/users', data);
  return res.data;
}

export async function getUser(id: string): Promise<User> {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'displayName' | 'flowAddress' | 'role'>>
): Promise<User> {
  const res = await api.put<User>(`/users/${id}`, data);
  return res.data;
}

export async function getUserBalance(id: string): Promise<{ userId: string; credits: number }> {
  const res = await api.get<{ userId: string; credits: number }>(`/users/${id}/balance`);
  return res.data;
}
