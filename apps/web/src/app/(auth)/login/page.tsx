'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getRoleLabel, useAuth, type UserRole } from '../../../lib/auth/session';
import { createDevSession, createFirebaseSession } from '../../../lib/api/auth';
import {
  signInWithEmailPassword,
  signInWithGoogleProvider,
} from '../../../lib/firebase/client';

const loginRoles: Array<{
  role: UserRole;
  description: string;
}> = [
  {
    role: 'SUPER_ADMIN',
    description: 'Platform owner: manages all clients, users, billing, prompts, and models.',
  },
  {
    role: 'ADMIN',
    description: 'Client workspace owner: creates projects, invites users, and approves outputs.',
  },
  {
    role: 'CONSULTANT',
    description: 'Delivery user: runs onboarding, discovery review, research, chat, and reports.',
  },
  {
    role: 'VIEWER',
    description: 'Stakeholder user: reads dashboards, profiles, research, and reports only.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { session, setApiSession, setLocalRole } = useAuth();
  const [message, setMessage] = useState('Choose a role after enabling development auth or Firebase auth.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function completeFirebaseLogin(firebaseIdToken: string) {
    setApiSession(await createFirebaseSession(firebaseIdToken));
    router.push('/dashboard');
  }

  async function continueWithGoogle() {
    setIsSigningIn(true);
    setMessage('Opening Google sign-in...');
    try {
      await completeFirebaseLogin(await signInWithGoogleProvider());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function continueWithEmail() {
    if (!email || !password) {
      setMessage('Enter email and password before signing in.');
      return;
    }

    setIsSigningIn(true);
    setMessage('Signing in with Firebase email/password...');
    try {
      await completeFirebaseLogin(await signInWithEmailPassword(email, password));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Email sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function continueAs(role: UserRole) {
    if (process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === 'true') {
      try {
        setApiSession(await createDevSession(role));
        router.push('/dashboard');
        return;
      } catch {
        setMessage('Development auth endpoint is unavailable. Start the API with ENABLE_DEV_AUTH=true.');
        return;
      }
    }

    setLocalRole(role);
    setMessage('Local role selected. Start API auth to load live data.');
  }

  return (
    <main className="workspace" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <section className="card hero-card" style={{ maxWidth: 920 }}>
        <span className="eyebrow">Secure Login</span>
        <h1>Welcome back to Magnafic AI.</h1>
        <p>
          Sign in with Firebase. The frontend receives a Firebase ID token, then the API exchanges it
          for the Magnafic AI platform session.
        </p>

        <div className="section-gap stack">
          <button className="button button-primary" onClick={() => void continueWithGoogle()} disabled={isSigningIn} type="button">
            Continue with Google
          </button>
          <div className="form-grid">
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
            </div>
          </div>
          <button className="button button-muted" onClick={() => void continueWithEmail()} disabled={isSigningIn} type="button">
            Continue with email
          </button>
        </div>

        <div className="role-grid section-gap">
          {loginRoles.map((loginRole) => (
            <button
              className="role-card"
              key={loginRole.role}
              onClick={() => void continueAs(loginRole.role)}
              type="button"
            >
              <strong>{getRoleLabel(loginRole.role)}</strong>
              <span>{loginRole.description}</span>
            </button>
          ))}
        </div>

        <div className="section-gap topbar-actions">
          <button className="button button-primary" onClick={() => void continueAs(session.user.role)} type="button">
            Continue as {getRoleLabel(session.user.role)}
          </button>
          <Link className="button button-ghost" href="/dashboard">View current workspace</Link>
        </div>
        <p className="section-gap">{message}</p>
      </section>
    </main>
  );
}
