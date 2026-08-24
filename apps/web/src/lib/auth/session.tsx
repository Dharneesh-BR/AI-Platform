'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONSULTANT' | 'VIEWER';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface SessionState {
  accessToken?: string;
  organizationId?: string;
  user: SessionUser;
  mode: 'local' | 'api';
}

interface AuthContextValue {
  session: SessionState;
  setLocalRole: (role: UserRole) => void;
  setApiSession: (session: SessionState) => void;
  signOut: () => void;
}

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Organization Admin',
  CONSULTANT: 'Consultant',
  VIEWER: 'Viewer',
};

const roleEmails: Record<UserRole, string> = {
  SUPER_ADMIN: 'super.admin@magnafic.ai',
  ADMIN: 'org.admin@client.com',
  CONSULTANT: 'consultant@magnafic.ai',
  VIEWER: 'viewer@client.com',
};

const sessionStorageKey = 'magnafic-ai-session';

function createLocalSession(role: UserRole = 'SUPER_ADMIN'): SessionState {
  return {
    organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    mode: 'local',
    user: {
      id: `local-${role.toLowerCase().replace('_', '-')}`,
      email: roleEmails[role],
      displayName: roleLabels[role],
      role,
    },
  };
}

function readInitialSession(): SessionState {
  if (typeof window === 'undefined') {
    return createLocalSession();
  }

  const savedSession = window.localStorage.getItem(sessionStorageKey);
  if (!savedSession) {
    return createLocalSession();
  }

  try {
    return JSON.parse(savedSession) as SessionState;
  } catch {
    return createLocalSession();
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<SessionState>(() => createLocalSession());

  useEffect(() => {
    setSession(readInitialSession());
  }, []);

  function persistSession(nextSession: SessionState) {
    setSession(nextSession);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      setLocalRole: (role) => persistSession(createLocalSession(role)),
      setApiSession: persistSession,
      signOut: () => persistSession(createLocalSession('VIEWER')),
    }),
    [session],
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

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function canCreateOrganization(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

export function canCreateProject(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CONSULTANT';
}
