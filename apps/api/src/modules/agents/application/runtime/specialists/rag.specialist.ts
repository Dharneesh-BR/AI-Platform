import { Injectable } from '@nestjs/common';
import { RagContextService } from '../../../../knowledge-base/application/services/rag-context.service';
import type { SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';
import { ToolRegistryService } from '../tools/tool-registry.service';
import type { AgentSpecialist } from './specialist.interface';

@Injectable()
export class RagSpecialist implements AgentSpecialist {
  readonly capability = 'rag' as const;
  readonly requiredPermissions = ['knowledge:read'];
  readonly supportedTools = ['vector_search'];

  constructor(
    private readonly ragContextService: RagContextService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  async execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult> {
    const execution = await this.toolRegistry.execute('vector_search', this.toolContext(input), {
      query: input.userInput,
    }, async () => {
      const context = await this.ragContextService.buildContext({
        organizationId: input.organizationId,
        projectId: input.projectId,
        question: input.userInput,
        allowedKnowledgeScopes: input.businessAgent.knowledgeScopes.length ? input.businessAgent.knowledgeScopes : ['GENERAL'],
      });
      return {
        ok: true,
        data: context,
        sources: context.sources,
      };
    });
    const context = execution.data;

    return {
      capability: this.capability,
      content: context?.contextText || 'No relevant uploaded company knowledge was found for this request.',
      sources: context?.sources ?? [],
      metadata: { sourceCount: context?.sources.length ?? 0 },
    };
  }

  private toolContext(input: SpecialistExecutionInput) {
    return {
      userId: input.userId,
      organizationId: input.organizationId,
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
