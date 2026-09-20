import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { BusinessAgentProfileView } from '../agent-runtime.types';
import type { AgentSpecialist } from './specialist.interface';
import { SpecialistRegistryService } from './specialist-registry.service';

const businessAgent: BusinessAgentProfileView = {
  name: 'Magnafic AI',
  slug: 'magnafic-ai',
  department: 'Strategy',
  systemInstructions: 'Advise safely.',
  capabilities: ['analysis', 'writing'],
  allowedSpecialists: [],
  allowedTools: [],
  knowledgeScopes: [],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

function specialist(capability: AgentSpecialist['capability']): AgentSpecialist {
  return {
    capability,
    requiredPermissions: [],
    supportedTools: [],
    execute: async () => ({ capability, content: `${capability} result` }),
  };
}

describe('SpecialistRegistryService', () => {
  const registry = new SpecialistRegistryService(
    specialist('rag') as never,
    specialist('research') as never,
    specialist('analysis') as never,
    specialist('writing') as never,
    specialist('calculation') as never,
    specialist('document') as never,
  );

  it('returns a known specialist', () => {
    expect(registry.get('analysis', businessAgent).capability).toBe('analysis');
  });

  it('rejects unavailable capability mappings', () => {
    expect(() => registry.get('planning', businessAgent)).toThrow(BadRequestException);
  });

  it('enforces business-agent specialist restrictions', () => {
    expect(() => registry.get('calculation', { ...businessAgent, allowedSpecialists: ['analysis'] })).toThrow(BadRequestException);
  });

  it('lists registered specialist capabilities', () => {
    expect(registry.list().map((entry) => entry.capability)).toEqual(expect.arrayContaining(['rag', 'analysis', 'writing']));
  });
});
