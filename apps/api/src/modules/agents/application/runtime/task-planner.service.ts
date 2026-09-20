import { Injectable } from '@nestjs/common';
import { AgentRuntimeConfigService } from './agent-runtime-config.service';
import { TaskPlanSchema, type BusinessAgentProfileView, type SupervisorOutput, type TaskPlan } from './agent-runtime.types';

@Injectable()
export class TaskPlannerService {
  constructor(private readonly config: AgentRuntimeConfigService) {}

  createPlan(input: { userInput: string; supervisor: SupervisorOutput; businessAgent: BusinessAgentProfileView }): TaskPlan {
    if (!input.supervisor.requiresPlanning) {
      return TaskPlanSchema.parse({
        objective: input.userInput,
        steps: [
          {
            id: 'step-1',
            goal: 'Answer the user request directly with available context.',
            capability: input.supervisor.requiredCapabilities[0] ?? 'analysis',
            dependencies: [],
          },
        ],
      });
    }

    const orderedCapabilities = input.supervisor.requiredCapabilities
      .filter((capability, index, all) => all.indexOf(capability) === index)
      .slice(0, this.config.maxPlannerSteps);

    const steps = orderedCapabilities.map((capability, index) => ({
      id: `step-${index + 1}`,
      goal: this.goalFor(capability),
      capability,
      dependencies: index === 0 ? [] : [`step-${index}`],
    }));

    return TaskPlanSchema.parse({
      objective: input.userInput,
      steps: steps.length > 0 ? steps : [{ id: 'step-1', goal: 'Analyze and answer the request.', capability: 'analysis', dependencies: [] }],
    });
  }

  private goalFor(capability: string): string {
    const goals: Record<string, string> = {
      rag: 'Retrieve relevant approved company knowledge.',
      calculation: 'Run deterministic calculations and summarize assumptions.',
      analysis: 'Analyze the available business context and derive recommendations.',
      writing: 'Prepare an executive-ready response.',
      document: 'Inspect available document metadata and source references.',
      research: 'Check whether external research is configured and needed.',
      planning: 'Decompose the work into safe execution steps.',
    };

    return goals[capability] ?? 'Complete the requested work safely.';
  }
}
