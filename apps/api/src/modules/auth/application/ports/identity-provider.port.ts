import type { VerifiedIdentity } from './verified-identity';

export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');

export interface IdentityProvider {
  verifyIdToken(idToken: string): Promise<VerifiedIdentity>;
}

