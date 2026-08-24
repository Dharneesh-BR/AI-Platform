import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ModelManagementService {
  constructor(private readonly prisma: PrismaService) {}

  listProviders() {
    return this.prisma.modelProvider.findMany({
      where: { deletedAt: null },
      include: { models: { where: { deletedAt: null }, orderBy: { routingPriority: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }
}