import { Injectable, NotFoundException } from '@nestjs/common';
import { AiExecutionStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiteLlmGatewayService } from './services/litellm-gateway.service';

export interface CreateAiExecutionInput {
  input: unknown;
  actorUserId: string;
  modelConfigId?: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly liteLlmGateway: LiteLlmGatewayService,
  ) {}

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

    const execution = await this.prisma.aiExecution.create({
      data: {
        modelConfigId: input.modelConfigId,
        status: AiExecutionStatus.RUNNING,
        input: input.input as object,
        startedAt: new Date(),
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
      include: { modelConfig: true, agentRuns: true },
    });

    const prompt = this.extractPrompt(input.input);
    const aiResult = await this.liteLlmGateway.generateText({
      messages: [
        {
          role: 'system',
          content:
            'You are Magnafic AI backend execution service. Produce clear, useful output for the requested AI task.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 1000,
      metadata: {
        feature: 'ai-execution',
        executionId: execution.id,
      },
    });

    return this.prisma.aiExecution.update({
      where: { id: execution.id },
      data: {
        status: AiExecutionStatus.SUCCEEDED,
        output: {
          content: aiResult.content,
          provider: aiResult.provider,
          model: aiResult.model,
          finishReason: aiResult.finishReason,
          errorMessage: aiResult.errorMessage,
        },
        promptTokens: aiResult.promptTokens ?? 0,
        completionTokens: aiResult.completionTokens ?? 0,
        completedAt: new Date(),
        errorMessage: aiResult.errorMessage,
        updatedBy: input.actorUserId,
      },
      include: { modelConfig: true, agentRuns: true },
    });
  }

  private extractPrompt(input: unknown): string {
    if (typeof input === 'string') {
      return input;
    }

    if (input && typeof input === 'object') {
      const record = input as Record<string, unknown>;
      const prompt = record.prompt ?? record.question ?? record.message ?? record.content;

      if (typeof prompt === 'string' && prompt.trim()) {
        return prompt;
      }
    }

    return JSON.stringify(input);
  }
}
