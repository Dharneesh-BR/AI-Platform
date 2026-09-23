import { Injectable } from '@nestjs/common';
import { LiteLlmGatewayService } from '../../../../ai/application/services/litellm-gateway.service';
import type { SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';
import type { AgentSpecialist } from './specialist.interface';

@Injectable()
export class WritingSpecialist implements AgentSpecialist {
  readonly capability = 'writing' as const;
  readonly requiredPermissions = ['writing:generate'];
  readonly supportedTools = ['company_profile', 'readiness_report'];

  constructor(private readonly liteLlmGateway: LiteLlmGatewayService) {}

  async execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult> {
    const result = await this.liteLlmGateway.generateText({
      model: input.selectedModel,
      temperature: 0.3,
      maxTokens: 800,
      messages: [
        {
          role: 'system',
          content: [
            input.businessAgent.systemInstructions,
            'Create specific, executive-ready business writing grounded in the supplied company context. Do not use generic onboarding advice when company facts are available.',
            'Keep the draft concise unless the user explicitly asks for a detailed report. Prefer concrete recommendations, assumptions, risks, and next actions over broad market narration.',
            input.businessAgent.responseFormatInstructions ? `Final response format context: ${input.businessAgent.responseFormatInstructions}` : '',
          ].filter(Boolean).join('\n\n'),
        },
        {
          role: 'user',
          content: [`Request: ${input.userInput}`, `Company context:\n${input.companyContext}`, `Step goal: ${input.planStep?.goal ?? 'Write answer'}`].join('\n\n'),
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
}
