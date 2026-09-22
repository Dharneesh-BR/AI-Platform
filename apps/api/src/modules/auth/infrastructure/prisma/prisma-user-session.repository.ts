import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { UserSessionRepository } from '../../application/ports/user-session.repository';
import type { VerifiedIdentity } from '../../application/ports/verified-identity';

@Injectable()
export class PrismaUserSessionRepository implements UserSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateFromIdentity(identity: VerifiedIdentity): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.upsert({
      where: {
        firebaseUid: identity.firebaseUid,
      },
      create: {
        firebaseUid: identity.firebaseUid,
        email: identity.email,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
      },
      update: {
        email: identity.email,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        lastLoginAt: new Date(),
      },
    });

    if (user.deletedAt) {
      throw new UnauthorizedException('This user account is disabled.');
    }

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName ?? undefined,
    };
  }
}
