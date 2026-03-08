'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSubmission } from '@/lib/api/submissions';
import { verifyRepo } from '@/lib/api/ai';
import { ToastContainer } from '@/components/shared/Toast';
import { ScoreRing } from '@/components/shared/ScoreRing';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { VerificationResult } from '@/types';

export default function SubmitWorkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toasts, toast, removeToast } = useToast();

  const [repoUrl, setRepoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-verification state
  const [preVerifying, setPreVerifying] = useState(false);
  const [preVerifyResult, setPreVerifyResult] = useState<VerificationResult | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-body text-text-secondary mb-4">You need to sign in to submit work.</p>
          <Link href="/login" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  const handlePreVerify = async () => {
    if (!repoUrl) { toast.error('Enter a GitHub repo URL first'); return; }
    setPreVerifying(true);
    try {
      const result = await verifyRepo({ repoUrl, requirements: ['Uses Flow blockchain'] });
      setPreVerifyResult(result.verification);
      toast.success(`Pre-check complete. Score: ${result.verification.score}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Pre-verification failed');
    } finally {
      setPreVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('waveId', id);
      if (repoUrl) form.append('repoUrl', repoUrl);
      if (description) form.append('description', description);
      if (projectName) form.append('projectName', projectName);
      if (file) form.append('file', file);

      await createSubmission(form);
      toast.success('Submission received!');
      setTimeout(() => router.push(`/waves/${id}`), 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-body text-text-muted mb-8">
          <Link href={`/waves/${id}`} className="hover:text-text-secondary">← Back to wave</Link>
        </div>

        <h1 className="font-display text-3xl font-black text-text-primary mb-2">Submit work</h1>
        <p className="font-body text-text-secondary mb-8">
          Share your project repo and/or upload a file to IPFS via Lighthouse.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project name */}
          <div>
            <label className="label">Project name</label>
            <input
              type="text"
              className="input"
              placeholder="My Awesome DeFi App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* GitHub repo */}
          <div>
            <label className="label">GitHub repository URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                className="input flex-1"
                placeholder="https://github.com/you/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={handlePreVerify}
                disabled={preVerifying || !repoUrl}
                className="btn btn-secondary whitespace-nowrap shrink-0"
              >
                {preVerifying ? 'Checking…' : '🤖 Pre-check'}
              </button>
            </div>
            <p className="text-xs font-body text-text-muted mt-1.5">
              Optional: run a quick AI pre-check before submitting (uses 0.5 credits).
            </p>
          </div>

          {/* Pre-verify result */}
          {preVerifyResult && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-5">
                <ScoreRing score={preVerifyResult.score} size={80} label="Pre-check score" />
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-body font-medium border mb-3 ${
                    preVerifyResult.recommendation === 'APPROVE'
                      ? 'border-green-accent/30 text-green-accent bg-green-accent/10'
                      : preVerifyResult.recommendation === 'REJECT'
                      ? 'border-red-500/30 text-red-400 bg-red-900/10'
                      : 'border-yellow-500/30 text-yellow-400 bg-yellow-900/10'
                  }`}>
                    {preVerifyResult.recommendation}
                  </div>
                  <p className="font-body text-sm text-text-secondary line-clamp-3">{preVerifyResult.summary}</p>

                  {preVerifyResult.requirementChecks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {preVerifyResult.requirementChecks.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-body">
                          <span className={c.status === 'YES' ? 'text-green-accent' : c.status === 'PARTIAL' ? 'text-yellow-400' : 'text-red-400'}>
                            {c.status === 'YES' ? '✓' : c.status === 'PARTIAL' ? '~' : '✗'}
                          </span>
                          <span className="text-text-secondary">{c.requirement}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {preVerifyResult.redFlags.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-900/10 border border-red-500/20">
                      {preVerifyResult.redFlags.map((f, i) => (
                        <p key={i} className="text-xs font-body text-red-400">⚠ {f}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="label">Project description</label>
            <textarea
              className="input resize-none"
              rows={5}
              placeholder="Describe what you built, how it works, and how it meets the wave requirements…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div>
            <label className="label">File upload <span className="text-text-muted">(optional, max 50MB, stored on IPFS)</span></label>
            <div
              className={`mt-1 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-green-accent/40 bg-green-accent/5' : 'border-border hover:border-border-bright'
              }`}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div>
                  <div className="text-2xl mb-2">📎</div>
                  <p className="font-body text-sm text-green-accent font-medium">{file.name}</p>
                  <p className="font-body text-xs text-text-muted mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="mt-2 text-xs font-body text-text-muted hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-3">☁</div>
                  <p className="font-body text-sm text-text-secondary">Click to upload or drag & drop</p>
                  <p className="font-body text-xs text-text-muted mt-1">Any file type, up to 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Link href={`/waves/${id}`} className="btn btn-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || (!repoUrl && !file && !description)}
              className="btn btn-primary flex-1"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-base/30 border-t-base rounded-full animate-spin" />
                  Uploading to IPFS…
                </span>
              ) : 'Submit work →'}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
