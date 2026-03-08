import api from './axios';
import type { Escrow } from '@/types';

export async function createEscrow(data: {
  buildathonId: string;
  amount: number;
  currency?: string;
  flowTxId?: string;
}): Promise<Escrow> {
  const res = await api.post<Escrow>('/escrow/create', data);
  return res.data;
}

export async function lockEscrow(data: {
  escrowId: string;
  flowTxId: string;
}): Promise<Escrow> {
  const res = await api.post<Escrow>('/escrow/lock', data);
  return res.data;
}

export async function releaseEscrow(data: {
  escrowId: string;
  recipientId: string;
  flowTxId: string;
}): Promise<Escrow> {
  const res = await api.post<Escrow>('/escrow/release', data);
  return res.data;
}

export async function disputeEscrow(data: {
  escrowId: string;
  reason: string;
}): Promise<Escrow> {
  const res = await api.post<Escrow>('/escrow/dispute', data);
  return res.data;
}

export async function getEscrowStatus(id: string): Promise<Escrow> {
  const res = await api.get<Escrow>(`/escrow/status/${id}`);
  return res.data;
}
