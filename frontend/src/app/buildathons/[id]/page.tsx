'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBuildathon, getBuildathonWaves, updateBuildathon } from '@/lib/api/buildathons';
import { createWave } from '@/lib/api/waves';
import { getEscrowStatus, createEscrow, lockEscrow } from '@/lib/api/escrow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ToastContainer } from '@/components/shared/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { Buildathon, Wave, Escrow } from '@/types';

export default function BuildathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toasts, toast, removeToast } = useToast();

  const [buildathon, setBuildathon] = useState<Buildathon | null>(null);
  const [waves, setWaves] = useState<Wave[]>([]);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);

  // Wave creation modal
  const [showWaveForm, setShowWaveForm] = useState(false);
  const [waveForm, setWaveForm] = useState({ name: '', description: '', maxBuilders: 10, prizeAmount: 0, deadline: '' });
  const [waveLoading, setWaveLoading] = useState(false);

  // Escrow modal
  const [showEscrowForm, setShowEscrowForm] = useState(false);
  const [escrowTxId, setEscrowTxId] = useState('');
  const [escrowLoading, setEscrowLoading] = useState(false);

  const isHost = user?.uid === buildathon?.hostId;

  useEffect(() => {
    const load = async () => {
      try {
        const [b, w] = await Promise.all([getBuildathon(id), getBuildathonWaves(id)]);
        setBuildathon(b);
        setWaves(w.data);
        // try to load escrow if host
        if (user) {
          try {
            const e = await getEscrowStatus(id);
            setEscrow(e);
          } catch { /* no escrow yet */ }
        }
      } catch {
        toast.error('Failed to load buildathon');
        router.push('/buildathons');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleActivate = async () => {
    if (!buildathon) return;
    try {
      const updated = await updateBuildathon(buildathon.id, { status: 'active' });
      setBuildathon(updated);
      toast.success('Buildathon activated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate');
    }
  };

  const handleCreateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildathon) return;
    setWaveLoading(true);
    try {
      const wave = await createWave({
        buildathonId: buildathon.id,
        name: waveForm.name,
        description: waveForm.description || undefined,
        maxBuilders: waveForm.maxBuilders,
        prizeAmount: waveForm.prizeAmount || undefined,
        deadline: waveForm.deadline || undefined,
      });
      setWaves((prev) => [...prev, wave]);
      setShowWaveForm(false);
      setWaveForm({ name: '', description: '', maxBuilders: 10, prizeAmount: 0, deadline: '' });
      toast.success('Wave created!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create wave');
    } finally {
      setWaveLoading(false);
    }
  };

  const handleCreateEscrow = async () => {
    if (!buildathon) return;
    setEscrowLoading(true);
    try {
      const e = await createEscrow({ buildathonId: buildathon.id, amount: buildathon.prizePool, currency: buildathon.currency });
      setEscrow(e);
      toast.success('Escrow record created. Provide a Flow tx ID to lock.');
      setShowEscrowForm(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create escrow');
    } finally {
      setEscrowLoading(false);
    }
  };

  const handleLockEscrow = async () => {
    if (!escrow || !escrowTxId) return;
    setEscrowLoading(true);
    try {
      const updated = await lockEscrow({ escrowId: escrow.id, flowTxId: escrowTxId });
      setEscrow(updated);
      setShowEscrowForm(false);
      toast.success('Funds locked in escrow!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to lock escrow');
    } finally {
      setEscrowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-8 bg-elevated rounded w-1/2 mb-4 animate-pulse" />
        <div className="h-4 bg-elevated rounded w-3/4 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!buildathon) return null;

  const start = new Date(buildathon.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const end   = new Date(buildathon.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-body text-text-muted mb-8">
          <Link href="/buildathons" className="hover:text-text-secondary transition-colors">Buildathons</Link>
          <span>/</span>
          <span className="text-text-secondary truncate">{buildathon.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <StatusBadge status={buildathon.status} />
              <span className="font-mono text-xs text-text-muted bg-elevated px-2 py-0.5 rounded">{buildathon.currency}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-text-primary mb-4 leading-tight">
              {buildathon.title}
            </h1>
            <p className="font-body text-text-secondary leading-relaxed">{buildathon.description}</p>
          </div>

          {/* Prize */}
          <div className="shrink-0 rounded-2xl border border-cyan/20 bg-cyan/5 p-6 text-center min-w-[160px]">
            <div className="font-display text-3xl font-black text-text-primary mb-1">
              {buildathon.prizePool.toLocaleString()}
            </div>
            <div className="font-body text-sm text-cyan">{buildathon.currency} prize pool</div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Start', value: start },
            { label: 'End', value: end },
            { label: 'Waves', value: waves.length.toString() },
            { label: 'Status', value: buildathon.status },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <div className="font-body text-xs text-text-muted mb-1">{label}</div>
              <div className="font-display font-semibold text-text-primary capitalize">{value}</div>
            </div>
          ))}
        </div>

        {/* Requirements */}
        {buildathon.requirements.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 mb-8">
            <h3 className="font-display font-semibold text-text-primary mb-3">Requirements</h3>
            <ul className="space-y-2">
              {buildathon.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 font-body text-sm text-text-secondary">
                  <span className="text-cyan mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Escrow panel (host only) */}
        {isHost && (
          <div className="rounded-xl border border-border bg-surface p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-text-primary">Escrow</h3>
              {escrow && <StatusBadge status={escrow.status} />}
            </div>
            {escrow ? (
              <div className="space-y-2 font-body text-sm text-text-secondary">
                <div>Amount: <span className="text-text-primary font-semibold">{escrow.amount} {escrow.currency}</span></div>
                {escrow.flowTxId && <div className="font-mono text-xs text-text-muted break-all">Tx: {escrow.flowTxId}</div>}
                {escrow.status === 'pending' && (
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      className="input text-xs font-mono"
                      placeholder="Flow transaction ID"
                      value={escrowTxId}
                      onChange={(e) => setEscrowTxId(e.target.value)}
                    />
                    <button onClick={handleLockEscrow} disabled={escrowLoading || !escrowTxId} className="btn btn-primary self-start">
                      Lock escrow
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleCreateEscrow} disabled={escrowLoading} className="btn btn-secondary">
                {escrowLoading ? 'Creating…' : 'Create escrow record'}
              </button>
            )}
          </div>
        )}

        {/* Host actions */}
        {isHost && buildathon.status === 'draft' && (
          <div className="flex gap-3 mb-8">
            <button onClick={() => setShowWaveForm(true)} className="btn btn-secondary">
              + Add wave
            </button>
            <button onClick={handleActivate} className="btn btn-primary">
              Activate buildathon
            </button>
          </div>
        )}
        {isHost && buildathon.status === 'active' && (
          <button onClick={() => setShowWaveForm(true)} className="btn btn-secondary mb-8">
            + Add wave
          </button>
        )}

        {/* Waves */}
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-5">
            Waves <span className="text-text-muted text-lg font-normal">({waves.length})</span>
          </h2>
          {waves.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-border bg-surface">
              <p className="font-body text-text-muted">No waves yet.{isHost ? ' Add one above.' : ''}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {waves.map((w) => (
                <Link
                  key={w.id}
                  href={`/waves/${w.id}`}
                  className="group rounded-xl border border-border bg-surface p-5 glass-hover flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-bold text-text-primary group-hover:text-cyan transition-colors line-clamp-1">{w.name}</h3>
                    <StatusBadge status={w.status} />
                  </div>
                  {w.description && (
                    <p className="font-body text-sm text-text-secondary line-clamp-2">{w.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm font-body text-text-muted mt-auto pt-3 border-t border-border">
                    <span>{w.builders.length}/{w.maxBuilders} builders</span>
                    {w.prizeAmount && <span className="text-green-accent font-semibold">{w.prizeAmount} {buildathon.currency}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wave creation modal */}
      {showWaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-text-primary mb-5">Create Wave</h2>
            <form onSubmit={handleCreateWave} className="space-y-4">
              <div>
                <label className="label">Wave name *</label>
                <input className="input" value={waveForm.name} onChange={(e) => setWaveForm(f => ({ ...f, name: e.target.value }))} placeholder="Wave 1 — DeFi Tools" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={waveForm.description} onChange={(e) => setWaveForm(f => ({ ...f, description: e.target.value }))} placeholder="What should builders create?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max builders *</label>
                  <input type="number" min={1} className="input" value={waveForm.maxBuilders} onChange={(e) => setWaveForm(f => ({ ...f, maxBuilders: parseInt(e.target.value) || 1 }))} required />
                </div>
                <div>
                  <label className="label">Prize ({buildathon.currency})</label>
                  <input type="number" min={0} className="input" value={waveForm.prizeAmount} onChange={(e) => setWaveForm(f => ({ ...f, prizeAmount: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="datetime-local" className="input" value={waveForm.deadline} onChange={(e) => setWaveForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWaveForm(false)} className="btn btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={waveLoading} className="btn btn-primary flex-1">
                  {waveLoading ? 'Creating…' : 'Create wave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
