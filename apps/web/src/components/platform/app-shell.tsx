'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../../lib/auth/session';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/workforce', label: 'AI Workforce' },
  { href: '/prompt-library', label: 'Prompt Library' },
  { href: '/model-management', label: 'Models' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Settings' },
];

interface AppShellProps {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function AppShell({ children, eyebrow, title, description }: AppShellProps) {
  const { isAuthLoading, session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && session.mode !== 'api') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoading, pathname, router, session.mode]);

  if (isAuthLoading || session.mode !== 'api') {
    return (
      <main className="workspace" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <section className="card" aria-live="polite">
          <span className="eyebrow">Secure Workspace</span>
          <h1>Checking your Magnafic AI session...</h1>
          <p>Protected pages require Firebase sign-in and a valid organization membership.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup" aria-label="Magnafic AI home">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>Magnafic</strong>
            <small>AI</small>
          </span>
        </Link>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <Link
              className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'active' : ''}
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className="status-dot" />
          <div>
            <strong>{session.mode === 'api' ? session.user.displayName : 'Guest user'}</strong>
            <p>{session.user.email}</p>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            {title ? <h1>{title}</h1> : null}
            {description ? <p>{description}</p> : null}
          </div>
          <div className="topbar-actions">
            <Link className="button button-muted" href="/login">
              {session.mode === 'api' ? 'Account' : 'Sign in'}
            </Link>
            <Link className="button button-primary" href="/projects">Open projects</Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <section className={`card ${className}`}>{children}</section>;
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Card>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <p>{detail}</p>
    </Card>
  );
}

interface PillProps {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'slate';
}

export function Pill({ children, tone = 'blue' }: PillProps) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="progress-bar" aria-label={`Progress ${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
