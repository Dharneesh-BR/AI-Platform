import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { BusinessAgentProfileView } from '../agent-runtime.types';
import type { ToolExecutionContext } from './agent-tool.types';
import { ToolAuthorizationService } from './tool-authorization.service';
import { ToolRegistryService } from './tool-registry.service';

const businessAgent: BusinessAgentProfileView = {
  id: 'agent-1',
  name: 'Marketing Agent',
  slug: 'marketing',
  department: 'Marketing',
  systemInstructions: 'Use approved context.',
  capabilities: ['rag', 'analysis', 'writing'],
  allowedSpecialists: ['rag', 'analysis', 'writing'],
  allowedTools: ['vector_search'],
  knowledgeScopes: ['GENERAL'],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

function context(overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext {
  return {
    userId: 'user-1',
    projectId: 'project-1',
    agentRunId: 'run-1',
    agentStepId: 'step-1',
    agentSlug: businessAgent.slug,
    agentProfileId: businessAgent.id,
    businessAgent,
    permissions: ['knowledge:read'],
    ...overrides,
  };
}

function service() {
  const prisma = {
    toolExecution: {
      create: vi.fn().mockResolvedValue({ id: 'tool-execution-1' }),
      update: vi.fn().mockResolvedValue({ id: 'tool-execution-1' }),
    },
  };
  return {
    prisma,
    registry: new ToolRegistryService(prisma as never, new ToolAuthorizationService()),
  };
}

describe('ToolRegistryService', () => {
  it('executes an authorized tool and records completion audit', async () => {
    const { prisma, registry } = service();

    const result = await registry.execute('vector_search', context(), { query: 'Aurora target' }, () => ({
      ok: true,
      data: { answer: '47 customers' },
      sources: [{ documentId: 'doc-1' }],
    }));

    expect(result).toMatchObject({ ok: true, data: { answer: '47 customers' } });
    expect(prisma.toolExecution.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'RUNNING', toolName: 'vector_search' }),
    }));
    expect(prisma.toolExecution.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED' }),
    }));
  });

  it('default-denies unknown tools', async () => {
    const { registry } = service();

    await expect(registry.execute('crm.update', context(), {}, () => ({ ok: true }))).rejects.toThrow(ForbiddenException);
  });

  it('denies malformed input before handler execution', async () => {
    const { prisma, registry } = service();
    const handler = vi.fn();

    await expect(registry.execute('vector_search', context(), { limit: 1 }, handler)).rejects.toThrow(BadRequestException);
    expect(handler).not.toHaveBeenCalled();
    expect(prisma.toolExecution.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DENIED', errorCode: 'VALIDATION_ERROR' }),
    }));
  });

  it('denies disabled tools before handler execution', async () => {
    const { prisma, registry } = service();
    const handler = vi.fn();

    await expect(registry.execute('web_search', context({
      businessAgent: { ...businessAgent, capabilities: ['research'], allowedTools: ['web_search'] },
      permissions: ['research:read'],
    }), { query: 'market news' }, handler)).rejects.toThrow(ForbiddenException);
    expect(handler).not.toHaveBeenCalled();
    expect(prisma.toolExecution.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DENIED', errorCode: 'FORBIDDEN' }),
    }));
  });
});
