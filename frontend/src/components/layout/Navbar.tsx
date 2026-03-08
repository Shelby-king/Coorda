'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { CreditsDisplay } from '@/components/shared/CreditsDisplay';

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/buildathons', label: 'Buildathons' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-16 border-b border-border bg-base/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan to-green-accent opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0.5 rounded-md bg-base flex items-center justify-center">
              <span className="text-xs font-bold font-display text-cyan">C</span>
            </div>
          </div>
          <span className="font-display font-bold text-lg text-text-primary tracking-tight">
            Coorda
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'text-text-primary bg-elevated'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated/60'
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <CreditsDisplay credits={user.credits ?? 0} />
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-border-bright transition-colors group"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan to-green-accent flex items-center justify-center">
                  <span className="text-[10px] font-bold text-base font-display">
                    {(user.displayName || user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-body text-text-secondary group-hover:text-text-primary transition-colors truncate max-w-[100px]">
                  {user.displayName || user.email}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-body text-text-muted hover:text-text-secondary transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-lg bg-cyan text-base text-sm font-body font-semibold hover:bg-cyan-dim transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-text-secondary"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-2">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="py-2 text-sm font-body text-text-secondary hover:text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profile" className="py-2 text-sm font-body text-text-secondary" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/credits" className="py-2 text-sm font-body text-text-secondary" onClick={() => setMenuOpen(false)}>Credits ({user.credits})</Link>
              <button onClick={handleSignOut} className="py-2 text-left text-sm font-body text-red-400">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="py-2 text-sm font-body text-text-secondary" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/signup" className="py-2 text-sm font-body text-cyan font-semibold" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
