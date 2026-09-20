import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { BusinessAgentProfileView } from '../agent-runtime.types';
import type { AgentToolDefinition, ToolExecutionContext } from './agent-tool.types';
import { INTERNAL_TOOL_DEFINITIONS } from './tool-definitions';
import { ToolAuthorizationService } from './tool-authorization.service';

const tool = INTERNAL_TOOL_DEFINITIONS.find((definition) => definition.name === 'vector_search') as AgentToolDefinition;

const businessAgent: BusinessAgentProfileView = {
  id: 'agent-1',
  name: 'Marketing Agent',
  slug: 'marketing',
  department: 'Marketing',
  systemInstructions: 'Use approved context.',
  capabilities: ['rag', 'analysis', 'writing'],
  allowedSpecialists: ['rag', 'analysis', 'writing'],
  allowedTools: ['vector_search', 'company_profile'],
  knowledgeScopes: ['GENERAL'],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

function context(overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext {
  return {
    userId: 'user-1',
    organizationId: 'org-1',
    projectId: 'project-1',
    agentRunId: 'run-1',
    agentSlug: businessAgent.slug,
    agentProfileId: businessAgent.id,
    businessAgent,
    permissions: ['knowledge:read', 'company:read'],
    ...overrides,
  };
}

describe('ToolAuthorizationService', () => {
  const service = new ToolAuthorizationService();

  it('allows an enabled tool with user permission and agent allowlist', () => {
    expect(() => service.authorize(tool, context())).not.toThrow();
  });

  it('denies when the business agent allowlist omits the tool', () => {
    expect(() =>
      service.authorize(tool, context({
        businessAgent: { ...businessAgent, allowedTools: ['company_profile'] },
      })),
    ).toThrow(ForbiddenException);
  });

  it('denies when required user permission is missing', () => {
    expect(() => service.authorize(tool, context({ permissions: ['company:read'] }))).toThrow(ForbiddenException);
  });

  it('denies disabled tools by default', () => {
    expect(() => service.authorize({ ...tool, enabled: false }, context())).toThrow(ForbiddenException);
  });

  it('denies mutating tools without an approval policy', () => {
    expect(() => service.authorize({ ...tool, mutating: true }, context())).toThrow(ForbiddenException);
  });
});
