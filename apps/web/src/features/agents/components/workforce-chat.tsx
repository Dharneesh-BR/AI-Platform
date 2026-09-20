'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ChevronLeft, MessageSquarePlus, Plus } from 'lucide-react';
import { AsyncRunProgress, messageSources, SourceList } from '../../../components/platform/ai-primitives';
import { Pill } from '../../../components/platform/app-shell';
import {
  useAddConversationMessage,
  useAgentRunStatus,
  useBusinessAgents,
  useConversations,
  useCreateConversation,
  useProjects,
} from '../../../lib/api/query-hooks';
import type { BusinessAgentProfile } from '../../../lib/api/platform';
import type { Conversation } from '../../../lib/api/platform';
import { hasApiAuth } from '../../../lib/auth/api-access';
import { useAuth } from '../../../lib/auth/session';

interface WorkforceChatProps {
  initialAgentSlug?: string;
}

const promptSuggestions: Record<string, string[]> = {
  'magnafic-ai': [
    'What should we prioritize first based on our company context?',
    'Create an executive action plan for the next 30 days.',
    'Summarize the biggest AI opportunities for this project.',
  ],
  marketing: [
    'Give me a 90-day customer acquisition strategy based on our company.',
    'Analyze our positioning and suggest campaign themes.',
    'Identify the highest-impact growth channels for this project.',
  ],
  sales: [
    'Create a sales follow-up plan for our target customers.',
    'Identify the strongest customer segments from our profile.',
    'Draft a discovery-call question set for this business.',
  ],
  finance: [
    'Analyze the financial risks in our current priorities.',
    'Estimate ROI assumptions for our top AI opportunities.',
    'Summarize cost-reduction opportunities from our company context.',
  ],
  legal: [
    'Review our AI adoption risks and governance considerations.',
    'Create a compliance checklist for this AI initiative.',
    'Summarize legal caveats for the current recommendations.',
  ],
  production: [
    'Identify operational bottlenecks suitable for automation.',
    'Create a 90-day operations improvement plan.',
    'Prioritize production or delivery workflows for AI support.',
  ],
};

