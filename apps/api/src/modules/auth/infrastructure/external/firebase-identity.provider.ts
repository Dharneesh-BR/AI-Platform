import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { IdentityProvider } from '../../application/ports/identity-provider.port';
import type { VerifiedIdentity } from '../../application/ports/verified-identity';

@Injectable()
export class FirebaseIdentityProvider implements IdentityProvider {
  private readonly logger = new Logger(FirebaseIdentityProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  async verifyIdToken(idToken: string): Promise<VerifiedIdentity> {
    try {
      const checkRevoked = this.configService.get<string>('FIREBASE_CHECK_REVOKED') !== 'false';
      const decodedToken = await getAuth().verifyIdToken(idToken, checkRevoked);

      if (!decodedToken.email) {
        throw new UnauthorizedException('Firebase identity must include an email address.');
      }

      return {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        avatarUrl: decodedToken.picture,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Firebase verification error.';
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown';
      this.logger.warn(`Firebase ID token verification failed: code=${code}, message=${message}`);
      throw new UnauthorizedException('Invalid Firebase identity token.');
    }
  }

  private initializeFirebase(): void {
    if (getApps().length > 0) {
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return;
    }

    initializeApp({ projectId });
  }
}
