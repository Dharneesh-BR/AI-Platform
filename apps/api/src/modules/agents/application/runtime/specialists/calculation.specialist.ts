import { Injectable } from '@nestjs/common';
import type { SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';
import { ToolRegistryService } from '../tools/tool-registry.service';
import type { AgentSpecialist } from './specialist.interface';

@Injectable()
export class CalculationSpecialist implements AgentSpecialist {
  readonly capability = 'calculation' as const;
  readonly requiredPermissions = ['calculator:execute'];
  readonly supportedTools = ['calculator'];

  constructor(private readonly toolRegistry: ToolRegistryService) {}

  async execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult> {
    const execution = await this.toolRegistry.execute('calculator', this.toolContext(input), {
      expression: input.userInput,
    }, () => {
      const percentages = [...input.userInput.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((match) => Number(match[1] ?? 0));
      const moneyValues = [...input.userInput.matchAll(/(?:₹|\$|rs\.?)\s?(\d+(?:,\d{3})*(?:\.\d+)?)/gi)].map((match) =>
        Number((match[1] ?? '0').replace(/,/g, '')),
      );

      const calculations = moneyValues.flatMap((value) =>
        percentages.map((percentage) => ({
          base: value,
          percentage,
          increase: Number(((value * percentage) / 100).toFixed(2)),
          total: Number((value * (1 + percentage / 100)).toFixed(2)),
        })),
      );
      return { ok: true, data: { calculations } };
    });
    const calculations = execution.data?.calculations ?? [];

    return {
      capability: this.capability,
      content: calculations.length
        ? `Deterministic calculations: ${JSON.stringify(calculations)}`
        : 'No explicit numeric base values were provided. State assumptions before calculating scenarios.',
      metadata: { calculations },
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
    };
  }
}
