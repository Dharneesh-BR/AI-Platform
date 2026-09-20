import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './http-client';
import { addConversationMessage, createConversation, getAgentRunStatus } from './platform';

describe('platform API helpers', () => {
  it('posts chat messages to the conversation endpoint', async () => {
    const apiClient = {
      post: vi.fn().mockResolvedValue({ id: 'conversation-1', messages: [], mode: 'sync' }),
    } as unknown as ApiClient;

    await addConversationMessage(apiClient, 'conversation-1', { content: 'Hello', agentSlug: 'magnafic-ai' });

    expect(apiClient.post).toHaveBeenCalledWith('/conversations/conversation-1/messages', {
      content: 'Hello',
      agentSlug: 'magnafic-ai',
    });
  });

  it('creates agent-scoped conversations', async () => {
    const apiClient = {
      post: vi.fn().mockResolvedValue({ id: 'conversation-1', metadata: { agentSlug: 'finance' }, messages: [] }),
    } as unknown as ApiClient;

    await createConversation(apiClient, 'project-1', { title: 'Finance Agent chat', agentSlug: 'finance' });

    expect(apiClient.post).toHaveBeenCalledWith('/projects/project-1/conversations', {
      title: 'Finance Agent chat',
      agentSlug: 'finance',
    });
  });

  it('gets async agent run polling status', async () => {
    const apiClient = {
      get: vi.fn().mockResolvedValue({ runId: 'run-1', status: 'RUNNING' }),
    } as unknown as ApiClient;

    await getAgentRunStatus(apiClient, 'run-1');

    expect(apiClient.get).toHaveBeenCalledWith('/agent-runs/run-1/status');
  });
});
