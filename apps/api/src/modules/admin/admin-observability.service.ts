import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminObservabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async listAgentRuns(limit = 50) {
    return this.prisma.agentRun.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        projectId: true,
        agentSlug: true,
        status: true,
        totalTokens: true,
        startedAt: true,
        completedAt: true,
        failedAt: true,
        errorMessage: true,
        createdAt: true,
        businessAgent: {
          select: { id: true, name: true, slug: true, department: true },
        },
        project: {
          select: { id: true, name: true, slug: true },
        },
        steps: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            node: true,
            specialist: true,
            status: true,
            model: true,
            startedAt: true,
            completedAt: true,
            error: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async listToolExecutions(limit = 100) {
    return this.prisma.toolExecution.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        agentRunId: true,
        agentStepId: true,
        projectId: true,
        userId: true,
        agentProfileId: true,
        agentSlug: true,
        toolName: true,
        category: true,
        status: true,
        riskLevel: true,
        mutating: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        errorCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }
}
