import { describe, expect, it } from 'vitest';
import type { AgentGraphState } from './agent-runtime.types';
import { VerificationService } from './verification.service';

const baseState: AgentGraphState = {
  runId: 'run-1',
  projectId: 'project-1',
  userId: 'user-1',
  permissions: ['knowledge:read', 'company:read', 'report:read', 'analysis:run', 'calculator:execute'],
  agentSlug: 'magnafic-ai',
  userInput: 'Answer safely.',
  companyContext: '',
  retrievedKnowledge: '',
  intent: 'advisory',
  complexity: 'simple',
  completedSteps: [],
  toolResults: {},
  specialistResults: [],
  selectedModels: {},
  finalAnswer: 'Here is a grounded answer.',
  sources: [],
  errors: [],
  usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  verificationAttempts: 0,
  businessAgent: {
    name: 'Magnafic AI',
    slug: 'magnafic-ai',
    department: 'Strategy',
    systemInstructions: 'Advise safely.',
    capabilities: ['analysis'],
    allowedSpecialists: [],
    allowedTools: [],
    knowledgeScopes: [],
    modelPolicy: {},
    verificationPolicy: {},
    enabled: true,
  },
  supervisor: {
    intent: 'advisory',
    complexity: 'simple',
    requiresPlanning: false,
    requiredCapabilities: ['analysis'],
    needsCompanyKnowledge: false,
    needsExternalResearch: false,
    needsCalculation: false,
    riskLevel: 'low',
  },
};

describe('VerificationService', () => {
  const service = new VerificationService();

  it('passes a complete low-risk answer', () => {
    const result = service.verify(baseState);

    expect(result.passed).toBe(true);
    expect(result.recommendedAction).toBe('accept');
  });

  it('fails when required company knowledge has no sources', () => {
    const result = service.verify({
      ...baseState,
      supervisor: { ...baseState.supervisor!, needsCompanyKnowledge: true },
    });

    expect(result.passed).toBe(false);
    expect(result.issues.join(' ')).toContain('company knowledge');
  });

  it('fails legal responses without required caveat', () => {
    const result = service.verify({
      ...baseState,
      businessAgent: { ...baseState.businessAgent!, slug: 'legal' },
      finalAnswer: 'You can sign this contract.',
    });

    expect(result.passed).toBe(false);
    expect(result.recommendedAction).toBe('revise');
  });
});
