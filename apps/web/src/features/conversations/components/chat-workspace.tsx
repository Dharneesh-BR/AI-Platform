'use client';

import { useMemo, useState } from 'react';
import { Card, Pill } from '../../../components/platform/app-shell';
import { useAddConversationMessage, useConversations, useCreateConversation } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface ChatWorkspaceProps {
  projectId: string;
}

export function ChatWorkspace({ projectId }: ChatWorkspaceProps) {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const conversationsQuery = useConversations(projectId, context);
  const createConversation = useCreateConversation(projectId, context);
  const conversations = conversationsQuery.data ?? [];
  const activeConversation = conversations[0];
  const addMessage = useAddConversationMessage(projectId, activeConversation?.id ?? '', context);
  const [prompt, setPrompt] = useState('Based on our company profile, what should we prioritize next?');
  const [message, setMessage] = useState('Start a live conversation when API auth is enabled.');

  const displayMessages = useMemo(
    () =>
      activeConversation?.messages?.length
        ? activeConversation.messages
        : [],
    [activeConversation],
  );

  async function sendPrompt() {
    if (!session.accessToken) {
      setMessage('API token is required before chat writes to the database.');
      return;
    }

    const conversation = activeConversation ?? await createConversation.mutateAsync({ title: 'Consulting chat' });
    if (!activeConversation && conversation.id) {
      setMessage('Created conversation. Send again to add a message after refresh.');
      return;
    }

    await addMessage.mutateAsync({ content: prompt || 'What should we prioritize next?' });
    setMessage('Sent message to live conversation.');
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI Chat</span>
          <h1>Ask company-aware strategic questions.</h1>
          <p>Chat unlocks after discovery and profile approval provide reliable company context.</p>
        </div>
        <button className="button button-primary" onClick={() => void createConversation.mutateAsync({ title: 'New consulting chat' })} disabled={createConversation.isPending || !session.accessToken}>
          New conversation
        </button>
      </header>
      <section className="grid-2">
        <Card>
          <div className="pill-row">
            <Pill tone="green">Live API</Pill>
            <Pill tone="green">Project profile</Pill><Pill tone="green">Company profile</Pill><Pill>Research</Pill>
          </div>
          <h2 className="section-gap">Conversation</h2>
          <div className="timeline">
            {displayMessages.map((chatMessage) => (
              <div className="timeline-item" key={chatMessage.id}>
                <strong>{chatMessage.role}</strong>
                <span>{chatMessage.content}</span>
              </div>
            ))}
          </div>
          {!conversationsQuery.isLoading && displayMessages.length === 0 ? (
            <p className="section-gap">No messages yet. Create a conversation and send the first question.</p>
          ) : null}
        </Card>
        <Card>
          <h2>Ask a question</h2>
          <div className="field section-gap">
            <label>Prompt</label>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </div>
          <div className="topbar-actions section-gap">
            <button className="button button-primary" onClick={() => void sendPrompt()} disabled={addMessage.isPending}>
              Send
            </button>
            <p>{message}</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
