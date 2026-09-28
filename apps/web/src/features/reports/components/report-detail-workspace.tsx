'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, Pill } from '../../../components/platform/app-shell';
import { useReport } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import type { Report } from '../../../lib/api/platform';
import { ChatWorkspace } from '../../conversations/components/chat-workspace';

interface ReportDetailWorkspaceProps {
  projectId: string;
  reportId: string;
}

export function ReportDetailWorkspace({ projectId, reportId }: ReportDetailWorkspaceProps) {
  const { session } = useAuth();
  const [exportMessage, setExportMessage] = useState('');
  const reportQuery = useReport(reportId, {
    accessToken: session.accessToken,
  });
  const report = reportQuery.data;
  const markdownReport = useMemo(() => (report ? formatReportMarkdown(report) : ''), [report]);

  async function copyReport() {
    if (!markdownReport) {
      setExportMessage('Report is still loading.');
      return;
    }

    try {
      await copyText(markdownReport);
      setExportMessage('Report copied as Markdown.');
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'Unable to copy report.');
    }
  }

  function downloadReport() {
    if (!report || !markdownReport) {
      setExportMessage('Report is still loading.');
      return;
    }

    const blob = new Blob([markdownReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(report.title || 'ai-readiness-report')}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExportMessage('Report downloaded as Markdown.');
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI Readiness</span>
          <h1>{report?.title ?? 'AI Readiness report'}</h1>
          <p>Review the generated report and ask Magnafic AI follow-up questions in the same workspace.</p>
        </div>
        <div className="topbar-actions">
          <Pill tone={report?.status === 'READY' ? 'green' : 'amber'}>{report?.status ?? 'Loading'}</Pill>
          <Link className="button button-muted" href={`/projects/${projectId}/reports`}>All reports</Link>
          <Link className="button button-muted" href={`/projects/${projectId}`}>Project workspace</Link>
          <Link className="button button-muted" href={`/projects/${projectId}/knowledge`}>Knowledge</Link>
          <Link className="button button-primary" href={`/projects/${projectId}/chat`}>AI chat</Link>
        </div>
      </header>

      <section className="workspace-split">
        <Card>
          <div className="pill-row">
            <Pill tone="green">Report</Pill>
            <Pill tone="slate">{report?.sections.length ?? 0} sections</Pill>
            {report?.metadata ? <Pill tone={report.metadata.aiUsed === true ? 'green' : 'slate'}>{report.metadata.aiUsed === true ? 'AI-assisted' : 'Deterministic'}</Pill> : null}
          </div>
          <div className="profile-block section-gap">
            <h3>Export report</h3>
            <p>Use this version in stakeholder notes, documents, or internal review. The export includes AI disclosure and source context.</p>
            <div className="topbar-actions section-gap">
              <button className="button button-primary" type="button" onClick={() => void copyReport()} disabled={!report}>
                Copy Markdown
              </button>
              <button className="button button-muted" type="button" onClick={downloadReport} disabled={!report}>
                Download Markdown
              </button>
              <button className="button button-muted" type="button" onClick={() => window.print()} disabled={!report}>
                Print
              </button>
            </div>
            {exportMessage ? <p className="section-gap">{exportMessage}</p> : null}
          </div>
          {report?.metadata ? <ReportDisclosure metadata={report.metadata} /> : null}
          {reportQuery.isLoading ? <p className="section-gap">Loading report...</p> : null}
          {reportQuery.isError ? <p className="section-gap">Unable to load this report. Check API session and permissions.</p> : null}
          <div className="stack section-gap">
            {(report?.sections ?? []).map((section) => (
              <section className="profile-block" key={section.id}>
                <h2>{section.title}</h2>
                <ReportSectionContent content={section.content} />
              </section>
            ))}
          </div>
          {!reportQuery.isLoading && report?.sections.length === 0 ? (
            <div className="empty-state section-gap">
              <h3>No report sections yet</h3>
              <p>Generate or refresh the report when project context is ready.</p>
            </div>
          ) : null}
        </Card>

        <div className="sticky-panel">
          <ChatWorkspace projectId={projectId} embedded />
        </div>
      </section>
    </div>
  );
}

function ReportDisclosure({ metadata }: { metadata: Record<string, unknown> }) {
  const disclosure = typeof metadata.disclosure === 'string'
    ? metadata.disclosure
    : metadata.aiUsed === true
      ? 'This report was AI-assisted using approved project context.'
      : 'This report was generated from available project context.';
  const sourceTitles = Array.isArray(metadata.sourceTitles)
    ? metadata.sourceTitles.filter((title): title is string => typeof title === 'string' && Boolean(title.trim()))
    : [];

  return (
    <div className="profile-block section-gap">
      <h3>Generation disclosure</h3>
      <p>{disclosure}</p>
      <div className="pill-row section-gap">
        {typeof metadata.model === 'string' ? <Pill tone="slate">{metadata.model}</Pill> : null}
        {typeof metadata.sourceCount === 'number' ? <Pill tone="green">{metadata.sourceCount} sources</Pill> : null}
      </div>
      {sourceTitles.length ? <p>Sources used: {sourceTitles.join(', ')}</p> : null}
    </div>
  );
}

function ReportSectionContent({ content }: { content: unknown }) {
  const rendered = renderSectionContent(content);

  return (
    <>
      <p>{rendered.text}</p>
      {rendered.bullets.length ? (
        <ul className="section-gap">
          {rendered.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
        </ul>
      ) : null}
    </>
  );
}

function renderSectionContent(content: unknown): { text: string; bullets: string[] } {
  if (typeof content === 'string') {
    return { text: content, bullets: [] };
  }
  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>;
    if (typeof record.summary === 'string') {
      return { text: record.summary, bullets: stringArray(record.bullets) };
    }
    if (typeof record.text === 'string') {
      return { text: record.text, bullets: stringArray(record.bullets) };
    }
    return { text: JSON.stringify(content, null, 2), bullets: [] };
  }
  return { text: 'No content available.', bullets: [] };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Copy is not available in this browser.');
  }
}

function formatReportMarkdown(report: Report): string {
  const lines = [
    `# ${report.title}`,
    '',
    `Status: ${report.status}`,
    `Generated: ${formatDate(report.createdAt)}`,
  ];

  if (report.metadata) {
    lines.push('', '## Generation Disclosure', '', formatDisclosure(report.metadata));
    const sourceTitles = getSourceTitles(report.metadata);
    if (sourceTitles.length) {
      lines.push('', 'Sources used:');
      sourceTitles.forEach((title) => lines.push(`- ${title}`));
    }
  }

  report.sections
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal)
    .forEach((section) => {
      const rendered = renderSectionContent(section.content);
      lines.push('', `## ${section.title}`, '', rendered.text);
      rendered.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
    });

  return `${lines.join('\n')}\n`;
}

function formatDisclosure(metadata: Record<string, unknown>): string {
  if (typeof metadata.disclosure === 'string') {
    return metadata.disclosure;
  }
  return metadata.aiUsed === true
    ? 'This report was AI-assisted using approved project context.'
    : 'This report was generated from available project context.';
}

function getSourceTitles(metadata: Record<string, unknown>): string[] {
  return Array.isArray(metadata.sourceTitles)
    ? metadata.sourceTitles.filter((title): title is string => typeof title === 'string' && Boolean(title.trim()))
    : [];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'ai-readiness-report';
}
