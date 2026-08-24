'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { getRoleLabel, useAuth } from '../../lib/auth/session';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/prompt-library', label: 'Prompt Library' },
  { href: '/model-management', label: 'Models' },
  { href: '/billing', label: 'Billing' },
];

interface AppShellProps {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function AppShell({ children, eyebrow, title, description }: AppShellProps) {
  const { session } = useAuth();

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
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className="status-dot" />
          <div>
            <strong>{getRoleLabel(session.user.role)}</strong>
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
            <Link className="button button-muted" href="/login">Switch login</Link>
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
