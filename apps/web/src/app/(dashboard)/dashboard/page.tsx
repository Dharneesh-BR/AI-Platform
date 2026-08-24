import Link from 'next/link';
import { Card, MetricCard, Pill, ProgressBar } from '../../../components/platform/app-shell';

export default function DashboardPage() {
  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Consulting Command Center</span>
          <h1>Good morning. Your AI workspace is getting company-aware.</h1>
          <p>Track project onboarding, discovery health, research readiness, and report production from one place.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href="/projects">View projects</Link>
          <Link className="button button-primary" href="/projects">Open live projects</Link>
        </div>
      </header>

      <section className="grid-3">
        <MetricCard label="Active projects" value="Live" detail="Loaded from backend project APIs." />
        <MetricCard label="Research sources" value="Live" detail="Company profiles, documents, website data, and notes." />
        <MetricCard label="AI readiness" value="Live" detail="Determined by each project lifecycle state." />
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <h2>Project lifecycle</h2>
          <ProgressBar value={72} />
          <div className="timeline section-gap">
            <div className="timeline-item"><strong>Project created</strong><Pill tone="green">Done</Pill></div>
            <div className="timeline-item"><strong>Onboarding complete</strong><Pill tone="green">Done</Pill></div>
            <div className="timeline-item"><strong>Company discovery</strong><Pill tone="amber">Running</Pill></div>
            <div className="timeline-item"><strong>AI workspace</strong><Pill tone="slate">Queued</Pill></div>
          </div>
        </Card>
        <Card>
          <h2>Recommended next actions</h2>
          <p>Open the Projects page after starting the API and database to continue live delivery work.</p>
          <div className="timeline">
            <div className="timeline-item"><strong>Review company profile</strong><span>After discovery completes</span></div>
            <div className="timeline-item"><strong>Upload strategy documents</strong><span>Boost knowledge quality</span></div>
            <div className="timeline-item"><strong>Start research plan</strong><span>Uses approved context</span></div>
          </div>
        </Card>
      </section>
    </div>
  );
}
