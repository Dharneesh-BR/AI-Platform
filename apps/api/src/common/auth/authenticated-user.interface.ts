export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  isAuthBypass?: boolean;
}
