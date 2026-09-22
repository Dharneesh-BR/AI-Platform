'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, MetricCard, Pill } from '../../../components/platform/app-shell';
import { useCreateReport, useReports } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface ReportsWorkspaceProps {
  projectId: string;
}

export function ReportsWorkspace({ projectId }: ReportsWorkspaceProps) {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
  const reportsQuery = useReports(projectId, context);
  const createReport = useCreateReport(projectId, context);
  const reports = reportsQuery.data ?? [];
  const [message, setMessage] = useState('Generate a report when API auth is enabled.');

  async function generateReport() {
    if (!session.accessToken) {
      setMessage('API token is required before creating a database report.');
      return;
    }

    await createReport.mutateAsync({ title: 'Stakeholder AI Readiness Report' });
    setMessage('Generated report using live backend.');
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Reports</span>
          <h1>Generate consulting-grade deliverables.</h1>
          <p>Reports synthesize validated research, company profile, knowledge sources, and agent outputs.</p>
        </div>
        <button className="button button-primary" onClick={() => void generateReport()} disabled={createReport.isPending}>
          Generate report
        </button>
      </header>
      <section className="grid-3">
        <MetricCard label="Reports" value={String(reports.length)} detail="Loaded from backend." />
        <MetricCard label="Status" value="Ready" detail="Research context can feed generation." />
        <MetricCard label="Exports" value="PDF / PPT" detail="Presentation-ready output planned." />
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
          <p className="section-gap">No reports exist yet. Generate the first report from this page.</p>
        ) : null}
        <p className="section-gap">{message}</p>
      </section>
      <Card className="section-gap">
        <h2>Available report sections</h2>
        <div className="flow-map"><Pill>Executive Summary</Pill><Pill>SWOT</Pill><Pill>PESTLE</Pill><Pill>Competitor Matrix</Pill><Pill>Pricing Strategy</Pill><Pill>Recommendations</Pill></div>
      </Card>
    </div>
  );
}
