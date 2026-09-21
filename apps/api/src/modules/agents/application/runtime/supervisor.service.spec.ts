import { describe, expect, it } from 'vitest';
import type { BusinessAgentProfileView } from './agent-runtime.types';
import { SupervisorService } from './supervisor.service';

const businessAgent: BusinessAgentProfileView = {
  id: 'agent-1',
  name: 'Magnafic AI',
  slug: 'magnafic-ai',
  department: 'Strategy',
  systemInstructions: 'Advise safely.',
  capabilities: ['rag', 'analysis', 'writing', 'calculation', 'research', 'document', 'planning'],
  allowedSpecialists: [],
  allowedTools: [],
  knowledgeScopes: [],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

describe('SupervisorService', () => {
  const service = new SupervisorService();

  it('classifies a short advisory request as simple', () => {
    const result = service.classify({ userInput: 'Write a short summary.', businessAgent });

    expect(result.complexity).toBe('simple');
    expect(result.requiresPlanning).toBe(false);
    expect(result.requiredCapabilities).toContain('writing');
  });

  it('detects knowledge-backed requests', () => {
    const result = service.classify({ userInput: 'Based on our uploaded company profile, recommend priorities.', businessAgent });

    expect(result.needsCompanyKnowledge).toBe(true);
    expect(result.requiredCapabilities).toContain('rag');
  });

  it('classifies broad multi-capability work as complex', () => {
    const result = service.classify({
      userInput: 'Using our company information, analyze growth risks, calculate ROI, prioritize opportunities, and write a stakeholder report.',
      businessAgent,
    });

    expect(result.complexity).toBe('complex');
    expect(result.requiresPlanning).toBe(true);
    expect(result.requiredCapabilities).toEqual(expect.arrayContaining(['rag', 'calculation', 'analysis', 'writing']));
  });

  it('routes readiness and growth report requests through analysis and writing', () => {
    const result = service.classify({
      userInput: 'Create an AI readiness and growth report for this company.',
      businessAgent,
    });

    expect(result.complexity).toBe('standard');
    expect(result.requiresPlanning).toBe(true);
    expect(result.requiredCapabilities).toEqual(expect.arrayContaining(['analysis', 'writing']));
  });

  it('respects business-agent capability bounds', () => {
    const result = service.classify({
      userInput: 'Calculate growth and write a report.',
      businessAgent: { ...businessAgent, capabilities: ['writing'] },
    });

    expect(result.requiredCapabilities).toEqual(['writing']);
  });
});
