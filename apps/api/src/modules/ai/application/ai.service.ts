import { Injectable, NotFoundException } from '@nestjs/common';
import { AiExecutionStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface CreateAiExecutionInput {
  input: unknown;
  actorUserId: string;
  modelConfigId?: string;
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  listExecutions() {
    return this.prisma.aiExecution.findMany({
      where: { deletedAt: null },
      include: { modelConfig: true, agentRuns: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createExecution(input: CreateAiExecutionInput) {
    if (input.modelConfigId) {
      const model = await this.prisma.modelConfiguration.findFirst({
        where: { id: input.modelConfigId, deletedAt: null },
        select: { id: true },
      });

      if (!model) {
        throw new NotFoundException('Model configuration not found.');
      }
    }

    return this.prisma.aiExecution.create({
      data: {
        modelConfigId: input.modelConfigId,
        status: AiExecutionStatus.QUEUED,
        input: input.input as object,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
      include: { modelConfig: true, agentRuns: true },
    });
  }
}