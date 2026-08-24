import { Injectable } from '@nestjs/common';
import { PlatformRole } from '../../../common/auth';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string, requesterRoles: PlatformRole[]) {
    if (requesterRoles.includes(PlatformRole.SuperAdmin)) {
      return this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        memberships: {
          some: {
            organizationId,
            deletedAt: null,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}