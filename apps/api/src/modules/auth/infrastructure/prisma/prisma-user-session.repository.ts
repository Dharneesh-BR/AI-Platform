import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PlatformRole as PrismaPlatformRole } from '@prisma/client';
import { PlatformRole, type AuthenticatedUser } from '../../../../common/auth';
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
        role: PrismaPlatformRole.VIEWER,
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
      roles: [this.mapRole(user.role)],
    };
  }

  private mapRole(role: PrismaPlatformRole): PlatformRole {
    const roleMap: Record<PrismaPlatformRole, PlatformRole> = {
      SUPER_ADMIN: PlatformRole.SuperAdmin,
      ADMIN: PlatformRole.Admin,
      CONSULTANT: PlatformRole.Consultant,
      CLIENT: PlatformRole.Client,
      VIEWER: PlatformRole.Viewer,
    };

    return roleMap[role];
  }
}
