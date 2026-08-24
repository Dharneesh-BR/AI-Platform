import type { AuthenticatedUser } from '../../../../common/auth';
import type { VerifiedIdentity } from './verified-identity';

export const USER_SESSION_REPOSITORY = Symbol('USER_SESSION_REPOSITORY');

export interface UserSessionRepository {
  findOrCreateFromIdentity(identity: VerifiedIdentity): Promise<AuthenticatedUser>;
}

