import { Injectable } from '@nestjs/common';
import type { SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';
import { ToolRegistryService } from '../tools/tool-registry.service';
import type { AgentSpecialist } from './specialist.interface';

@Injectable()
export class ResearchSpecialist implements AgentSpecialist {
  readonly capability = 'research' as const;
  readonly requiredPermissions = ['research:read'];
  readonly supportedTools = ['web_search'];

  constructor(private readonly toolRegistry: ToolRegistryService) {}

  async execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult> {
    try {
      await this.toolRegistry.execute('web_search', this.toolContext(input), {
        query: input.userInput,
      }, () => ({ ok: false, errorCode: 'INTEGRATION_NOT_CONFIGURED' }));
    } catch {
      // External search is intentionally optional at this stage; chat should continue with project context.
    }

    return {
      capability: this.capability,
      content: 'External research is not configured yet. I can proceed using approved internal company context and uploaded knowledge only.',
      metadata: { configured: false },
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
    };
  }
}
