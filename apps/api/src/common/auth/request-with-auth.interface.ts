import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.interface';

export interface RequestWithAuth extends Request {
  user?: AuthenticatedUser;
}
