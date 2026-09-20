'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../../lib/auth/session';
import { createFirebaseSession } from '../../../lib/api/auth';
import {
  signInWithEmailPassword,
  signInWithGoogleProvider,
} from '../../../lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const { session, setApiSession } = useAuth();
  const [message, setMessage] = useState('Sign in with your authorized Firebase account.');
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
              <label htmlFor="login-email">Email</label>
              <input id="login-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
            </div>
          </div>
          <button className="button button-muted" onClick={() => void continueWithEmail()} disabled={isSigningIn} type="button">
            Continue with email
          </button>
        </div>

        <div className="section-gap topbar-actions">
          <span className="metric-label">
            {session.accessToken ? `Signed in as ${session.user.email}` : 'Not signed in'}
          </span>
          <Link className="button button-ghost" href="/dashboard">View current workspace</Link>
        </div>
        <p className="section-gap">{message}</p>
      </section>
    </main>
  );
}
