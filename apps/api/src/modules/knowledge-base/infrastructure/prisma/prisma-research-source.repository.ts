import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ResearchSourceRepository } from '../../application/ports/research-source.repository';
import type { ResearchSourceEntity } from '../../domain/entities/research-source.entity';

@Injectable()
export class PrismaResearchSourceRepository implements ResearchSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForProject(projectId: string, actor: AuthenticatedUser): Promise<ResearchSourceEntity[]> {
    const sources = await this.prisma.researchSource.findMany({
      where: {
        projectId,
        deletedAt: null,
        project: {
          createdBy: actor.id,
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sources.map((source) => ({
      id: source.id,
      projectId: source.projectId,
      type: source.type,
      sourceId: source.sourceId,
      title: source.title,
      content: source.content,
      metadata:
        source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata)
          ? source.metadata
          : {},
    }));
  }
}
