'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, MetricCard, Pill } from '../../../components/platform/app-shell';
import { useCreateReport, useReports } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface ReportsWorkspaceProps {
  projectId: string;
}

export function ReportsWorkspace({ projectId }: ReportsWorkspaceProps) {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
  const reportsQuery = useReports(projectId, context);
  const createReport = useCreateReport(projectId, context);
  const reports = reportsQuery.data ?? [];
  const [message, setMessage] = useState('Generate the first report when the project context is ready.');

  async function generateReport() {
    if (!session.accessToken) {
      setMessage('API token is required before creating a database report.');
      return;
    }

    try {
      setMessage('Generating report from approved profile and project knowledge...');
      const report = await createReport.mutateAsync({ title: 'Stakeholder AI Readiness Report' });
      setMessage('Generated report using approved profile, knowledge sources, and AI disclosure metadata.');
      router.push(`/projects/${projectId}/reports/${report.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to generate report.');
    }
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Reports</span>
          <h1>Generate consulting-grade deliverables.</h1>
          <p>Reports synthesize validated research, company profile, knowledge sources, and agent outputs.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${projectId}`}>Project workspace</Link>
          <Link className="button button-muted" href={`/projects/${projectId}/knowledge`}>Knowledge</Link>
          <Link className="button button-muted" href={`/projects/${projectId}/chat`}>AI chat</Link>
          <button className="button button-primary" onClick={() => void generateReport()} disabled={createReport.isPending}>
            {createReport.isPending ? 'Generating...' : 'Generate report'}
          </button>
        </div>
      </header>
      <section className="grid-3">
        <MetricCard label="Reports" value={String(reports.length)} detail="Loaded from backend." />
        <MetricCard label="Status" value="Ready" detail="Profile and knowledge context feed generation." />
        <MetricCard label="Disclosure" value="AI" detail="Reports show whether AI assisted generation." />
      </section>
      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={reportsQuery.isError ? 'amber' : 'green'}>{reportsQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Reports</h2>
        <div className="timeline">
          {reports.map((report) => (
            <Link className="timeline-item" href={`/projects/${projectId}/reports/${report.id}`} key={report.id}>
              <div>
                <strong>{report.title}</strong>
                <p>{report.sections.length} sections</p>
              </div>
              <Pill tone={report.status === 'READY' ? 'green' : 'amber'}>{report.status}</Pill>
            </Link>
          ))}
        </div>
        {!reportsQuery.isLoading && !reportsQuery.isError && reports.length === 0 ? (
          <div className="empty-state section-gap">
            <h3>No reports exist yet</h3>
            <p>Generate the first report now. It will open automatically when ready.</p>
            <button className="button button-primary" type="button" onClick={() => void generateReport()} disabled={createReport.isPending}>
              {createReport.isPending ? 'Generating...' : 'Generate first report'}
            </button>
          </div>
        ) : null}
        <p className="section-gap">{message}</p>
      </section>
      <Card className="section-gap">
        <h2>Available report sections</h2>
        <div className="flow-map"><Pill>Executive Summary</Pill><Pill>Key Findings</Pill><Pill>Priority Opportunities</Pill><Pill>30-Day Roadmap</Pill><Pill>Risks & Assumptions</Pill></div>
      </Card>
    </div>
  );
}
