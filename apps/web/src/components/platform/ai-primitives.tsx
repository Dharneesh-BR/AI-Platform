'use client';

import type { AgentRunStatus, ConversationMessage } from '../../lib/api/platform';
import { Pill } from './app-shell';

export function AsyncRunProgress({ run }: { run: AgentRunStatus }) {
  const steps = run.steps.length
    ? run.steps
    : [
        {
          id: run.runId,
          node: run.progressLabel,
          specialist: null,
          status: run.status,
          model: null,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          error: run.errorMessage,
          metadata: {},
        },
      ];

  return (
    <div className="async-progress" aria-live="polite">
      <div>
        <strong>{run.progressLabel}</strong>
        <p>{run.status === 'FAILED' ? run.errorMessage ?? 'The agent run failed.' : `Status: ${run.status}`}</p>
      </div>
      <div className="async-step-list">
        {steps.map((step) => (
          <div className="async-step" key={step.id}>
            <span className={`step-dot step-${step.status.toLowerCase()}`} aria-hidden="true" />
            <span>{labelForStep(step.node)}</span>
            <Pill tone={step.status === 'SUCCEEDED' ? 'green' : step.status === 'FAILED' ? 'amber' : 'blue'}>
              {step.status}
            </Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceList({ sources }: { sources: unknown[] | undefined }) {
  const normalized = normalizeSources(sources);

  if (normalized.length === 0) {
    return null;
  }

  return (
    <details className="source-list">
      <summary>Sources · {normalized.length}</summary>
      <div className="timeline section-gap">
        {normalized.map((source, index) => (
          <div className="timeline-item" key={`${source.documentName}-${index}`}>
            <div>
              <strong>{source.documentName}</strong>
              <span>{source.pageNumber ? `Page ${source.pageNumber}` : 'Company knowledge'}</span>
            </div>
            {typeof source.similarity === 'number' ? <Pill tone="slate">{source.similarity.toFixed(2)}</Pill> : null}
          </div>
        ))}
      </div>
    </details>
  );
}

export function messageSources(message: ConversationMessage): unknown[] {
  const sources = message.metadata?.sources;
  return Array.isArray(sources) ? sources : [];
}

function labelForStep(node: string): string {
  const labels: Record<string, string> = {
    load_context: 'Reviewing company context',
    supervisor: 'Planning request',
    planner: 'Preparing workflow',
    specialists: 'Analyzing with agent skills',
    synthesis: 'Preparing response',
    verification: 'Verifying response',
  };

  return labels[node] ?? node.replaceAll('_', ' ');
}

function normalizeSources(sources: unknown[] | undefined) {
  return (sources ?? [])
    .filter((source): source is Record<string, unknown> => Boolean(source) && typeof source === 'object')
    .map((source) => ({
      documentName: typeof source.documentName === 'string' ? source.documentName : 'Company source',
      pageNumber: typeof source.pageNumber === 'number' ? source.pageNumber : null,
      similarity: typeof source.similarity === 'number' ? source.similarity : null,
    }));
}
