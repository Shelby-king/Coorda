'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  getCreditPackages,
  getCreditBalance,
  purchaseCredits,
  getCreditHistory,
} from '@/lib/api/credits';
import { ToastContainer } from '@/components/shared/Toast';
import { SkeletonRow } from '@/components/shared/SkeletonCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { CreditPackage, CreditTransaction } from '@/types';

export default function CreditsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null);
  const [payRef, setPayRef] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [pkgs, bal, hist] = await Promise.all([
          getCreditPackages(),
          getCreditBalance(),
          getCreditHistory(20),
        ]);
        setPackages(pkgs.packages);
        setBalance(bal.credits);
        setHistory(hist.data);
      } catch {
        toast.error('Failed to load credits');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePurchase = async () => {
    if (!selectedPkg || !payRef) return;
    setPurchasing(true);
    try {
      const result = await purchaseCredits({ packageId: selectedPkg.id, paymentReference: payRef });
      setBalance(result.newBalance);
      setSelectedPkg(null);
      setPayRef('');
      await refreshUser();
      toast.success(`${result.packagePurchased.credits} credits added!`);
      // Refresh history
      const hist = await getCreditHistory(20);
      setHistory(hist.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Credits</h1>
          <p className="font-body text-text-secondary">
            Credits power AI verification. Purchase a package to run verifications on submissions.
          </p>
        </div>

        {/* Balance banner */}
        <div className="rounded-2xl border border-cyan/20 bg-gradient-to-r from-cyan/8 to-green-accent/5 p-6 mb-10 flex items-center justify-between gap-6">
          <div>
            <div className="font-body text-sm text-text-muted mb-1">Current balance</div>
            <div className="font-display text-5xl font-black text-text-primary">
              {balance !== null ? (balance % 1 === 0 ? balance : balance.toFixed(1)) : '—'}
            </div>
            <div className="font-body text-sm text-text-secondary mt-1">credits</div>
          </div>
          <div className="text-right">
            <div className="font-body text-xs text-text-muted mb-2">Cost per verification</div>
            <div className="space-y-1 text-right">
              {[['Gemini', '0.5'], ['Claude', '1.0'], ['GPT-4o', '1.5']].map(([name, cost]) => (
                <div key={name} className="font-body text-xs text-text-secondary flex items-center justify-end gap-2">
                  <span>{name}</span>
                  <span className="font-mono text-cyan">{cost} cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Packages */}
        <h2 className="font-display text-xl font-bold text-text-primary mb-5">Purchase credits</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-36 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={clsx(
                  'flex flex-col p-5 rounded-xl border text-left transition-all duration-200 relative overflow-hidden',
                  selectedPkg?.id === pkg.id
                    ? 'border-cyan bg-cyan/8 shadow-glow-cyan'
                    : 'border-border bg-surface hover:border-border-bright glass-hover',
                  pkg.id === 'pro' && 'ring-1 ring-green-accent/30'
                )}
              >
                {pkg.id === 'pro' && (
                  <div className="absolute top-0 right-0 bg-green-accent text-base text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <div className="font-display font-bold text-2xl text-text-primary mb-1">
                  {pkg.credits}
                </div>
                <div className="font-body text-xs text-text-muted mb-3">credits</div>
                <div className="font-display font-bold text-lg text-text-primary">${pkg.priceUsd}</div>
                <div className="font-body text-xs text-text-muted">{pkg.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Purchase form */}
        {selectedPkg && (
          <div className="rounded-xl border border-cyan/20 bg-surface p-6 mb-10">
            <h3 className="font-display font-semibold text-text-primary mb-4">
              Purchase {selectedPkg.credits} credits — ${selectedPkg.priceUsd}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Payment reference</label>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder="stripe-pi-xxx or payment ID"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
                <p className="text-xs font-body text-text-muted mt-1">
                  Enter your Stripe payment intent ID or other payment reference.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedPkg(null); setPayRef(''); }} className="btn btn-ghost">
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || !payRef}
                  className="btn btn-primary flex-1"
                >
                  {purchasing ? 'Processing…' : `Buy ${selectedPkg.credits} credits`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-5">History</h2>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {loading ? (
              <div className="divide-y divide-border">
                {[1,2,3].map(i => <div key={i} className="px-5"><SkeletonRow /></div>)}
              </div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-body text-text-muted text-sm">No transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-4 px-5 py-4">
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm mt-0.5',
                      tx.type === 'purchase'
                        ? 'bg-green-accent/10 text-green-accent'
                        : 'bg-red-900/20 text-red-400'
                    )}>
                      {tx.type === 'purchase' ? '+' : '−'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-text-primary leading-snug">
                        {tx.description}
                      </p>
                      <p className="font-body text-xs text-text-muted mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className={clsx(
                      'font-mono font-bold text-sm shrink-0',
                      tx.amount > 0 ? 'text-green-accent' : 'text-red-400'
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
