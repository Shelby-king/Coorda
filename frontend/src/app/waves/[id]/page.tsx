'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWave, joinWave, getWaveBuilders, getWaveSubmissions } from '@/lib/api/waves';
import { verifySubmission } from '@/lib/api/submissions';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ScoreRing } from '@/components/shared/ScoreRing';
import { SkeletonCard, SkeletonRow } from '@/components/shared/SkeletonCard';
import { ToastContainer } from '@/components/shared/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { Wave, Submission } from '@/types';

export default function WaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { toasts, toast, removeToast } = useToast();

  const [wave, setWave] = useState<Wave | null>(null);
  const [builders, setBuilders] = useState<{ uid: string; displayName?: string; email: string }[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const hasJoined = user ? wave?.builders.includes(user.uid) : false;
  const isHost = user?.uid === wave?.hostId;
  const spotsLeft = wave ? wave.maxBuilders - wave.builders.length : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const w = await getWave(id);
        setWave(w);
        if (user) {
          const [b, s] = await Promise.all([
            getWaveBuilders(id),
            getWaveSubmissions(id),
          ]);
          setBuilders(b.builders);
          setSubmissions(s.data);
        }
      } catch {
        toast.error('Failed to load wave');
        router.push('/buildathons');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleJoin = async () => {
    if (!wave) return;
    setJoining(true);
    try {
      const updated = await joinWave(id);
      setWave(updated);
      toast.success('You joined the wave!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleVerify = async (submissionId: string, model: 'gemini' | 'claude' | 'openai') => {
    setVerifying(submissionId);
    try {
      const updated = await verifySubmission(submissionId, model);
      setSubmissions((prev) => prev.map((s) => s.id === submissionId ? updated : s));
      await refreshUser();
      toast.success(`Verified with ${model}! Score: ${updated.verificationScore}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-8 bg-elevated rounded w-1/2 mb-4 animate-pulse" />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (!wave) return null;

  const deadline = wave.deadline
    ? new Date(wave.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-body text-text-muted mb-8">
          <Link href="/buildathons" className="hover:text-text-secondary">Buildathons</Link>
          <span>/</span>
          <Link href={`/buildathons/${wave.buildathonId}`} className="hover:text-text-secondary truncate">
            Buildathon
          </Link>
          <span>/</span>
          <span className="text-text-secondary truncate">{wave.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4 flex-wrap mb-4">
              <StatusBadge status={wave.status} />
              {wave.prizeAmount && (
                <span className="font-body text-sm text-green-accent border border-green-accent/30 bg-green-accent/10 px-2.5 py-0.5 rounded-full">
                  {wave.prizeAmount} FLOW prize
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-black text-text-primary mb-4 leading-tight">
              {wave.name}
            </h1>

            {wave.description && (
              <p className="font-body text-text-secondary leading-relaxed mb-6">{wave.description}</p>
            )}

            {/* Requirements */}
            {wave.requirements && wave.requirements.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 mb-6">
                <h3 className="font-display font-semibold text-text-primary mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {wave.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 font-body text-sm text-text-secondary">
                      <span className="text-cyan mt-0.5 shrink-0">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submissions (visible if joined or host) */}
            {user && (hasJoined || isHost) && (
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                  Submissions ({submissions.length})
                </h2>
                {submissions.length === 0 ? (
                  <div className="rounded-xl border border-border bg-surface p-6 text-center">
                    <p className="font-body text-text-muted text-sm">No submissions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((s) => (
                      <SubmissionCard
                        key={s.id}
                        submission={s}
                        isHost={isHost}
                        verifying={verifying === s.id}
                        onVerify={(model) => handleVerify(s.id, model)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0 space-y-4">
            {/* Slot counter */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm text-text-secondary">Slots available</span>
                <span className={`font-display font-bold ${spotsLeft > 0 ? 'text-green-accent' : 'text-red-400'}`}>
                  {spotsLeft}/{wave.maxBuilders}
                </span>
              </div>
              {/* Slot bar */}
              <div className="w-full h-2 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan to-green-accent transition-all duration-500"
                  style={{ width: `${(wave.builders.length / wave.maxBuilders) * 100}%` }}
                />
              </div>
              {deadline && (
                <div className="mt-3 font-body text-xs text-text-muted">
                  Deadline: <span className="text-text-secondary">{deadline}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {user && wave.status === 'open' && (
              <div className="space-y-2">
                {hasJoined ? (
                  <>
                    <div className="rounded-xl border border-green-accent/20 bg-green-accent/5 p-3 text-center">
                      <span className="font-body text-sm text-green-accent">✓ You&apos;re in this wave</span>
                    </div>
                    <Link
                      href={`/waves/${id}/submit`}
                      className="btn btn-primary w-full"
                    >
                      Submit work →
                    </Link>
                  </>
                ) : spotsLeft > 0 ? (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="btn btn-primary w-full"
                  >
                    {joining ? 'Joining…' : 'Join this wave'}
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-500/20 bg-red-900/10 p-3 text-center">
                    <span className="font-body text-sm text-red-400">Wave is full</span>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <Link href="/login" className="btn btn-primary w-full">
                Sign in to join
              </Link>
            )}

            {/* Builders list */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">
                Builders ({builders.length})
              </h3>
              {builders.length === 0 ? (
                <p className="font-body text-xs text-text-muted">No builders yet.</p>
              ) : (
                <div className="space-y-2">
                  {builders.slice(0, 5).map((b) => (
                    <div key={b.uid} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan to-green-accent flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-base">
                          {(b.displayName || b.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-body text-xs text-text-secondary truncate">
                        {b.displayName || b.email}
                      </span>
                    </div>
                  ))}
                  {builders.length > 5 && (
                    <p className="font-body text-xs text-text-muted">+{builders.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function SubmissionCard({
  submission: s,
  isHost,
  verifying,
  onVerify,
}: {
  submission: Submission;
  isHost: boolean;
  verifying: boolean;
  onVerify: (model: 'gemini' | 'claude' | 'openai') => void;
}) {
  const [showVerifyMenu, setShowVerifyMenu] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-4">
        {s.verificationScore != null && (
          <ScoreRing score={s.verificationScore} size={72} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-display font-semibold text-text-primary">{s.projectName || 'Submission'}</span>
            <StatusBadge status={s.verificationStatus} />
            <StatusBadge status={s.status} />
          </div>
          {s.repoUrl && (
            <a href={s.repoUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-cyan hover:text-cyan-dim transition-colors break-all">
              {s.repoUrl} ↗
            </a>
          )}
          {s.description && (
            <p className="font-body text-sm text-text-secondary mt-2 line-clamp-2">{s.description}</p>
          )}

          {s.verificationResult && (
            <div className="mt-3 text-sm font-body text-text-secondary bg-elevated rounded-lg p-3">
              <div className="font-medium text-text-primary mb-1">{s.verificationResult.recommendation}</div>
              <p className="line-clamp-2">{s.verificationResult.summary}</p>
            </div>
          )}
        </div>
      </div>

      {isHost && s.verificationStatus === 'unverified' && (
        <div className="mt-4 relative">
          <button
            onClick={() => setShowVerifyMenu((v) => !v)}
            disabled={verifying}
            className="btn btn-secondary text-xs"
          >
            {verifying ? 'Verifying…' : '🤖 Run AI verification'}
          </button>
          {showVerifyMenu && (
            <div className="absolute left-0 top-full mt-1 z-10 rounded-xl border border-border bg-surface shadow-card min-w-[200px]">
              {[
                { model: 'gemini' as const, label: 'Gemini 1.5 Flash', cost: '0.5 cr' },
                { model: 'claude' as const, label: 'Claude 3 Haiku', cost: '1.0 cr' },
                { model: 'openai' as const, label: 'GPT-4o Mini', cost: '1.5 cr' },
              ].map(({ model, label, cost }) => (
                <button
                  key={model}
                  onClick={() => { setShowVerifyMenu(false); onVerify(model); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-body hover:bg-elevated transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="text-text-primary">{label}</span>
                  <span className="text-cyan font-mono text-xs">{cost}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
