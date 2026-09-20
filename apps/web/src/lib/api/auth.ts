import type { SessionState } from '../auth/session';
import { createApiClient } from './http-client';

interface CreateFirebaseSessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
    displayName?: string;
    roles: string[];
  };
}

interface AuthMeResponse {
  organizations: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  activeOrganization: {
    id: string;
    name: string;
    role: string;
  } | null;
  permissions: string[];
}

export async function createFirebaseSession(firebaseIdToken: string): Promise<SessionState> {
  const apiClient = createApiClient();
  const response = await apiClient.post<CreateFirebaseSessionResponse, { firebaseIdToken: string }>(
    '/auth/session',
    { firebaseIdToken },
  );

  const authenticatedClient = createApiClient({ accessToken: response.accessToken });
  const authContext = await authenticatedClient.get<AuthMeResponse>('/auth/me');

  return {
    accessToken: response.accessToken,
    organizationId: authContext.activeOrganization?.id ?? process.env.NEXT_PUBLIC_ORGANIZATION_ID,
    permissions: authContext.permissions,
    mode: 'api',
    user: {
      id: response.user.id,
      email: response.user.email,
      displayName: response.user.displayName ?? response.user.email,
    },
  };
}
