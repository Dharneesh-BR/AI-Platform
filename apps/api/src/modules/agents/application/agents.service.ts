import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentType, AiExecutionStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface CreateAgentRunInput {
  organizationId: string;
  projectId: string;
  actorUserId: string;
  agentType: AgentType;
  state?: unknown;
}

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectRuns(organizationId: string, projectId: string) {
    await this.ensureProject(organizationId, projectId);

    return this.prisma.agentRun.findMany({
      where: { projectId, deletedAt: null },
      include: { aiExecution: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createRun(input: CreateAgentRunInput) {
    await this.ensureProject(input.organizationId, input.projectId);

    return this.prisma.agentRun.create({
      data: {
        projectId: input.projectId,
        agentType: input.agentType,
        status: AiExecutionStatus.QUEUED,
        state: (input.state ?? {}) as object,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
      include: { aiExecution: true },
    });
  }

  private async ensureProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }
}