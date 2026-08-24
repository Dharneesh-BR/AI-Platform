import type { AuthenticatedUser } from '../../../../common/auth';

export const PLATFORM_TOKEN_SERVICE = Symbol('PLATFORM_TOKEN_SERVICE');

export interface PlatformTokenService {
  issueAccessToken(user: AuthenticatedUser): Promise<string>;
}

