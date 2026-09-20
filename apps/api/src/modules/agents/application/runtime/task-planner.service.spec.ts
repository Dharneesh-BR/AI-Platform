import { describe, expect, it } from 'vitest';
import type { AgentRuntimeConfigService } from './agent-runtime-config.service';
import type { BusinessAgentProfileView, SupervisorOutput } from './agent-runtime.types';
import { TaskPlannerService } from './task-planner.service';

const businessAgent: BusinessAgentProfileView = {
  name: 'Magnafic AI',
  slug: 'magnafic-ai',
  department: 'Strategy',
  systemInstructions: 'Advise safely.',
  capabilities: ['rag', 'analysis', 'writing', 'calculation'],
  allowedSpecialists: [],
  allowedTools: [],
  knowledgeScopes: [],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

const config = { maxPlannerSteps: 2 } as AgentRuntimeConfigService;

describe('TaskPlannerService', () => {
  const service = new TaskPlannerService(config);

  it('bypasses complex planning for simple requests', () => {
    const supervisor: SupervisorOutput = {
      intent: 'advisory',
      complexity: 'simple',
      requiresPlanning: false,
      requiredCapabilities: ['analysis'],
      needsCompanyKnowledge: false,
      needsExternalResearch: false,
      needsCalculation: false,
      riskLevel: 'low',
    };

    const plan = service.createPlan({ userInput: 'What next?', supervisor, businessAgent });

    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.dependencies).toEqual([]);
  });

  it('bounds complex plans by configured max steps', () => {
    const supervisor: SupervisorOutput = {
      intent: 'strategy',
      complexity: 'complex',
      requiresPlanning: true,
      requiredCapabilities: ['rag', 'calculation', 'analysis', 'writing'],
      needsCompanyKnowledge: true,
      needsExternalResearch: false,
      needsCalculation: true,
      riskLevel: 'medium',
    };

    const plan = service.createPlan({ userInput: 'Build a multi-step plan.', supervisor, businessAgent });

    expect(plan.steps).toHaveLength(2);
  });

  it('creates valid sequential dependencies', () => {
    const supervisor: SupervisorOutput = {
      intent: 'strategy',
      complexity: 'standard',
      requiresPlanning: true,
      requiredCapabilities: ['rag', 'analysis'],
      needsCompanyKnowledge: true,
      needsExternalResearch: false,
      needsCalculation: false,
      riskLevel: 'medium',
    };

    const plan = service.createPlan({ userInput: 'Use context and analyze.', supervisor, businessAgent });

    expect(plan.steps[0]?.dependencies).toEqual([]);
    expect(plan.steps[1]?.dependencies).toEqual(['step-1']);
  });
});
