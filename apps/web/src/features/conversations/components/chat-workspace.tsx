'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssistantMarkdown, AsyncRunProgress, messageSources, SourceList } from '../../../components/platform/ai-primitives';
import { Card, Pill } from '../../../components/platform/app-shell';
import { useAddConversationMessage, useAgentRunStatus, useBusinessAgents, useConversations, useCreateConversation } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { hasApiAuth } from '../../../lib/auth/api-access';

interface ChatWorkspaceProps {
  projectId: string;
  embedded?: boolean;
  initialAgentSlug?: string;
  showAgentPicker?: boolean;
}

export function ChatWorkspace({
  projectId,
  embedded = false,
  initialAgentSlug = 'magnafic-ai',
  showAgentPicker = true,
}: ChatWorkspaceProps) {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
  const conversationsQuery = useConversations(projectId, context);
  const agentsQuery = useBusinessAgents(context);
  const createConversation = useCreateConversation(projectId, context);
  const conversations = conversationsQuery.data ?? [];
  const agents = agentsQuery.data ?? [];
  const activeConversation = conversations[0];
  const addMessage = useAddConversationMessage(projectId, context);
  const [prompt, setPrompt] = useState('Based on our company profile and knowledge sources, what support issues should we prioritize first?');
  const [message, setMessage] = useState('');
  const [agentSlug, setAgentSlug] = useState(initialAgentSlug);
  const [activeRunId, setActiveRunId] = useState<string>();
  const activeAgent = agents.find((agent) => agent.slug === agentSlug);
  const runStatusQuery = useAgentRunStatus(activeRunId, context);
  const activeRun = runStatusQuery.data;

  const displayMessages = useMemo(
    () => activeConversation?.messages?.length ? activeConversation.messages : [],
    [activeConversation],
  );

  useEffect(() => {
    setAgentSlug(initialAgentSlug);
  }, [initialAgentSlug]);

  useEffect(() => {
    const latestAsyncMessage = [...displayMessages].reverse().find((chatMessage) => {
      const metadata = chatMessage.metadata ?? {};
      return metadata.mode === 'async' && typeof metadata.agentRunId === 'string';
    });
    const recoveredRunId = latestAsyncMessage?.metadata?.agentRunId;
    if (!activeRunId && typeof recoveredRunId === 'string') {
      setActiveRunId(recoveredRunId);
    }
  }, [activeRunId, displayMessages]);

  async function sendPrompt() {
    if (!hasApiAuth(session)) {
      setMessage('Please sign in before sending a message.');
      return;
    }

    try {
      const conversation = activeConversation ?? await createConversation.mutateAsync({ title: `${activeAgent?.name ?? 'Magnafic AI'} chat` });
      const response = await addMessage.mutateAsync({
        conversationId: conversation.id,
        content: prompt || 'What should we prioritize next?',
        agentSlug,
      });

      if (response.mode === 'async' && response.runId) {
        setActiveRunId(response.runId);
        setMessage(`${activeAgent?.name ?? 'Magnafic AI'} is working on this multi-step request.`);
        return;
      }

      setActiveRunId(undefined);
      setMessage(`Answered by ${activeAgent?.name ?? 'Magnafic AI'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send message. Please retry.');
    }
  }

  useEffect(() => {
    if (!activeRun) {
      return;
    }

    if (activeRun.status === 'SUCCEEDED') {
      setMessage('Multi-step answer completed and verified.');
      void conversationsQuery.refetch();
      return;
    }

    if (activeRun.status === 'FAILED') {
      setMessage(activeRun.errorMessage ?? 'The queued AI task failed. Please retry.');
      return;
    }

    setMessage(activeRun.progressLabel);
  }, [activeRun, conversationsQuery]);

  const agentOptions = agents.length
    ? agents
    : [{ slug: 'magnafic-ai', name: 'Magnafic AI', department: 'General Consulting', description: 'Default AI consultant.', capabilities: [] }];

  const chatBody = (
    <>
      <Card>
        <div className="pill-row">
          <Pill>Shared AI workforce runtime</Pill>
          <Pill tone="green">{activeAgent?.name ?? 'Magnafic AI'}</Pill>
        </div>
        {showAgentPicker ? (
          <>
            <h2 className="section-gap">Choose business agent</h2>
            <div className="grid-3 section-gap">
              {agentOptions.map((agent) => (
                <button
                  className={agent.slug === agentSlug ? 'button button-primary' : 'button button-muted'}
                  key={agent.slug}
                  onClick={() => setAgentSlug(agent.slug)}
                  type="button"
                >
                  {agent.name}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <p>{activeAgent?.description ?? 'This agent uses approved company context and project knowledge.'}</p>
      </Card>

      <Card>
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone="green">Company context</Pill>
          <Pill>{activeAgent?.department ?? 'General Consulting'}</Pill>
        </div>
        <h2 className="section-gap">{activeAgent?.name ?? 'Magnafic AI'} chat</h2>
        <div className="timeline">
          {displayMessages.map((chatMessage) => (
            <div className={`timeline-item message-card ${chatMessage.role}`} key={chatMessage.id}>
              <strong className="message-role">{chatMessage.role}</strong>
              {chatMessage.role === 'assistant'
                ? <AssistantMarkdown content={chatMessage.content} />
                : <span>{chatMessage.content}</span>}
              <SourceList sources={messageSources(chatMessage)} />
            </div>
          ))}
        </div>
        {!conversationsQuery.isLoading && displayMessages.length === 0 ? (
          <p className="section-gap">Ask your first company-aware question below.</p>
        ) : null}
        {activeRun ? (
          <div className="section-gap">
            <AsyncRunProgress run={activeRun} />
            {activeRun.answer ? <AssistantMarkdown content={activeRun.answer} /> : null}
            <SourceList sources={activeRun.sources} />
            {activeRun.status === 'FAILED' ? (
              <button className="button button-muted section-gap" onClick={() => void sendPrompt()} type="button">
                Retry request
              </button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card>
        <h2>Ask a question</h2>
        <div className="field section-gap">
          <label>Prompt</label>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </div>
        <div className="topbar-actions section-gap">
          <button className="button button-primary" onClick={() => void sendPrompt()} disabled={addMessage.isPending || createConversation.isPending || !hasApiAuth(session)}>
            {addMessage.isPending ? 'Sending...' : 'Send'}
          </button>
          <button className="button button-muted" onClick={() => void createConversation.mutateAsync({ title: 'New consulting chat' })} disabled={createConversation.isPending || !hasApiAuth(session)}>
            New chat
          </button>
          <p>{message}</p>
        </div>
      </Card>
    </>
  );

  if (embedded) {
    return <div className="grid-1">{chatBody}</div>;
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI Chat</span>
          <h1>Ask company-aware strategic questions.</h1>
          <p>Chat opens after onboarding and uses the generated report card as company context.</p>
        </div>
        <button className="button button-primary" onClick={() => void createConversation.mutateAsync({ title: 'New consulting chat' })} disabled={createConversation.isPending || !hasApiAuth(session)}>
          New conversation
        </button>
      </header>
      <section className="grid-2">
        {chatBody}
      </section>
    </div>
  );
}
