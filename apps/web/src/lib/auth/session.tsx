'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createFirebaseSession } from '../api/auth';
import { getLocalAuthToken } from './api-access';
import { onFirebaseAuthChanged, signOutFirebase } from '../firebase/client';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export interface SessionState {
  accessToken?: string;
  permissions?: string[];
  user: SessionUser;
  mode: 'anonymous' | 'api';
}

interface AuthContextValue {
  session: SessionState;
  setApiSession: (session: SessionState) => void;
  signOut: () => Promise<void>;
  isAuthLoading: boolean;
}

function createAnonymousSession(): SessionState {
  if (getLocalAuthToken()) {
    return {
      permissions: [
        'platform.admin',
        'project.manage',
        'knowledge.manage',
        'agent.use',
        'billing.view',
      ],
      mode: 'api',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'local-tester@magnafic.ai',
        displayName: 'Local Tester',
      },
    };
  }

  return {
    mode: 'anonymous',
    user: {
      id: '',
      email: 'Not signed in',
      displayName: 'Not signed in',
    },
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<SessionState>(() => createAnonymousSession());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (getLocalAuthToken()) {
      setIsAuthLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onFirebaseAuthChanged((firebaseUser) => {
        void (async () => {
          try {
            if (!firebaseUser) {
              if (active) {
                setSession(createAnonymousSession());
              }
              return;
            }
            const firebaseIdToken = await firebaseUser.getIdToken();
            const apiSession = await createFirebaseSession(firebaseIdToken);
            if (active) {
              setSession(apiSession);
            }
          } catch {
            if (active) {
              setSession(createAnonymousSession());
            }
          } finally {
            if (active) {
              setIsAuthLoading(false);
            }
          }
        })();
      });
    } catch {
      setSession(createAnonymousSession());
      setIsAuthLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  function persistSession(nextSession: SessionState) {
    setSession(nextSession);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      setApiSession: persistSession,
      signOut: async () => {
        await signOutFirebase();
        setSession(createAnonymousSession());
      },
      isAuthLoading,
    }),
    [isAuthLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
