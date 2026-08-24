import type { AuthenticatedUser } from './authenticated-user.interface';

export interface RequestTenantContext {
  organizationId: string;
  user: AuthenticatedUser;
}

