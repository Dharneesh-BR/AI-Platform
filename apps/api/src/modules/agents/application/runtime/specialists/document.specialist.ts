import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../common/prisma/prisma.service';
import type { SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';
import { ToolRegistryService } from '../tools/tool-registry.service';
import type { AgentSpecialist } from './specialist.interface';

@Injectable()
export class DocumentSpecialist implements AgentSpecialist {
  readonly capability = 'document' as const;
  readonly requiredPermissions = ['knowledge:read'];
  readonly supportedTools = ['document_lookup'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  async execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult> {
    const execution = await this.toolRegistry.execute('document_lookup', this.toolContext(input), {}, async () => {
      const documents = await this.prisma.knowledgeDocument.findMany({
        where: {
          projectId: input.projectId,
          deletedAt: null,
          project: { createdBy: input.userId, deletedAt: null },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mimeType: true,
          updatedAt: true,
          _count: { select: { chunks: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });
      return { ok: true, data: { documents } };
    });
    const documents = execution.data?.documents ?? [];

    return {
      capability: this.capability,
      content: documents.length
        ? `Available project documents: ${documents.map((doc) => `${doc.title} (${doc.status}, ${doc._count.chunks} chunks)`).join('; ')}`
        : 'No project documents are currently available.',
      metadata: { documents },
    };
  }

  private toolContext(input: SpecialistExecutionInput) {
    return {
      userId: input.userId,
      projectId: input.projectId,
      agentRunId: input.runId,
      agentStepId: input.agentStepId,
      agentProfileId: input.businessAgent.id,
      agentSlug: input.businessAgent.slug,
      businessAgent: input.businessAgent,
      permissions: input.permissions,
      knowledgeScopes: input.businessAgent.knowledgeScopes,
    };
  }
}
