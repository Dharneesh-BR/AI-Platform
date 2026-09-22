import { Injectable } from '@nestjs/common';
import { LiteLlmGatewayService } from '../../../../ai/application/services/litellm-gateway.service';
import type { SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';
import { ToolRegistryService } from '../tools/tool-registry.service';
import type { AgentSpecialist } from './specialist.interface';

@Injectable()
export class AnalysisSpecialist implements AgentSpecialist {
  readonly capability = 'analysis' as const;
  readonly requiredPermissions = ['analysis:run'];
  readonly supportedTools = ['company_profile', 'readiness_report'];

  constructor(
    private readonly liteLlmGateway: LiteLlmGatewayService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  async execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult> {
    await this.toolRegistry.execute('company_profile', this.toolContext(input), {}, () => ({
      ok: true,
      data: { contextAvailable: Boolean(input.companyContext) },
    }));

    const result = await this.liteLlmGateway.generateText({
      model: input.selectedModel,
      temperature: 0.2,
      maxTokens: 700,
      messages: [
        {
          role: 'system',
          content: `${input.businessAgent.systemInstructions} Analyze the request using supplied company context. Be specific and do not invent missing facts.`,
        },
        {
          role: 'user',
          content: [`Request: ${input.userInput}`, `Company context:\n${input.companyContext}`, `Step goal: ${input.planStep?.goal ?? 'Analyze request'}`].join('\n\n'),
        },
      ],
      metadata: { feature: 'agent-runtime', specialist: this.capability, runId: input.runId },
    });

    return {
      capability: this.capability,
      content: result.content,
      tokenUsage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
      },
      metadata: { model: result.model },
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
