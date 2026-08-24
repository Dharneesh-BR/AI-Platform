import type { PlatformRole } from './platform-role.enum';

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  roles: PlatformRole[];
}