function agentInitial(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function fallbackPrompt(agent?: BusinessAgentProfile) {
  return `Ask ${agent?.name ?? 'Magnafic AI'} about strategy, risks, priorities, or execution plans.`;
}

function conversationAgentSlug(conversation: Conversation): string | undefined {
  const metadataSlug = conversation.metadata?.agentSlug;
  if (typeof metadataSlug === 'string') {
    return metadataSlug;
  }

  const assistantMessage = [...conversation.messages].reverse().find((message) => {
    const messageAgentSlug = message.metadata?.agentSlug;
    return typeof messageAgentSlug === 'string';
  });
  const messageAgentSlug = assistantMessage?.metadata?.agentSlug;

  return typeof messageAgentSlug === 'string' ? messageAgentSlug : undefined;
}

export function WorkforceChat({ initialAgentSlug = 'magnafic-ai' }: WorkforceChatProps) {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const agentsQuery = useBusinessAgents(context);
  const projectsQuery = useProjects(context);
  const agents = agentsQuery.data ?? [];
  const [selectedAgentSlug, setSelectedAgentSlug] = useState(initialAgentSlug);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const selectedProject = (projectsQuery.data ?? []).find((project) => project.id === selectedProjectId) ?? (projectsQuery.data ?? [])[0];
  const projectId = selectedProject?.id ?? '';
  const conversationsQuery = useConversations(projectId, context);
  const createConversation = useCreateConversation(projectId, context);
  const addMessage = useAddConversationMessage(projectId, context);
  const conversations = conversationsQuery.data ?? [];
  const selectedAgent = agents.find((agent) => agent.slug === selectedAgentSlug) ?? agents[0];
  const activeConversation = selectedAgent
    ? conversations.find((conversation) => conversationAgentSlug(conversation) === selectedAgent.slug)
    : undefined;
  const [prompt, setPrompt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeRunId, setActiveRunId] = useState<string>();
  const runStatusQuery = useAgentRunStatus(activeRunId, context);
  const activeRun = runStatusQuery.data;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const displayMessages = useMemo(
    () => activeConversation?.messages?.length ? activeConversation.messages : [],
    [activeConversation],
  );

  const suggestions = promptSuggestions[selectedAgent?.slug ?? selectedAgentSlug] ?? [
    'What should we prioritize first?',
    'Create an action plan based on our company context.',
    'Summarize the biggest AI opportunities for this project.',
  ];

  useEffect(() => {
    setSelectedAgentSlug(initialAgentSlug);
  }, [initialAgentSlug]);

  useEffect(() => {
    const projects = projectsQuery.data ?? [];
    if (!selectedProjectId && projects[0]?.id) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    const firstAgent = agents[0];
    if (firstAgent && !agents.some((agent) => agent.slug === selectedAgentSlug)) {
      setSelectedAgentSlug(firstAgent.slug);
    }
  }, [agents, selectedAgentSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [displayMessages.length, activeRun?.status]);

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

  useEffect(() => {
    if (!activeRun) {
      return;
    }

    if (activeRun.status === 'SUCCEEDED') {
      setStatusMessage('Answer completed and verified.');
      void conversationsQuery.refetch();
      return;
    }

    if (activeRun.status === 'FAILED') {
      setStatusMessage(activeRun.errorMessage ?? 'The queued AI task failed. Please retry.');
      return;
    }

    setStatusMessage(activeRun.progressLabel);
  }, [activeRun, conversationsQuery]);

  async function sendPrompt(content = prompt) {
    const trimmedPrompt = content.trim();

    if (!hasApiAuth(session)) {
      setStatusMessage('Please sign in before sending a message.');
      return;
    }

    if (!projectId) {
      setStatusMessage('Create a project first so the agent has company context.');
      return;
    }

    if (!selectedAgent) {
      setStatusMessage('Select an available agent before sending.');
      return;
    }

    if (!trimmedPrompt) {
      setStatusMessage('Type a message before sending.');
      return;
    }

    try {
      const conversation = activeConversation ?? await createConversation.mutateAsync({
        title: `${selectedAgent.name} chat`,
        agentSlug: selectedAgent.slug,
      });
      const response = await addMessage.mutateAsync({
        conversationId: conversation.id,
        content: trimmedPrompt,
        agentSlug: selectedAgent.slug,
      });

      setPrompt('');

      if (response.mode === 'async' && response.runId) {
        setActiveRunId(response.runId);
        setStatusMessage(`${selectedAgent.name} is working on this request.`);
        return;
      }

      setActiveRunId(undefined);
      setStatusMessage(`Answered by ${selectedAgent.name}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to send message. Please retry.');
    }
  }

  async function startNewChat() {
    if (!projectId || !selectedAgent) {
      return;
    }

    await createConversation.mutateAsync({ title: `${selectedAgent.name} chat`, agentSlug: selectedAgent.slug });
    setActiveRunId(undefined);
    setStatusMessage('New chat is ready.');
  }

  const isBusy = addMessage.isPending || createConversation.isPending;
  const isLoading = agentsQuery.isLoading || projectsQuery.isLoading;

  return (
    <section className="workforce-chat-shell">
      <aside className="workforce-agent-rail" aria-label="AI workforce agents">
        <div className="workforce-rail-header">
          <Link className="workforce-back-link" href="/dashboard">
            <ChevronLeft size={17} aria-hidden="true" />
            Dashboard
          </Link>
          <button className="icon-button" type="button" onClick={() => void startNewChat()} disabled={isBusy || !projectId} title="New chat">
            <MessageSquarePlus size={18} aria-hidden="true" />
          </button>
        </div>

        {projectsQuery.data && projectsQuery.data.length > 1 ? (
          <label className="compact-field">
            <span>Project context</span>
            <select value={projectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
              {projectsQuery.data.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="workforce-agent-list">
          {agents.map((agent) => (
            <Link
              className={agent.slug === selectedAgent?.slug ? 'workforce-agent-button active' : 'workforce-agent-button'}
              href={`/workforce/${agent.slug}`}
              key={agent.slug}
              onClick={() => setSelectedAgentSlug(agent.slug)}
            >
              <span className="agent-avatar">{agentInitial(agent.name)}</span>
              <span>
                <strong>{agent.name}</strong>
                <small>{agent.department}</small>
              </span>
            </Link>
          ))}
        </div>

        {agentsQuery.isError ? <p className="rail-note">Agents could not be loaded from the API.</p> : null}
        {!isLoading && agents.length === 0 ? <p className="rail-note">No Workforce agents are enabled yet.</p> : null}
      </aside>

      <div className="workforce-chat-main">
        <header className="workforce-chat-header">
          <div>
            <span className="eyebrow">AI Workforce</span>
            <h1>{selectedAgent?.name ?? 'AI Workforce'}</h1>
            <p>{selectedAgent?.description ?? 'Choose an agent and ask a company-aware question.'}</p>
          </div>
          <div className="workforce-header-meta">
            {selectedAgent ? <Pill tone="green">Available</Pill> : null}
            {selectedAgent ? <Pill tone="slate">{selectedAgent.department}</Pill> : null}
          </div>
        </header>

        {!projectId && !projectsQuery.isLoading ? (
          <div className="chat-empty-state">
            <h2>Create a project first</h2>
            <p>Workforce agents need a project context before they can answer company-aware questions.</p>
            <Link className="button button-primary section-gap" href="/projects">Go to projects</Link>
          </div>
        ) : null}

        {projectId ? (
          <>
            <div className="workforce-message-scroll">
              {displayMessages.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="agent-avatar large">{selectedAgent ? agentInitial(selectedAgent.name) : 'AI'}</div>
                  <h2>How can {selectedAgent?.name ?? 'Magnafic AI'} help?</h2>
                  <p>{fallbackPrompt(selectedAgent)}</p>
                  <div className="suggestion-grid">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => void sendPrompt(suggestion)}>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="message-thread">
                  {displayMessages.map((chatMessage) => (
                    <article className={`chat-message-row ${chatMessage.role}`} key={chatMessage.id}>
                      <div className="chat-message-avatar">
                        {chatMessage.role === 'user' ? 'You' : agentInitial(selectedAgent?.name ?? 'AI')}
                      </div>
                      <div className="chat-message-bubble">
                        <strong>{chatMessage.role === 'user' ? 'You' : selectedAgent?.name ?? 'Assistant'}</strong>
                        <p>{chatMessage.content}</p>
                        <SourceList sources={messageSources(chatMessage)} />
                      </div>
                    </article>
                  ))}
                  {activeRun ? (
                    <article className="chat-message-row assistant">
                      <div className="chat-message-avatar">{agentInitial(selectedAgent?.name ?? 'AI')}</div>
                      <div className="chat-message-bubble">
                        <AsyncRunProgress run={activeRun} />
                        {activeRun.answer ? <p className="section-gap">{activeRun.answer}</p> : null}
                        <SourceList sources={activeRun.sources} />
                      </div>
                    </article>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <footer className="workforce-composer-wrap">
              {statusMessage ? <p className="composer-status" aria-live="polite">{statusMessage}</p> : null}
              <form
                className="workforce-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendPrompt();
                }}
              >
                <textarea
                  aria-label={`Message ${selectedAgent?.name ?? 'AI Workforce'}`}
                  placeholder={fallbackPrompt(selectedAgent)}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendPrompt();
                    }
                  }}
                  rows={1}
                />
                <button className="send-button" type="submit" disabled={isBusy || !prompt.trim() || !selectedAgent || !hasApiAuth(session)} title="Send message">
                  {isBusy ? <Plus size={18} aria-hidden="true" /> : <ArrowUp size={18} aria-hidden="true" />}
                </button>
              </form>
            </footer>
          </>
        ) : null}
      </div>
    </section>
  );
}
