'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, ClipboardCheck, DollarSign, Lightbulb, Mail, PieChart } from 'lucide-react';
import { useAuth } from '../../../lib/auth/session';
import { createFirebaseSession } from '../../../lib/api/auth';
import { signInWithEmailPassword, signInWithGoogleProvider } from '../../../lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const { session, setApiSession } = useAuth();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  async function completeFirebaseLogin(firebaseIdToken: string) {
    setApiSession(await createFirebaseSession(firebaseIdToken));
    router.push('/projects');
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

  async function continueWithGoogle() {
    setIsGoogleSigningIn(true);
    setMessage('Opening Google sign-in...');
    try {
      await completeFirebaseLogin(await signInWithGoogleProvider());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Magnafic AI workforce introduction">
        <div className="login-mini-mark" aria-hidden="true">
          <img src="/images/favicon.png" alt="" />
        </div>
        <div className="login-showcase-title">
          <h1>Super Intelligent Workforce</h1>
          <p>for 10x Business Growth</p>
        </div>

        <div className="login-robot-scene" aria-hidden="true">
          <div className="login-floating-icon login-floating-icon-light">
            <Lightbulb size={46} strokeWidth={2.2} />
          </div>
          <div className="login-floating-icon login-floating-icon-clipboard">
            <ClipboardCheck size={28} strokeWidth={2.3} />
          </div>
          <div className="login-floating-icon login-floating-icon-dollar">
            <DollarSign size={30} strokeWidth={3} />
          </div>
          <div className="login-floating-icon login-floating-icon-chart">
            <BarChart3 size={58} strokeWidth={2.2} />
            <PieChart className="login-pie-icon" size={46} strokeWidth={2.2} />
          </div>

          <div className="login-robot">
            <div className="login-robot-head">
              <div className="login-robot-face">
                <span />
                <span />
              </div>
            </div>
            <div className="login-robot-body">
              <div className="login-robot-badge">M</div>
            </div>
            <div className="login-robot-arm login-robot-arm-left" />
            <div className="login-robot-arm login-robot-arm-right" />
          </div>
        </div>

        <p className="login-showcase-copy">
          Super Intelligent Workforce that completes tasks for every person in your organisation,
          across every workflow.
        </p>
      </section>

      <section className="login-card" aria-label="Magnafic login form">
        <div className="login-logo" aria-label="Magnafic">
          <img src="/images/Magnafic.png" alt="Magnafic" />
        </div>

        <h2>Welcome</h2>

        <form className="login-form" onSubmit={(event) => {
          event.preventDefault();
          void continueWithEmail();
        }}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder=""
            type="email"
            autoComplete="email"
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder=""
            type="password"
            autoComplete="current-password"
          />

          <button className="login-submit" disabled={isSigningIn || isGoogleSigningIn} type="submit">
            <Mail size={15} strokeWidth={2.4} />
            {isSigningIn ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          className="login-google"
          disabled={isSigningIn || isGoogleSigningIn}
          type="button"
          onClick={() => void continueWithGoogle()}
        >
          <span aria-hidden="true">G</span>
          {isGoogleSigningIn ? 'Connecting...' : 'Continue with Google'}
        </button>

        <p className="login-signup">
          Not signed up yet? <Link href="/">Create account</Link>
        </p>
        <a className="login-site-link" href="https://www.magnafic.com" rel="noreferrer" target="_blank">
          www.magnafic.com
        </a>

        <p className="login-status">
          {session.accessToken ? `Signed in as ${session.user.email}` : message}
        </p>
      </section>
    </main>
  );
}
