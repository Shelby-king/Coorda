'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listBuildathons } from '@/lib/api/buildathons';
import { getWave } from '@/lib/api/waves';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ToastContainer } from '@/components/shared/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { Buildathon, Wave } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const [buildathons, setBuildathons] = useState<Buildathon[]>([]);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        if (user.role === 'host') {
          const result = await listBuildathons({ hostId: user.uid, limit: 20 });
          setBuildathons(result.data);
        }
        // For developers: we'd need an endpoint for "my waves" — using buildathons list as proxy
        else {
          const result = await listBuildathons({ status: 'active', limit: 20 });
          setBuildathons(result.data);
        }
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading || !user) return null;

  const isHost = user.role === 'host';

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-green-accent flex items-center justify-center">
                <span className="font-display font-bold text-base text-lg">
                  {(user.displayName || user.email)?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {user.displayName || 'Welcome back'}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-text-secondary capitalize">{user.role}</span>
                  <span className="text-text-muted">·</span>
                  <span className="font-body text-sm text-cyan">{user.credits ?? 0} credits</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {isHost ? (
              <Link href="/buildathons/new" className="btn btn-primary">
                + New buildathon
              </Link>
            ) : (
              <Link href="/buildathons" className="btn btn-primary">
                Browse buildathons →
              </Link>
            )}
            <Link href="/credits" className="btn btn-secondary">
              Buy credits
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {isHost ? [
            { label: 'Total buildathons', value: buildathons.length },
            { label: 'Active', value: buildathons.filter(b => b.status === 'active').length },
            { label: 'Completed', value: buildathons.filter(b => b.status === 'completed').length },
            { label: 'Credits', value: user.credits ?? 0 },
          ] : [
            { label: 'Active buildathons', value: buildathons.length },
            { label: 'Available credits', value: user.credits ?? 0 },
            { label: 'Role', value: 'Developer' },
            { label: 'Status', value: 'Active' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <div className="font-body text-xs text-text-muted mb-1">{label}</div>
              <div className="font-display font-bold text-2xl text-text-primary">{value}</div>
            </div>
          ))}
        </div>

        {/* Flow address */}
        {user.flowAddress && (
          <div className="rounded-xl border border-border bg-surface p-4 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-accent/10 border border-green-accent/20 flex items-center justify-center">
              <span className="text-green-accent text-sm">⟁</span>
            </div>
            <div>
              <div className="font-body text-xs text-text-muted">Flow wallet</div>
              <div className="font-mono text-sm text-text-primary">{user.flowAddress}</div>
            </div>
          </div>
        )}

        {/* Buildathons section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-text-primary">
              {isHost ? 'Your buildathons' : 'Active buildathons'}
            </h2>
            <Link href="/buildathons" className="font-body text-sm text-cyan hover:text-cyan-dim transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : buildathons.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <div className="text-4xl mb-3">🏁</div>
              <p className="font-display font-semibold text-text-primary mb-2">
                {isHost ? 'No buildathons yet' : 'No active buildathons'}
              </p>
              <p className="font-body text-text-muted text-sm mb-4">
                {isHost ? 'Create your first buildathon to get started.' : 'Check back soon!'}
              </p>
              {isHost && (
                <Link href="/buildathons/new" className="btn btn-primary">
                  Create buildathon
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {buildathons.map((b) => (
                <Link
                  key={b.id}
                  href={`/buildathons/${b.id}`}
                  className="group rounded-xl border border-border bg-surface p-5 glass-hover flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-text-primary group-hover:text-cyan transition-colors line-clamp-2 text-sm leading-snug">
                      {b.title}
                    </h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="font-body text-xs text-text-secondary line-clamp-2 flex-1">{b.description}</p>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-display font-bold text-text-primary">
                      {b.prizePool.toLocaleString()} <span className="text-text-muted font-body font-normal text-xs">{b.currency}</span>
                    </span>
                    <span className="text-xs font-body text-text-muted">
                      {new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Quick actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/credits', icon: '💳', label: 'Buy credits' },
              { href: '/profile', icon: '👤', label: 'Edit profile' },
              { href: '/buildathons', icon: '🔍', label: 'Browse all' },
              { href: isHost ? '/buildathons/new' : '/buildathons', icon: isHost ? '✨' : '🚀', label: isHost ? 'New buildathon' : 'Find buildathon' },
            ].map(({ href, icon, label }) => (
              <Link
                key={href + label}
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-elevated hover:border-border-bright hover:bg-elevated/80 transition-all text-center"
              >
                <span className="text-2xl">{icon}</span>
                <span className="font-body text-xs text-text-secondary">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
