import type { AuthenticatedUser } from './authenticated-user.interface';
import type { PlatformRole } from './platform-role.enum';

export interface RequestTenantContext {
  organizationId: string;
  user: AuthenticatedUser;
  role?: PlatformRole;
}
