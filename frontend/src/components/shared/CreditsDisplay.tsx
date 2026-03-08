'use client';

import Link from 'next/link';

export function CreditsDisplay({ credits }: { credits: number }) {
  return (
    <Link
      href="/credits"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan/25 bg-cyan-glow hover:border-cyan/50 hover:bg-cyan/10 transition-all duration-200 group"
    >
      <svg
        className="w-3.5 h-3.5 text-cyan group-hover:scale-110 transition-transform"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
      <span className="text-xs font-medium font-body text-cyan tabular-nums">
        {credits % 1 === 0 ? credits : credits.toFixed(1)}
      </span>
      <span className="text-xs text-text-muted font-body">cr</span>
    </Link>
  );
}
