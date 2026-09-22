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
          </div>
          {reportQuery.isLoading ? <p className="section-gap">Loading report...</p> : null}
          {reportQuery.isError ? <p className="section-gap">Unable to load this report. Check API session and permissions.</p> : null}
          <div className="stack section-gap">
            {(report?.sections ?? []).map((section) => (
              <section className="profile-block" key={section.id}>
                <h2>{section.title}</h2>
                <p>{renderSectionContent(section.content)}</p>
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

function renderSectionContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>;
    if (typeof record.summary === 'string') {
      return record.summary;
    }
    if (typeof record.text === 'string') {
      return record.text;
    }
    return JSON.stringify(content, null, 2);
  }
  return 'No content available.';
}
