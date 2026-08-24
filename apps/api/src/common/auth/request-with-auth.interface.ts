import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.interface';
import type { RequestTenantContext } from './tenant-context.interface';

export interface RequestWithAuth extends Request {
  user?: AuthenticatedUser;
  tenantContext?: RequestTenantContext;
}

