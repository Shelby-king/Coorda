import api from './axios';
import type { CreditPackage, CreditTransaction } from '@/types';

export async function getCreditPackages(): Promise<{ packages: CreditPackage[] }> {
  const res = await api.get<{ packages: CreditPackage[] }>('/credits/packages');
  return res.data;
}

export async function getCreditBalance(): Promise<{ userId: string; credits: number }> {
  const res = await api.get<{ userId: string; credits: number }>('/credits/balance');
  return res.data;
}

export async function purchaseCredits(data: {
  packageId: string;
  paymentReference: string;
}): Promise<{
  success: boolean;
  packagePurchased: CreditPackage;
  newBalance: number;
  paymentReference: string;
}> {
  const res = await api.post('/credits/purchase', data);
  return res.data;
}

export async function useCredits(data: {
  amount: number;
  description: string;
}): Promise<{ success: boolean; deducted: number; newBalance: number }> {
  const res = await api.post('/credits/use', data);
  return res.data;
}

export async function getCreditHistory(
  limit = 20
): Promise<{ data: CreditTransaction[]; count: number }> {
  const res = await api.get<{ data: CreditTransaction[]; count: number }>('/credits/history', {
    params: { limit },
  });
  return res.data;
}
