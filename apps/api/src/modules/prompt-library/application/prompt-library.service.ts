import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class PromptLibraryService {
  constructor(private readonly prisma: PrismaService) {}

  listPrompts() {
    return this.prisma.promptTemplate.findMany({
      where: { deletedAt: null },
      include: { versions: { where: { deletedAt: null }, orderBy: { version: 'desc' }, take: 1 } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }
}