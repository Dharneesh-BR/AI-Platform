import type { SessionState, UserRole } from '../auth/session';
import { createApiClient } from './http-client';

interface CreateDevSessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
    displayName?: string;
    roles: UserRole[];
  };
}

interface CreateFirebaseSessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
    displayName?: string;
    roles: UserRole[];
  };
}

export async function createDevSession(role: UserRole): Promise<SessionState> {
  const apiClient = createApiClient();
  const response = await apiClient.post<CreateDevSessionResponse, { role: UserRole }>(
    '/auth/dev-session',
    { role },
  );

  return {
    accessToken: response.accessToken,
    organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    mode: 'api',
    user: {
      id: response.user.id,
      email: response.user.email,
      displayName: response.user.displayName ?? response.user.email,
      role: response.user.roles[0] ?? role,
    },
  };
}

export async function createFirebaseSession(firebaseIdToken: string): Promise<SessionState> {
  const apiClient = createApiClient();
  const response = await apiClient.post<CreateFirebaseSessionResponse, { firebaseIdToken: string }>(
    '/auth/session',
    { firebaseIdToken },
  );

  return {
    accessToken: response.accessToken,
    organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    mode: 'api',
    user: {
      id: response.user.id,
      email: response.user.email,
      displayName: response.user.displayName ?? response.user.email,
      role: response.user.roles[0] ?? 'VIEWER',
    },
  };
}
