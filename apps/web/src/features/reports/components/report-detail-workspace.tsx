'use client';

import { Card, Pill } from '../../../components/platform/app-shell';
import { useReport } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { ChatWorkspace } from '../../conversations/components/chat-workspace';

interface ReportDetailWorkspaceProps {
  projectId: string;
  reportId: string;
}

export function ReportDetailWorkspace({ projectId, reportId }: ReportDetailWorkspaceProps) {
  const { session } = useAuth();
  const reportQuery = useReport(reportId, {
    accessToken: session.accessToken,
  });
  const report = reportQuery.data;

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI Readiness</span>
          <h1>{report?.title ?? 'AI Readiness report'}</h1>
          <p>Review the generated report and ask Magnafic AI follow-up questions in the same workspace.</p>
        </div>
        <div className="pill-row">
          <Pill tone={report?.status === 'READY' ? 'green' : 'amber'}>{report?.status ?? 'Loading'}</Pill>
        </div>
      </header>

      <section className="workspace-split">
        <Card>
          <div className="pill-row">
            <Pill tone="green">Report</Pill>
            <Pill tone="slate">{report?.sections.length ?? 0} sections</Pill>
            {report?.metadata ? <Pill tone={report.metadata.aiUsed === true ? 'green' : 'slate'}>{report.metadata.aiUsed === true ? 'AI-assisted' : 'Deterministic'}</Pill> : null}
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
