'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBuildathon } from '@/lib/api/buildathons';
import { ToastContainer } from '@/components/shared/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function CreateBuildathonPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    prizePool: '',
    currency: 'FLOW',
    startDate: '',
    endDate: '',
    maxWaves: '',
    requirements: [''],
  });
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-body text-text-secondary mb-4">Sign in to create a buildathon.</p>
          <Link href="/login" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  const setField = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addRequirement = () => setField('requirements', [...form.requirements, '']);
  const updateRequirement = (i: number, val: string) => {
    const reqs = [...form.requirements];
    reqs[i] = val;
    setField('requirements', reqs);
  };
  const removeRequirement = (i: number) =>
    setField('requirements', form.requirements.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.prizePool || !form.startDate || !form.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const b = await createBuildathon({
        title: form.title,
        description: form.description,
        prizePool: parseFloat(form.prizePool),
        currency: form.currency,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        maxWaves: form.maxWaves ? parseInt(form.maxWaves) : undefined,
        requirements: form.requirements.filter(Boolean),
      });
      toast.success('Buildathon created!');
      router.push(`/buildathons/${b.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create buildathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-2 text-sm font-body text-text-muted mb-8">
          <Link href="/buildathons" className="hover:text-text-secondary">Buildathons</Link>
          <span>/</span>
          <span className="text-text-secondary">New</span>
        </div>

        <h1 className="font-display text-3xl font-black text-text-primary mb-2">
          Create a buildathon
        </h1>
        <p className="font-body text-text-secondary mb-8">
          Set up your buildathon. You&apos;ll add waves and lock escrow funds after creation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="Flow Summer Hackathon"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea
              className="input resize-none"
              rows={5}
              placeholder="Describe the buildathon theme, goals, and what builders should create…"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              required
            />
          </div>

          {/* Prize pool + currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prize pool *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="input"
                placeholder="5000"
                value={form.prizePool}
                onChange={(e) => setField('prizePool', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value)}
              >
                <option value="FLOW">FLOW</option>
                <option value="FUSD">FUSD</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start date *</label>
              <input
                type="datetime-local"
                className="input"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">End date *</label>
              <input
                type="datetime-local"
                className="input"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Max waves */}
          <div>
            <label className="label">Max waves <span className="text-text-muted">(optional)</span></label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="3"
              value={form.maxWaves}
              onChange={(e) => setField('maxWaves', e.target.value)}
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="label">Requirements <span className="text-text-muted">(used by AI verification)</span></label>
            <div className="space-y-2">
              {form.requirements.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder={`Requirement ${i + 1}`}
                    value={r}
                    onChange={(e) => updateRequirement(i, e.target.value)}
                  />
                  {form.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(i)}
                      className="btn btn-ghost text-text-muted hover:text-red-400 px-3"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="btn btn-ghost text-sm text-cyan"
              >
                + Add requirement
              </button>
            </div>
          </div>

          {/* Note about waves & escrow */}
          <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
            <p className="font-body text-sm text-cyan/80">
              <strong className="text-cyan">Next steps:</strong> After creating, you&apos;ll add waves (with builder slots and prizes) and lock escrow funds using your Flow wallet.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/buildathons" className="btn btn-ghost">Cancel</Link>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-base/30 border-t-base rounded-full animate-spin" />
                  Creating…
                </span>
              ) : 'Create buildathon →'}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
