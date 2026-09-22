import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(requesterId: string) {
    return this.prisma.user.findMany({
      where: {
        id: requesterId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
