import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-text-primary">Coorda</span>
          <span className="text-text-muted font-body text-sm">— Buildathons on Flow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/buildathons" className="text-sm font-body text-text-muted hover:text-text-secondary transition-colors">
            Buildathons
          </Link>
          <Link href="/credits" className="text-sm font-body text-text-muted hover:text-text-secondary transition-colors">
            Credits
          </Link>
          <a
            href="https://flow.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-body text-text-muted hover:text-green-accent transition-colors"
          >
            Built on Flow ↗
          </a>
        </div>
        <p className="text-xs font-body text-text-muted">© 2026 Coorda</p>
      </div>
    </footer>
  );
}
