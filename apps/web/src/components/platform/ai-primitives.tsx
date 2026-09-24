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
      <summary>Knowledge sources · {normalized.length}</summary>
      <div className="timeline section-gap">
        {normalized.map((source, index) => (
          <div className="timeline-item" key={`${source.documentName}-${index}`}>
            <div>
              <strong>{source.documentName}</strong>
              <span>{source.pageNumber ? `Page ${source.pageNumber}` : source.kind}</span>
            </div>
            {typeof source.similarity === 'number' ? <Pill tone="slate">{source.similarity.toFixed(2)}</Pill> : null}
          </div>
        ))}
      </div>
    </details>
  );
}

export function AssistantMarkdown({ content }: { content: string }) {
  const blocks = markdownBlocks(content);

  return (
    <div className="assistant-markdown">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Heading = `h${block.level}` as 'h2' | 'h3' | 'h4';
          return <Heading key={index}>{renderInline(block.text)}</Heading>;
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={index}>
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
            </ListTag>
          );
        }

        if (block.type === 'table') {
          return (
            <div className="assistant-table-wrap" key={index}>
              <table>
                <thead>
                  <tr>{block.headers.map((header, cellIndex) => <th key={cellIndex}>{renderInline(header)}</th>)}</tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

export function messageSources(message: ConversationMessage): unknown[] {
  const sources = message.metadata?.sources;
  return Array.isArray(sources) ? sources : [];
}

type MarkdownBlock =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; text: string };

function markdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = (lines[index] ?? '').trim();

    if (!line || line === '---') {
      index += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    const headingMarkers = heading?.[1];
    const headingText = heading?.[2];
    if (headingMarkers && headingText) {
      blocks.push({ type: 'heading', level: Math.min(headingMarkers.length + 1, 4) as 2 | 3 | 4, text: headingText });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const tableLines: string[] = [];
      while (index < lines.length && (lines[index] ?? '').trim().startsWith('|')) {
        tableLines.push((lines[index] ?? '').trim());
        index += 1;
      }
      const [headerLine, , ...rowLines] = tableLines;
      blocks.push({
        type: 'table',
        headers: splitTableRow(headerLine ?? ''),
        rows: rowLines.map(splitTableRow),
      });
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const orderedList = Boolean(ordered);
      const items: string[] = [];
      while (index < lines.length) {
        const current = (lines[index] ?? '').trim();
        const match = orderedList ? /^\d+\.\s+(.+)$/.exec(current) : /^[-*]\s+(.+)$/.exec(current);
        const item = match?.[1];
        if (!item) {
          break;
        }
        items.push(item);
        index += 1;
      }
      blocks.push({ type: 'list', ordered: orderedList, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = (lines[index] ?? '').trim();
      if (!current || current === '---' || /^(#{1,4})\s+/.test(current) || /^[-*]\s+/.test(current) || /^\d+\.\s+/.test(current) || isTableStart(lines, index)) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function isTableStart(lines: string[], index: number): boolean {
  return Boolean(lines[index]?.trim().startsWith('|') && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index + 1]?.trim() ?? ''));
}

function splitTableRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
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
      kind: source.documentId === source.chunkId ? 'Project knowledge source' : 'Project knowledge',
    }));
}
