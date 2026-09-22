'use client';

import { Card, Pill } from '../../../components/platform/app-shell';
import { useAuth } from '../../../lib/auth/session';
import { usePromptTemplates } from '../../../lib/api/query-hooks';

export function PromptLibraryPanel() {
  const { session } = useAuth();
  const promptsQuery = usePromptTemplates({ accessToken: session.accessToken });
  const prompts = promptsQuery.data ?? [];

  return (
    <section className="grid-2">
      <Card>
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={promptsQuery.isError ? 'amber' : 'green'}>{promptsQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Prompt templates</h2>
        <div className="timeline">
          {prompts.map((prompt) => (
            <div className="timeline-item" key={prompt.id}>
              <div>
                <strong>{prompt.name}</strong>
                <p>{prompt.description}</p>
              </div>
              <Pill tone={prompt.status === 'APPROVED' ? 'green' : 'amber'}>{prompt.status}</Pill>
            </div>
          ))}
        </div>
        {!promptsQuery.isLoading && !promptsQuery.isError && prompts.length === 0 ? (
          <p className="section-gap">No prompt templates exist yet.</p>
        ) : null}
      </Card>
      <Card>
        <h2>Review queue</h2>
        <p>Draft prompts appear here before they can be used by AI agents.</p>
      </Card>
    </section>
  );
}
