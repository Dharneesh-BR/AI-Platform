import Link from 'next/link';
import { Card, MetricCard, Pill } from '../components/platform/app-shell';

const flow = ['Auth', 'Organizations', 'Projects', 'Onboarding', 'Discovery', 'Research', 'Knowledge', 'LangGraph', 'Reports'];

export default function HomePage() {
  return (
    <main className="workspace">
      <section className="card hero-card">
        <span className="eyebrow">Magnafic AI Platform</span>
        <h1>Company-aware consulting workflows from onboarding to boardroom-ready reports.</h1>
        <p>
          Magnafic AI turns project setup, company discovery, research, knowledge retrieval,
          and AI-assisted strategy into one governed enterprise workflow.
        </p>
        <div className="flow-map">
          {flow.map((item) => (
            <Pill key={item}>{item}</Pill>
          ))}
        </div>
        <div className="section-gap topbar-actions">
          <Link className="button button-primary" href="/projects">
            Open projects
          </Link>
          <Link className="button button-muted" href="/dashboard">
            View workspace
          </Link>
        </div>
      </section>

      <section className="grid-3 section-gap">
        <MetricCard label="Lifecycle" value="8 states" detail="Navigation is driven by project lifecycle, never boolean flags." />
        <MetricCard label="Discovery" value="Async" detail="BullMQ handles long-running company discovery without blocking UI." />
        <MetricCard label="Context" value="Richer AI" detail="Research and LangGraph receive company profile and knowledge context." />
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <h2>Live project workspace</h2>
          <p>Connect to the API to view project lifecycle, discovery progress, knowledge, research, chat, and reports.</p>
          <div className="pill-row section-gap">
            <Pill tone="green">API-backed</Pill>
            <Pill tone="green">Tenant scoped</Pill>
            <Pill tone="amber">Requires database</Pill>
          </div>
        </Card>
        <Card>
          <h2>Architecture posture</h2>
          <div className="timeline">
            <div className="timeline-item"><strong>Clean modules</strong><span>Ports + adapters</span></div>
            <div className="timeline-item"><strong>Tenant-aware</strong><span>Organization scoped</span></div>
            <div className="timeline-item"><strong>Future-ready</strong><span>LiteLLM + LangGraph</span></div>
          </div>
        </Card>
      </section>
    </main>
  );
}
