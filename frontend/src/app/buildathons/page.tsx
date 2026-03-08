'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { listBuildathons } from '@/lib/api/buildathons';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { Buildathon } from '@/types';

type FilterStatus = 'all' | 'active' | 'draft' | 'completed' | 'cancelled';

export default function BuildathonsPage() {
  const [buildathons, setBuildathons] = useState<Buildathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filter !== 'all' ? { status: filter as Buildathon['status'] } : undefined;
        const result = await listBuildathons(params);
        setBuildathons(result.data);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const filtered = buildathons.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase())
  );

  const statuses: FilterStatus[] = ['all', 'active', 'draft', 'completed', 'cancelled'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Buildathons</h1>
          <p className="font-body text-text-secondary mt-1">Compete, build, and earn on Flow.</p>
        </div>
        <Link href="/buildathons/new" className="btn btn-primary shrink-0">
          + Host a buildathon
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search buildathons…"
          className="input sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-body font-medium capitalize transition-all duration-200',
                filter === s
                  ? 'bg-cyan text-base'
                  : 'bg-elevated text-text-secondary border border-border hover:border-border-bright hover:text-text-primary'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-display text-xl text-text-primary mb-2">No buildathons found</p>
          <p className="font-body text-text-muted">
            {search ? 'Try a different search term.' : 'Be the first to create one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <BuildathonCard key={b.id} buildathon={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BuildathonCard({ buildathon: b }: { buildathon: Buildathon }) {
  const start = new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Link
      href={`/buildathons/${b.id}`}
      className="group rounded-2xl border border-border bg-surface p-6 shadow-card glass-hover flex flex-col gap-4 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display font-bold text-lg text-text-primary leading-tight group-hover:text-cyan transition-colors line-clamp-2">
          {b.title}
        </h2>
        <StatusBadge status={b.status} />
      </div>

      <p className="font-body text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1">
        {b.description}
      </p>

      {b.requirements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {b.requirements.slice(0, 3).map((r) => (
            <span key={r} className="text-xs font-body px-2 py-0.5 rounded-full bg-elevated border border-border text-text-muted truncate max-w-[150px]">
              {r}
            </span>
          ))}
          {b.requirements.length > 3 && (
            <span className="text-xs font-body px-2 py-0.5 rounded-full bg-elevated border border-border text-text-muted">
              +{b.requirements.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <span className="font-display font-bold text-xl text-text-primary">
            {b.prizePool.toLocaleString()}
          </span>
          <span className="font-body text-sm text-text-muted ml-1">{b.currency}</span>
        </div>
        <div className="text-right">
          <div className="font-body text-xs text-text-muted">{start} — {end}</div>
        </div>
      </div>
    </Link>
  );
}
