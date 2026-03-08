'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { updateUser } from '@/lib/api/users';
import { ToastContainer } from '@/components/shared/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [flowAddress, setFlowAddress] = useState('');
  const [role, setRole] = useState<'developer' | 'host'>('developer');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setFlowAddress(user.flowAddress || '');
      setRole(user.role || 'developer');
    }
  }, [user]);

  if (authLoading || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(user.uid, { displayName: displayName || undefined, flowAddress: flowAddress || undefined, role });
      await refreshUser();
      toast.success('Profile updated!');
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-8">Profile</h1>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan to-green-accent flex items-center justify-center shadow-glow-cyan">
            <span className="font-display font-black text-3xl text-base">{avatarLetter}</span>
          </div>
          <div>
            <div className="font-display font-bold text-xl text-text-primary">
              {user.displayName || 'No display name'}
            </div>
            <div className="font-body text-sm text-text-secondary mt-0.5">{user.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-body px-2.5 py-0.5 rounded-full border border-border bg-elevated text-text-muted capitalize">
                {user.role}
              </span>
              <span className="text-xs font-body text-cyan">{user.credits ?? 0} credits</span>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-xl border border-border bg-surface p-5 mb-6">
          <h3 className="font-display font-semibold text-text-primary mb-3 text-sm">Account</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-body text-text-muted">UID</span>
              <span className="font-mono text-text-secondary text-xs">{user.uid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-body text-text-muted">Email</span>
              <span className="font-body text-text-secondary">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-body text-text-muted">Member since</span>
              <span className="font-body text-text-secondary">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Display name</label>
            <input
              type="text"
              className="input"
              placeholder="Alice"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }}
            />
          </div>

          <div>
            <label className="label">Flow wallet address</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="0xabc123..."
              value={flowAddress}
              onChange={(e) => { setFlowAddress(e.target.value); setDirty(true); }}
            />
            <p className="text-xs font-body text-text-muted mt-1.5">
              Your Flow wallet for receiving prize funds from escrow.
            </p>
          </div>

          <div>
            <label className="label mb-2">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {(['developer', 'host'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setDirty(true); }}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                    role === r
                      ? 'border-cyan/50 bg-cyan/8'
                      : 'border-border bg-elevated hover:border-border-bright'
                  )}
                >
                  <span className="text-xl">{r === 'developer' ? '🔨' : '🏆'}</span>
                  <div>
                    <div className={clsx('font-display font-semibold text-sm capitalize', role === r ? 'text-cyan' : 'text-text-primary')}>
                      {r}
                    </div>
                    <div className="font-body text-xs text-text-muted">
                      {r === 'developer' ? 'Join & build' : 'Host & reward'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !dirty}
              className={clsx('btn btn-primary flex-1', (!dirty || saving) && 'opacity-50 cursor-not-allowed')}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Danger zone */}
        <div className="mt-10 rounded-xl border border-red-500/20 bg-red-900/5 p-5">
          <h3 className="font-display font-semibold text-red-400 mb-2 text-sm">Danger zone</h3>
          <p className="font-body text-sm text-text-muted mb-3">
            Contact support to delete your account. Active escrow funds must be resolved first.
          </p>
          <button className="btn btn-danger text-sm" disabled>
            Delete account
          </button>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
